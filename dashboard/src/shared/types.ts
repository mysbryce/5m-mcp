export type Role = 'master' | 'member';

export interface PublicUser {
  id: string;
  username: string;
  role: Role;
  createdAt: string;
}

export type PermType = 'bool' | 'csv' | 'int' | 'enum';

export interface PermDescriptor {
  convar: string;
  label: string;
  group: string;
  type: PermType;
  description: string;
  options?: string[];
  default: string;
}

export type PermValues = Record<string, string>;

export type PreferenceType = 'structure' | 'coding' | 'ui-design';

export interface Preference {
  id: string;
  type: PreferenceType;
  description: string;
  exampleResource?: string;
  examplePath?: string;
  enabled: boolean;
  createdAt: string;
}

export interface SkillTriggers {
  tools: string[];
  categories: string[];
}

export interface CustomSkill {
  id: string;
  name: string;
  description: string;
  triggers: SkillTriggers;
  enabled: boolean;
  createdAt: string;
  body: string;
}

export interface TriggerCatalog {
  tools: string[];
  categories: string[];
}

export interface BrowseResource {
  name: string;
  state: string;
}

export interface ConsoleLine {
  ts: number;
  channel: string;
  message: string;
}

export interface AuditEntry {
  ts: string;
  tool: string;
  params: unknown;
  result_code: string;
  caller: string;
}

export type TodoStatus = 'pending' | 'in_progress' | 'done';

export interface Todo {
  text: string;
  status: TodoStatus;
}

export interface WorkSession {
  resource: string;
  currentTask: string;
  todos: Todo[];
  createdAt: string;
  updatedAt: string;
}

export type RequestStatus = 'pending' | 'done';

export interface WorkRequest {
  id: string;
  resource: string;
  path: string | null;
  prompt: string;
  status: RequestStatus;
  createdAt: string;
  resolvedAt?: string;
  note?: string;
}

export interface FileNode {
  name: string;
  type: 'dir' | 'file';
  children?: FileNode[];
}
