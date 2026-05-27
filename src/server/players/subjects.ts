import { Envelope, err, ok } from '../util/envelope';
import { getOptIn } from './registry';

const subjects = new Map<number, number>();

export function addSubject(serverId: number, max: number): Envelope<true> {
  if (!getOptIn(serverId)) {
    return err('PLAYER_NOT_OPTED_IN', `Player ${serverId} has not opted in.`);
  }
  if (subjects.has(serverId)) return ok(true);
  if (subjects.size >= max) {
    return err('SUBJECT_LIMIT_REACHED', `Active subject pool is full (${max}).`);
  }
  subjects.set(serverId, Date.now());
  return ok(true);
}

export function removeSubject(serverId: number): boolean {
  return subjects.delete(serverId);
}

export function isSubject(serverId: number): boolean {
  return subjects.has(serverId);
}

export function listSubjects(): number[] {
  // prune subjects whose opt-in expired
  for (const id of subjects.keys()) {
    if (!getOptIn(id)) subjects.delete(id);
  }
  return [...subjects.keys()];
}

export function dropPlayer(serverId: number): void {
  subjects.delete(serverId);
}
