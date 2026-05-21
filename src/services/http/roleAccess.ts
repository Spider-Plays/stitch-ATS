import { apiRequest } from '../../lib/apiClient'
import { ConfigurableRole, PageKey } from '../../lib/pageAccess'

export type RoleAccessMap = Record<
  string,
  { pages: PageKey[]; updatedAt?: string }
>

export const roleAccessApi = {
  getMine: () =>
    apiRequest<{ role: string; pages: PageKey[] }>('/role-access/me'),

  getAll: () =>
    apiRequest<{
      access: RoleAccessMap
      pages: { key: PageKey; label: string; description: string }[]
      roles: ConfigurableRole[]
    }>('/role-access'),

  updateRole: (role: ConfigurableRole, pages: PageKey[]) =>
    apiRequest<{ role: string; pages: PageKey[] }>(`/role-access/${role}`, {
      method: 'PUT',
      body: JSON.stringify({ pages }),
    }),

  resetRole: (role: ConfigurableRole) =>
    apiRequest<{ role: string; pages: PageKey[] }>(`/role-access/${role}/reset`, {
      method: 'POST',
    }),
}
