import { EditFileInput, MultiEditInput, editFile, multiEditFiles } from '../fs/edit';
import { GLOBAL_LOCK, withLock } from '../runtime/locks';
import { register } from './registry';
import { ToolContext } from './context';

export function registerEditFile(): void {
  register({
    name: 'edit_file',
    description:
      'Make a surgical edit to an existing file by replacing oldString with newString — cheaper ' +
      'and safer than rewriting the whole file with write_file. oldString must match exactly and ' +
      'be unique unless replaceAll:true. Subject to the same write-root / extension / readonly gates.',
    input: EditFileInput,
    handler: async (input, ctx: ToolContext) => {
      const key = (input as EditFileInput).resource || GLOBAL_LOCK;
      return withLock(key, () =>
        editFile(input as EditFileInput, {
          maxBytes: ctx.convars.maxFileBytes,
          writeRoots: ctx.convars.writeRoots,
          readonly: ctx.convars.readonly,
        }),
      );
    },
  });

  register({
    name: 'multi_edit',
    description:
      'Apply many edits in ONE call — across several files of a resource — instead of repeated ' +
      'edit_file round-trips. Every edit is validated in memory first; nothing is written unless ' +
      'all pass (no half-applied set). Each edit: { path, oldString, newString, replaceAll? }, same ' +
      'unique-match guard and gates as edit_file.',
    input: MultiEditInput,
    handler: async (input, ctx: ToolContext) => {
      const key = (input as MultiEditInput).resource || GLOBAL_LOCK;
      return withLock(key, () =>
        multiEditFiles(input as MultiEditInput, {
          maxBytes: ctx.convars.maxFileBytes,
          writeRoots: ctx.convars.writeRoots,
          readonly: ctx.convars.readonly,
        }),
      );
    },
  });
}
