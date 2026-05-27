import { Envelope, err, ok } from '../util/envelope';
import { VALID_RESOURCE_NAME } from '../fs/sandbox';

const RESOURCE_VERBS = new Set(['ensure', 'start', 'stop', 'restart']);
const SAFE_NO_ARG = new Set(['refresh', 'status', 'players']);
const SAFE_TEXT_ARG = new Set(['say']);

const BANNED = new Set([
  'quit',
  'exec',
  'set',
  'sets',
  'setr',
  'add_ace',
  'add_principal',
  'remove_ace',
  'remove_principal',
  'rcon_password',
  'endpoint_add_tcp',
  'endpoint_add_udp',
]);

export type ParsedCommand =
  | { kind: 'no_arg'; verb: string }
  | { kind: 'resource'; verb: string; resource: string }
  | { kind: 'text'; verb: string; text: string };

export function parseAllowedCommand(raw: string): Envelope<ParsedCommand> {
  const trimmed = raw.trim();
  if (!trimmed) {
    return err('INVALID_INPUT', 'Empty command.');
  }
  const [verbRaw, ...rest] = trimmed.split(/\s+/);
  const verb = (verbRaw ?? '').toLowerCase();

  if (BANNED.has(verb)) {
    return err('COMMAND_NOT_ALLOWED', `Banned command: ${verb}`);
  }

  if (SAFE_NO_ARG.has(verb)) {
    if (rest.length > 0) {
      return err('INVALID_INPUT', `Command ${verb} takes no arguments.`);
    }
    return ok({ kind: 'no_arg', verb });
  }

  if (RESOURCE_VERBS.has(verb)) {
    if (rest.length !== 1) {
      return err('INVALID_INPUT', `Command ${verb} requires exactly one resource name.`);
    }
    const resource = rest[0]!;
    if (!VALID_RESOURCE_NAME.test(resource)) {
      return err('INVALID_INPUT', `Invalid resource name: ${resource}`);
    }
    return ok({ kind: 'resource', verb, resource });
  }

  if (SAFE_TEXT_ARG.has(verb)) {
    const text = rest.join(' ');
    if (!text) {
      return err('INVALID_INPUT', `Command ${verb} requires a message.`);
    }
    return ok({ kind: 'text', verb, text });
  }

  return err('COMMAND_NOT_ALLOWED', `Command not in allowlist: ${verb}`);
}

export function runConsole(command: string): void {
  ExecuteCommand(command);
}
