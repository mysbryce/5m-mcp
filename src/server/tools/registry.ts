import { z, ZodTypeAny } from "zod";
import { Envelope, err } from "../util/envelope";
import { ToolContext } from "./context";

export type Tool<TInput = unknown, TOutput = unknown> = {
  name: string;
  description: string;
  input: ZodTypeAny;
  handler: (input: TInput, ctx: ToolContext) => Promise<Envelope<TOutput>>;
};

const tools = new Map<string, Tool>();

export function register<TInput, TOutput>(tool: Tool<TInput, TOutput>): void {
  tools.set(tool.name, tool as Tool);
}

export function getTool(name: string): Tool | undefined {
  return tools.get(name);
}

export function listTools(): Tool[] {
  return [...tools.values()];
}

export async function dispatch(
  name: string,
  rawInput: unknown,
  ctx: ToolContext,
): Promise<Envelope<unknown>> {
  const tool = tools.get(name);
  if (!tool) {
    return err("TOOL_NOT_FOUND", `Unknown tool: ${name}`);
  }
  const parsed = tool.input.safeParse(rawInput ?? {});
  if (!parsed.success) {
    return err("INVALID_INPUT", "Input validation failed.", {
      issues: parsed.error.issues,
    });
  }
  try {
    return await tool.handler(parsed.data, ctx);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return err("INTERNAL", message);
  }
}

export { z };
