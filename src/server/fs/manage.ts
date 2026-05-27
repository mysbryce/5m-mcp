import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';
import { z } from 'zod';
import { Envelope, err, ok } from '../util/envelope';
import { checkWriteExtension, checkWriteRoot, resolveResourcePath } from './sandbox';

type WriteCtx = { writeRoots: string[]; readonly: boolean };

export const DeleteFileInput = z
  .object({
    resource: z.string().min(1),
    path: z.string().min(1),
  })
  .strict();
export type DeleteFileInput = z.infer<typeof DeleteFileInput>;

export async function deleteFile(
  input: DeleteFileInput,
  ctx: WriteCtx,
): Promise<Envelope<{ resource: string; path: string; deleted: boolean }>> {
  if (ctx.readonly) return err('COMMAND_NOT_ALLOWED', 'Server is in read-only mode.');

  const resolved = resolveResourcePath(input.resource, input.path);
  if (!resolved.ok) return resolved;

  const rootCheck = checkWriteRoot(resolved.data.resourceRoot, ctx.writeRoots);
  if (!rootCheck.ok) return rootCheck;

  let stat;
  try {
    stat = await fs.stat(resolved.data.absPath);
  } catch {
    return err('NOT_FOUND', 'File not found.', { resource: input.resource, path: input.path });
  }
  if (!stat.isFile()) {
    return err('INVALID_INPUT', 'Path is not a regular file (refusing to delete a directory).');
  }

  await fs.unlink(resolved.data.absPath);
  return ok({ resource: input.resource, path: input.path, deleted: true });
}

export const MoveFileInput = z
  .object({
    resource: z.string().min(1),
    from: z.string().min(1),
    to: z.string().min(1),
    createDirs: z.boolean().optional(),
    overwrite: z.boolean().optional(),
  })
  .strict();
export type MoveFileInput = z.infer<typeof MoveFileInput>;

export async function moveFile(
  input: MoveFileInput,
  ctx: WriteCtx,
): Promise<Envelope<{ resource: string; from: string; to: string; moved: boolean }>> {
  if (ctx.readonly) return err('COMMAND_NOT_ALLOWED', 'Server is in read-only mode.');

  const src = resolveResourcePath(input.resource, input.from);
  if (!src.ok) return src;
  const dst = resolveResourcePath(input.resource, input.to);
  if (!dst.ok) return dst;

  const rootCheck = checkWriteRoot(src.data.resourceRoot, ctx.writeRoots);
  if (!rootCheck.ok) return rootCheck;

  const extCheck = checkWriteExtension(dst.data.absPath);
  if (!extCheck.ok) return extCheck;

  try {
    await fs.stat(src.data.absPath);
  } catch {
    return err('NOT_FOUND', 'Source file not found.', { from: input.from });
  }

  if (!input.overwrite) {
    let exists = true;
    try {
      await fs.stat(dst.data.absPath);
    } catch {
      exists = false;
    }
    if (exists) {
      return err(
        'INVALID_INPUT',
        'Destination already exists. Pass overwrite:true to replace it.',
        {
          to: input.to,
        },
      );
    }
  }

  if (input.createDirs) {
    await fs.mkdir(dirname(dst.data.absPath), { recursive: true });
  }
  await fs.rename(src.data.absPath, dst.data.absPath);

  return ok({ resource: input.resource, from: input.from, to: input.to, moved: true });
}
