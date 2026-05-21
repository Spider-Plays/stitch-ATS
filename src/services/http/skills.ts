import { apiRequest } from '../../lib/apiClient'

export type SkillCatalogItem = {
  id: string
  name: string
  category: string
}

export const skillService = {
  list: () => apiRequest<SkillCatalogItem[]>('/skills'),

  create: (name: string, category?: string) =>
    apiRequest<SkillCatalogItem>('/skills', {
      method: 'POST',
      body: JSON.stringify({ name, category }),
    }),

  remove: (id: string) =>
    apiRequest<void>(`/skills/${id}`, { method: 'DELETE' }),
}
