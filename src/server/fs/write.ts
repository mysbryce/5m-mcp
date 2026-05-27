import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';
import { z } from 'zod';
import { Envelope, err, ok } from '../util/envelope';
import { checkWriteExtension, checkWriteRoot, resolveResourcePath } from './sandbox';

export const WriteFileInput = z.object({
  resource: z.string().min(1),
  path: z.string().min(1),
  content: z.string(),
  createDirs: z.boolean().optional(),
});
export type WriteFileInput = z.infer<typeof WriteFileInput>;

export type WriteFileOutput = {
  resource: string;
  path: string;
  bytes: number;
  created: boolean;
};

export async function writeFile(
  input: WriteFileInput,
  ctx: { maxBytes: number; writeRoots: string[]; readonly: boolean },
): Promise<Envelope<WriteFileOutput>> {
  if (ctx.readonly) {
    return err('COMMAND_NOT_ALLOWED', 'Server is in read-only mode.');
  }

  const bytes = Buffer.byteLength(input.content, 'utf8');
  if (bytes > ctx.maxBytes) {
    return err('FILE_TOO_LARGE', `Content exceeds ${ctx.maxBytes} bytes.`, {
      size: bytes,
      limit: ctx.maxBytes,
    });
  }

  const resolved = resolveResourcePath(input.resource, input.path);
  if (!resolved.ok) return resolved;

  const rootCheck = checkWriteRoot(resolved.data.resourceRoot, ctx.writeRoots);
  if (!rootCheck.ok) return rootCheck;

  const extCheck = checkWriteExtension(resolved.data.absPath);
  if (!extCheck.ok) return extCheck;

  let existed = true;
  try {
    await fs.stat(resolved.data.absPath);
  } catch {
    existed = false;
  }

  if (input.createDirs) {
    await fs.mkdir(dirname(resolved.data.absPath), { recursive: true });
  }

  await fs.writeFile(resolved.data.absPath, input.content, 'utf8');

  return ok({
    resource: input.resource,
    path: input.path,
    bytes,
    created: !existed,
  });
}
