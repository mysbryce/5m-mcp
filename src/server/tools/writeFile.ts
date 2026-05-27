import { WriteFileInput, writeFile } from '../fs/write';
import { GLOBAL_LOCK, withLock } from '../runtime/locks';
import { register } from './registry';
import { ToolContext } from './context';

export function registerWriteFile(): void {
  register({
    name: 'write_file',
    description:
      'Write a file inside a resource that lives under one of the configured write roots. ' +
      'Pass createDirs:true to mkdir -p the parent directory.',
    input: WriteFileInput,
    handler: async (input, ctx: ToolContext) => {
      const key = (input as WriteFileInput).resource || GLOBAL_LOCK;
      return withLock(key, () =>
        writeFile(input as WriteFileInput, {
          maxBytes: ctx.convars.maxFileBytes,
          writeRoots: ctx.convars.writeRoots,
          readonly: ctx.convars.readonly,
        }),
      );
    },
  });
}
