import { request } from '../../shared/http';
import type { CustomSkill, TriggerCatalog } from '../../shared/types';

export const skillsApi = {
  list: () => request<{ skills: CustomSkill[] }>('/skills'),
  triggers: () => request<TriggerCatalog>('/skills/triggers'),
  save: (s: Partial<CustomSkill>) =>
    request<{ skill?: CustomSkill; error?: string }>('/skills', 'POST', s),
  remove: (id: string) => request<{ ok?: boolean; error?: string }>(`/skills/${id}`, 'DELETE'),
};
