export type PromptArgument = {
  name: string;
  description: string;
  required?: boolean;
};

export type PromptMessage = {
  role: 'user' | 'assistant';
  content: { type: 'text'; text: string };
};

export type Prompt = {
  name: string;
  description: string;
  arguments?: PromptArgument[];
  build: (args: Record<string, string>) => PromptMessage[];
};

const prompts = new Map<string, Prompt>();

export function registerPrompt(p: Prompt): void {
  prompts.set(p.name, p);
}

export function getPrompt(name: string): Prompt | undefined {
  return prompts.get(name);
}

export function listPrompts(): Array<{
  name: string;
  description: string;
  arguments?: PromptArgument[];
}> {
  return [...prompts.values()].map((p) => ({
    name: p.name,
    description: p.description,
    ...(p.arguments ? { arguments: p.arguments } : {}),
  }));
}
