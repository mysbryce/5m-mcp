import { z } from 'zod';
import { ok } from '../util/envelope';
import { register } from './registry';
import { enabledPreferences } from '../dashboard/preferences';

const INSTRUCTIONS =
  'These are USER PREFERENCES, not requirements and not the task. They describe how the user ' +
  'likes resources structured, coded, and styled — covering Lua AND UI. Before scaffolding or ' +
  'editing, read each preference; when it references an example folder (exampleResource / ' +
  'examplePath), open that folder with read_file/list_resources and mirror its conventions so ' +
  'your output stays consistent with how the user works. Apply the relevant type for the work ' +
  'at hand: structure → file/folder layout, coding → code style & patterns, ui-design → UI stack ' +
  'and visual style.';

export function registerListPreferences(): void {
  register({
    name: 'list_preferences',
    description:
      'List the user-defined development preferences (structure / coding / ui-design) configured ' +
      'in the dashboard. Call this before scaffolding or making non-trivial edits so your output ' +
      'matches how the user likes their FiveM resources built (Lua and UI).',
    input: z.object({}).strict(),
    handler: async () =>
      ok({
        instructions: INSTRUCTIONS,
        preferences: enabledPreferences(),
      }),
  });
}
