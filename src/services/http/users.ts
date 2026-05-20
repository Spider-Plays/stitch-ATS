import { apiRequest } from '../../lib/apiClient'
import { User, UserRole } from '../../types'

export const userService = {
  getById: async (uid: string): Promise<User | undefined> => {
    try {
      return await apiRequest<User>(`/users/${uid}`)
    } catch {
      return undefined
    }
  },

  create: async (_user: User): Promise<void> => {},

  update: async (uid: string, data: Partial<User>): Promise<void> => {
    if (data.role) await userService.updateRole(uid, data.role)
    if (data.status) await userService.toggleStatus(uid, data.status)
  },

  list: async (): Promise<User[]> => apiRequest<User[]>('/users'),

  updateRole: async (uid: string, role: UserRole): Promise<void> => {
    await apiRequest(`/users/${uid}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    })
  },

  toggleStatus: async (uid: string, status: 'ACTIVE' | 'DISABLED'): Promise<void> => {
    await apiRequest(`/users/${uid}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },
}
