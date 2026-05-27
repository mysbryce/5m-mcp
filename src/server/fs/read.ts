import { promises as fs } from 'node:fs';
import { z } from 'zod';
import { Envelope, err, ok } from '../util/envelope';
import { checkReadExtension, resolveResourcePath } from './sandbox';

export const ReadFileInput = z.object({
  resource: z.string().min(1),
  path: z.string().min(1),
  offset: z.number().int().min(0).optional(),
  length: z.number().int().min(1).optional(),
});
export type ReadFileInput = z.infer<typeof ReadFileInput>;

export type ReadFileOutput = {
  resource: string;
  path: string;
  size: number;
  truncated: boolean;
  content: string;
};

export async function readFile(
  input: ReadFileInput,
  maxBytes: number,
): Promise<Envelope<ReadFileOutput>> {
  const resolved = resolveResourcePath(input.resource, input.path);
  if (!resolved.ok) return resolved;

  const extCheck = checkReadExtension(resolved.data.absPath);
  if (!extCheck.ok) return extCheck;

  let stat;
  try {
    stat = await fs.stat(resolved.data.absPath);
  } catch {
    return err('NOT_FOUND', 'File not found.', {
      resource: input.resource,
      path: input.path,
    });
  }
  if (!stat.isFile()) {
    return err('NOT_FOUND', 'Path is not a regular file.');
  }

  const offset = input.offset ?? 0;
  const requested = input.length;
  const remaining = Math.max(0, stat.size - offset);
  const length =
    requested === undefined
      ? Math.min(remaining, maxBytes)
      : Math.min(requested, remaining, maxBytes);

  if (requested === undefined && remaining > maxBytes) {
    return err(
      'FILE_TOO_LARGE',
      `File exceeds ${maxBytes} bytes. Use offset/length to read a window.`,
      { size: stat.size, limit: maxBytes },
    );
  }

  const handle = await fs.open(resolved.data.absPath, 'r');
  try {
    const buf = Buffer.alloc(length);
    if (length > 0) {
      await handle.read(buf, 0, length, offset);
    }
    return ok({
      resource: input.resource,
      path: input.path,
      size: stat.size,
      truncated: offset + length < stat.size,
      content: buf.toString('utf8'),
    });
  } finally {
    await handle.close();
  }
}
