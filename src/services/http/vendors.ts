import { apiRequest } from '../../lib/apiClient'
import type { Vendor, VendorDetail, User } from '../../types'

export const vendorService = {
  list: () => apiRequest<Vendor[]>('/vendors'),

  get: (id: string) => apiRequest<VendorDetail>(`/vendors/${id}`),

  create: (data: {
    name: string
    code?: string
    email: string
    phone?: string
    website?: string
    address?: string
    contactName?: string
    notes?: string
    inviteContact?: boolean
    contactEmail?: string
  }) =>
    apiRequest<{ vendor: Vendor; invitedUser?: User; temporaryPassword?: string }>('/vendors', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (
    id: string,
    data: Partial<{
      name: string
      code: string | null
      email: string
      phone: string | null
      website: string | null
      address: string | null
      contactName: string | null
      notes: string | null
      status: Vendor['status']
    }>
  ) =>
    apiRequest<Vendor>(`/vendors/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  assignJobs: (id: string, requirementIds: string[]) =>
    apiRequest<{ assigned: string[] }>(`/vendors/${id}/assignments`, {
      method: 'POST',
      body: JSON.stringify({ requirementIds }),
    }),

  unassignJob: (id: string, requirementId: string) =>
    apiRequest<void>(`/vendors/${id}/assignments/${requirementId}`, { method: 'DELETE' }),

  inviteUser: (id: string, data: { email: string; name?: string }) =>
    apiRequest<{ user: User; emailSent: boolean; temporaryPassword?: string }>(
      `/vendors/${id}/invite`,
      { method: 'POST', body: JSON.stringify(data) }
    ),
}
