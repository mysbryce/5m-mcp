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

export const MultiEditInput = z
  .object({
    resource: z.string().min(1),
    edits: z
      .array(
        z.object({
          path: z.string().min(1),
          oldString: z.string().min(1),
          newString: z.string(),
          replaceAll: z.boolean().optional(),
        }),
      )
      .min(1)
      .max(100),
  })
  .strict();
export type MultiEditInput = z.infer<typeof MultiEditInput>;

export type MultiEditOutput = {
  files: Array<{ path: string; replacements: number }>;
  totalReplacements: number;
};

/**
 * Apply many edits (possibly across several files in one resource) in a single
 * call. Validates every edit in memory first; writes nothing unless all pass —
 * so a bad edit can't leave a half-applied set on disk.
 */
export async function multiEditFiles(
  input: MultiEditInput,
  ctx: { maxBytes: number; writeRoots: string[]; readonly: boolean },
): Promise<Envelope<MultiEditOutput>> {
  if (ctx.readonly) return err('COMMAND_NOT_ALLOWED', 'Server is in read-only mode.');

  const byPath = new Map<string, MultiEditInput['edits']>();
  for (const e of input.edits) {
    const arr = byPath.get(e.path) ?? [];
    arr.push(e);
    byPath.set(e.path, arr);
  }

  const planned: Array<{ absPath: string; path: string; content: string; replacements: number }> =
    [];

  for (const [path, edits] of byPath) {
    const resolved = resolveResourcePath(input.resource, path);
    if (!resolved.ok) return resolved;
    const rootCheck = checkWriteRoot(resolved.data.resourceRoot, ctx.writeRoots);
    if (!rootCheck.ok) return rootCheck;
    const extCheck = checkWriteExtension(resolved.data.absPath);
    if (!extCheck.ok) return extCheck;

    let content: string;
    try {
      content = await fs.readFile(resolved.data.absPath, 'utf8');
    } catch {
      return err('NOT_FOUND', `File not found: ${path}`);
    }

    let replacements = 0;
    for (const e of edits) {
      if (e.oldString === e.newString) {
        return err('INVALID_INPUT', `oldString equals newString in ${path}.`);
      }
      const matches = countOccurrences(content, e.oldString);
      if (matches === 0) {
        return err(
          'INVALID_INPUT',
          `oldString not found in ${path}: "${e.oldString.slice(0, 40)}"`,
        );
      }
      if (matches > 1 && !e.replaceAll) {
        return err(
          'INVALID_INPUT',
          `oldString not unique in ${path} (${matches} matches). Add context or set replaceAll:true.`,
        );
      }
      content = e.replaceAll
        ? content.split(e.oldString).join(e.newString)
        : content.replace(e.oldString, e.newString);
      replacements += e.replaceAll ? matches : 1;
    }

    const bytes = Buffer.byteLength(content, 'utf8');
    if (bytes > ctx.maxBytes) {
      return err('FILE_TOO_LARGE', `${path} exceeds ${ctx.maxBytes} bytes.`);
    }
    planned.push({ absPath: resolved.data.absPath, path, content, replacements });
  }

  await Promise.all(planned.map((p) => fs.writeFile(p.absPath, p.content, 'utf8')));

  return ok({
    files: planned.map((p) => ({ path: p.path, replacements: p.replacements })),
    totalReplacements: planned.reduce((a, p) => a + p.replacements, 0),
  });
}
