import { z } from 'zod';
import { ok } from '../util/envelope';
import { register } from './registry';
import { listSkills } from '../dashboard/skills';

export function registerListSkills(): void {
  register({
    name: 'list_skills',
    description:
      'List the user-uploaded custom skills configured in the dashboard, with their trigger ' +
      'tools/categories and full markdown body. A skill is also auto-injected into the result of ' +
      'any tool call it triggers on, so you usually do not need to call this explicitly.',
    input: z.object({}).strict(),
    handler: async () =>
      ok({
        skills: listSkills().map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          triggers: s.triggers,
          enabled: s.enabled,
          body: s.body,
        })),
      }),
  });
}
