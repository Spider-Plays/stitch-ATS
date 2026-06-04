import { apiRequest } from '../../lib/apiClient'

export type ClientCatalogItem = {
  id: string
  name: string
}

export const clientService = {
  list: () => apiRequest<ClientCatalogItem[]>('/clients'),

  create: (name: string) =>
    apiRequest<ClientCatalogItem>('/clients', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  remove: (id: string) =>
    apiRequest<void>(`/clients/${id}`, { method: 'DELETE' }),
}
