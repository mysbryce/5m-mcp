import { promises as fs } from 'node:fs';
import { z } from 'zod';
import { Envelope, err, ok } from '../util/envelope';
import { checkWriteExtension, checkWriteRoot, resolveResourcePath } from './sandbox';

export const EditFileInput = z
  .object({
    resource: z.string().min(1),
    path: z.string().min(1),
    oldString: z.string().min(1),
    newString: z.string(),
    replaceAll: z.boolean().optional(),
  })
  .strict();
export type EditFileInput = z.infer<typeof EditFileInput>;

export type EditFileOutput = {
  resource: string;
  path: string;
  replacements: number;
  bytes: number;
};

function countOccurrences(haystack: string, needle: string): number {
  if (needle === '') return 0;
  let count = 0;
  let idx = haystack.indexOf(needle);
  while (idx !== -1) {
    count++;
    idx = haystack.indexOf(needle, idx + needle.length);
  }
  return count;
}

export async function editFile(
  input: EditFileInput,
  ctx: { maxBytes: number; writeRoots: string[]; readonly: boolean },
): Promise<Envelope<EditFileOutput>> {
  if (ctx.readonly) {
    return err('COMMAND_NOT_ALLOWED', 'Server is in read-only mode.');
  }
  if (input.oldString === input.newString) {
    return err('INVALID_INPUT', 'oldString and newString are identical.');
  }

  const resolved = resolveResourcePath(input.resource, input.path);
  if (!resolved.ok) return resolved;

  const rootCheck = checkWriteRoot(resolved.data.resourceRoot, ctx.writeRoots);
  if (!rootCheck.ok) return rootCheck;

  const extCheck = checkWriteExtension(resolved.data.absPath);
  if (!extCheck.ok) return extCheck;

  let content: string;
  try {
    content = await fs.readFile(resolved.data.absPath, 'utf8');
  } catch {
    return err('NOT_FOUND', 'File not found.', { resource: input.resource, path: input.path });
  }

  const matches = countOccurrences(content, input.oldString);
  if (matches === 0) {
    return err('INVALID_INPUT', 'oldString not found in file.');
  }
  if (matches > 1 && !input.replaceAll) {
    return err(
      'INVALID_INPUT',
      `oldString is not unique (${matches} matches). Add surrounding context to make it unique, or pass replaceAll:true.`,
      { matches },
    );
  }

  const next = input.replaceAll
    ? content.split(input.oldString).join(input.newString)
    : content.replace(input.oldString, input.newString);

  const bytes = Buffer.byteLength(next, 'utf8');
  if (bytes > ctx.maxBytes) {
    return err('FILE_TOO_LARGE', `Result exceeds ${ctx.maxBytes} bytes.`, {
      size: bytes,
      limit: ctx.maxBytes,
    });
  }

  await fs.writeFile(resolved.data.absPath, next, 'utf8');

  return ok({
    resource: input.resource,
    path: input.path,
    replacements: input.replaceAll ? matches : 1,
    bytes,
  });
}
