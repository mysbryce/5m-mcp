import { z } from "zod";
import { ok } from "../util/envelope";
import { register } from "./registry";
import { ToolContext } from "./context";

const Input = z
  .object({
    lines: z.number().int().min(1).max(5000).optional(),
    sinceTs: z.number().int().min(0).optional(),
    channel: z.string().optional(),
  })
  .strict();

type Input = z.infer<typeof Input>;

export function registerTailConsole(): void {
  register({
    name: "tail_console",
    description:
      "Return recent lines from the in-memory console ring buffer. Filter by since timestamp (ms epoch) or channel.",
    input: Input,
    handler: async (input: Input, ctx: ToolContext) => {
      const opts: { lines?: number; sinceTs?: number; channel?: string } = {};
      if (input.lines !== undefined) opts.lines = input.lines;
      if (input.sinceTs !== undefined) opts.sinceTs = input.sinceTs;
      if (input.channel !== undefined) opts.channel = input.channel;
      const lines = ctx.console.tail(opts);
      return ok({
        lines,
        count: lines.length,
        bufferLength: ctx.console.length(),
      });
    },
  });
}
