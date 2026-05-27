import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { err, ok } from '../util/envelope';
import { register } from './registry';
import { getResourceInfo } from '../runtime/resources';

function single(text: string, key: string): string | undefined {
  const m = text.match(new RegExp(`(?:^|\\n)\\s*${key}\\s+['"\`]([^'"\`]+)['"\`]`));
  return m?.[1];
}

/** Collect quoted strings from directives in either `key 'x'` or `key { 'a', 'b' }` form. */
function collect(text: string, keys: string[]): string[] {
  const out = new Set<string>();
  for (const key of keys) {
    const re = new RegExp(`(?:^|\\n)\\s*${key}\\b`, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const rest = text.slice(m.index + m[0].length);
      const brace = rest.match(/^\s*\{([\s\S]*?)\}/);
      if (brace) {
        for (const s of brace[1]!.matchAll(/['"`]([^'"`]+)['"`]/g)) out.add(s[1]!);
      } else {
        const one = rest.match(/^\s*['"`]([^'"`]+)['"`]/);
        if (one) out.add(one[1]!);
      }
    }
  }
  return [...out];
}

export function registerGetResourceManifest(): void {
  register({
    name: 'get_resource_manifest',
    description:
      "Parse a resource's fxmanifest.lua (or legacy __resource.lua) into structured metadata: " +
      'fx_version, game, name, author, version, description, ui_page, lua54, and the script / files / ' +
      'dependency lists. Use this to understand a resource without reading the raw manifest.',
    input: z.object({ resource: z.string().min(1) }).strict(),
    handler: async (input: { resource: string }) => {
      const info = getResourceInfo(input.resource);
      if (!info) return err('RESOURCE_NOT_FOUND', `Resource not found: ${input.resource}`);

      let file = 'fxmanifest.lua';
      let abs = join(info.path, file);
      if (!existsSync(abs)) {
        file = '__resource.lua';
        abs = join(info.path, file);
      }
      if (!existsSync(abs)) {
        return err('NOT_FOUND', `No fxmanifest.lua or __resource.lua in ${input.resource}.`);
      }

      let text: string;
      try {
        text = readFileSync(abs, 'utf8');
      } catch (e) {
        return err('INTERNAL', e instanceof Error ? e.message : 'Cannot read manifest.');
      }

      return ok({
        resource: input.resource,
        file,
        fx_version: single(text, 'fx_version'),
        game: single(text, 'game') ?? single(text, 'games'),
        name: single(text, 'name'),
        author: single(text, 'author'),
        version: single(text, 'version'),
        description: single(text, 'description'),
        ui_page: single(text, 'ui_page'),
        lua54: single(text, 'lua54'),
        server_scripts: collect(text, ['server_scripts', 'server_script']),
        client_scripts: collect(text, ['client_scripts', 'client_script']),
        shared_scripts: collect(text, ['shared_scripts', 'shared_script']),
        files: collect(text, ['files', 'file']),
        dependencies: collect(text, ['dependencies', 'dependency']),
      });
    },
  });
}
