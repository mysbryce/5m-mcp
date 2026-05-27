import { z } from 'zod';
import { ok } from '../util/envelope';
import { register } from './registry';
import { SCAFFOLD_FIVEM_SCRIPT } from '../mcp/prompts/scaffoldFivem';

export function registerScaffoldFivemWorkflow(): void {
  register({
    name: 'scaffold_fivem_resource_workflow',
    description:
      'MANDATORY pre-flight for ANY new FiveM resource. CALL THIS TOOL FIRST whenever the ' +
      'user expresses intent to create, scaffold, build, set up, or generate a new FiveM resource — ' +
      'including phrases like "create a resource", "make a script", "build a new resource", ' +
      '"new fivem script", "scaffold a resource", "ทำ resource ใหม่", "สร้าง resource", ' +
      '"สร้าง script", "อยากได้ resource ที่...", "ขอ resource ...", "เขียน resource ใหม่", ' +
      '"build a chat system in fivem", or any equivalent in any language. ' +
      'It returns a hard-contract grill workflow that you MUST follow before calling ' +
      'create_resource / write_file / refresh_resources / ensure_resource. ' +
      'Do not call those four tools before invoking this one.',
    input: z.object({}).strict(),
    handler: async () =>
      ok({
        contract: SCAFFOLD_FIVEM_SCRIPT,
        instructions:
          'Read `contract` in full, then begin executing the grill workflow against the user. ' +
          'Ask question 1.1 first. Do not skip ahead. Do not call any scaffolding tool until the ' +
          'workflow signals confirmation.',
      }),
  });
}
