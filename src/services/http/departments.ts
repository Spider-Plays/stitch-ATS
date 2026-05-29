import { apiRequest } from '../../lib/apiClient'

export type DepartmentCatalogItem = {
  id: string
  name: string
}

export const departmentService = {
  list: () => apiRequest<DepartmentCatalogItem[]>('/departments'),

  create: (name: string) =>
    apiRequest<DepartmentCatalogItem>('/departments', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  remove: (id: string) =>
    apiRequest<void>(`/departments/${id}`, { method: 'DELETE' }),
}
