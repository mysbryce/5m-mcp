import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { Envelope, err, ok } from '../util/envelope';
import { VALID_RESOURCE_NAME, deriveWriteRootAbsolute } from './sandbox';

export const CreateResourceInput = z.object({
  name: z.string().min(1),
  writeRoot: z.string().optional(),
  description: z.string().optional(),
  author: z.string().optional(),
});
export type CreateResourceInput = z.infer<typeof CreateResourceInput>;

export type CreateResourceOutput = {
  name: string;
  absPath: string;
  files: string[];
};

const MANIFEST_TEMPLATE = (name: string, author: string, description: string) =>
  `fx_version 'cerulean'
game 'common'

author '${author}'
description '${description}'
version '0.1.0'

server_scripts {
  'server.lua',
}
`;

const SERVER_LUA = (name: string) =>
  `print('^2[${name}]^7 up')
`;

const README_MD = (name: string) =>
  `# ${name}

Scaffolded by agent_api.
`;

export async function createResource(
  input: CreateResourceInput,
  ctx: { writeRoots: string[]; readonly: boolean },
): Promise<Envelope<CreateResourceOutput>> {
  if (ctx.readonly) {
    return err('COMMAND_NOT_ALLOWED', 'Server is in read-only mode.');
  }

  if (!VALID_RESOURCE_NAME.test(input.name)) {
    return err('INVALID_INPUT', 'Resource name must be [a-zA-Z][a-zA-Z0-9_-]{0,63}.', {
      name: input.name,
    });
  }

  const writeRoot = input.writeRoot ?? ctx.writeRoots[0];
  if (!writeRoot) {
    return err('PATH_OUTSIDE_SANDBOX', 'No write root configured.');
  }
  if (!ctx.writeRoots.includes(writeRoot)) {
    return err('PATH_OUTSIDE_SANDBOX', `writeRoot must be one of: ${ctx.writeRoots.join(', ')}`);
  }

  const rootAbs = deriveWriteRootAbsolute(writeRoot);
  if (!rootAbs) {
    return err(
      'PATH_OUTSIDE_SANDBOX',
      `Cannot resolve write root to absolute path: ${writeRoot}. ` +
        `agent_api must itself live inside this root.`,
    );
  }

  const resourceAbs = join(rootAbs, input.name);

  try {
    await fs.stat(resourceAbs);
    return err('INVALID_INPUT', `Resource folder already exists: ${input.name}`);
  } catch {
    // good, does not exist
  }

  const author = input.author ?? 'agent';
  const description = input.description ?? 'Generated resource';

  await fs.mkdir(resourceAbs, { recursive: true });
  const files = [
    ['fxmanifest.lua', MANIFEST_TEMPLATE(input.name, author, description)],
    ['server.lua', SERVER_LUA(input.name)],
    ['README.md', README_MD(input.name)],
  ] as const;

  await Promise.all(
    files.map(([name, content]) => fs.writeFile(join(resourceAbs, name), content, 'utf8')),
  );

  return ok({
    name: input.name,
    absPath: resourceAbs,
    files: files.map(([n]) => n),
  });
}
