import { z } from 'zod';
import { Envelope, err, ok } from '../util/envelope';
import { register } from './registry';
import { ToolContext } from './context';
import { getSession, listSessions, updateSession, type Todo } from '../dashboard/tasks';
import { listRequests, pendingRequests, resolveRequest } from '../dashboard/requests';

const TodoSchema = z.object({
  text: z.string().min(1),
  status: z.enum(['pending', 'in_progress', 'done']).optional(),
});

const TrackInput = z
  .object({
    resource: z.string().min(1),
    currentTask: z.string().optional(),
    todos: z.array(TodoSchema).max(100).optional(),
  })
  .strict();

const GetInput = z
  .object({
    resource: z.string().optional(),
  })
  .strict();

const ResolveInput = z
  .object({
    id: z.string().min(1),
    note: z.string().max(500).optional(),
  })
  .strict();

export function registerTrackTools(): void {
  register({
    name: 'track_work',
    description:
      'Publish your task board for a resource to the dashboard: set the current task and/or ' +
      'the todo list so a human can watch progress. Mirror your internal plan here when you ' +
      'start and after each step. Safe to call in read-only mode (writes only dashboard state).',
    input: TrackInput,
    handler: async (
      input: z.infer<typeof TrackInput>,
      _ctx: ToolContext,
    ): Promise<Envelope<unknown>> => {
      const result = updateSession({
        resource: input.resource,
        currentTask: input.currentTask,
        todos: input.todos as Todo[] | undefined,
      });
      if (!result.ok) return err('INVALID_INPUT', result.reason);
      return ok({ session: result.session });
    },
  });

  register({
    name: 'track_get',
    description:
      'Read the work board. With a resource name, returns that session (current task + todos); ' +
      'without one, returns all sessions. Useful to recover your plan after a context reset.',
    input: GetInput,
    handler: async (
      input: z.infer<typeof GetInput>,
      _ctx: ToolContext,
    ): Promise<Envelope<unknown>> => {
      if (input.resource) {
        const session = getSession(input.resource);
        if (!session) return err('NOT_FOUND', `No session for resource: ${input.resource}`);
        return ok({ session });
      }
      return ok({ sessions: listSessions() });
    },
  });

  register({
    name: 'get_requests',
    description:
      'List human-issued requests from the dashboard aimed at you (e.g. "review this file"). ' +
      'Defaults to pending only. Each has { id, resource, path|null, prompt }. Act on them, then ' +
      'call resolve_request. A null path means the request targets the whole resource.',
    input: z.object({ all: z.boolean().optional() }).strict(),
    handler: async (input: { all?: boolean }, _ctx: ToolContext): Promise<Envelope<unknown>> => {
      const requests = input.all ? listRequests() : pendingRequests();
      return ok({ requests, count: requests.length });
    },
  });

  register({
    name: 'resolve_request',
    description:
      'Mark a dashboard request done once you have handled it. Optionally include a short note ' +
      'describing what you did or found.',
    input: ResolveInput,
    handler: async (
      input: z.infer<typeof ResolveInput>,
      _ctx: ToolContext,
    ): Promise<Envelope<unknown>> => {
      const result = resolveRequest(input.id, input.note);
      if (!result.ok) return err('NOT_FOUND', result.reason);
      return ok({ request: result.request });
    },
  });
}
