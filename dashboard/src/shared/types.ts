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
