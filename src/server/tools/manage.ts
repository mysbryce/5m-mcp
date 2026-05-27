import { DeleteFileInput, MoveFileInput, deleteFile, moveFile } from '../fs/manage';
import { GLOBAL_LOCK, withLock } from '../runtime/locks';
import { register } from './registry';
import { ToolContext } from './context';

export function registerManageFiles(): void {
  register({
    name: 'delete_file',
    description:
      'Delete a single file inside a configured write root. Refuses directories and blocked ' +
      'segments. Subject to the same readonly / write-root gates as write_file.',
    input: DeleteFileInput,
    handler: async (input, ctx: ToolContext) => {
      const key = (input as DeleteFileInput).resource || GLOBAL_LOCK;
      return withLock(key, () =>
        deleteFile(input as DeleteFileInput, {
          writeRoots: ctx.convars.writeRoots,
          readonly: ctx.convars.readonly,
        }),
      );
    },
  });

  register({
    name: 'move_file',
    description:
      'Move or rename a file within a resource (set `to` to a new name in the same folder to ' +
      'rename). `createDirs:true` makes parent folders; `overwrite:true` replaces an existing ' +
      'destination. Same readonly / write-root / extension gates as write_file.',
    input: MoveFileInput,
    handler: async (input, ctx: ToolContext) => {
      const key = (input as MoveFileInput).resource || GLOBAL_LOCK;
      return withLock(key, () =>
        moveFile(input as MoveFileInput, {
          writeRoots: ctx.convars.writeRoots,
          readonly: ctx.convars.readonly,
        }),
      );
    },
  });
}
