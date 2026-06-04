import { apiRequest } from '../../lib/apiClient'
import { FeatureTagKey, LoginHistoryEntry, User, UserRole } from '../../types'

export const userService = {
  getById: async (uid: string): Promise<User | undefined> => {
    try {
      return await apiRequest<User>(`/users/${uid}`)
    } catch {
      return undefined
    }
  },

  updateMe: (data: {
    name?: string
    phoneNumber?: string
    address?: string
    themePreference?: 'light' | 'dark' | 'system'
    avatar?: string
  }) =>
    apiRequest<User>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  update: async (uid: string, data: Partial<User>): Promise<void> => {
    if (data.role) await userService.updateRole(uid, data.role)
    if (data.status) await userService.toggleStatus(uid, data.status)
  },

  updateProfile: (
    uid: string,
    data: {
      name?: string
      department?: string | null
      phoneNumber?: string | null
      address?: string | null
    }
  ) =>
    apiRequest<User>(`/users/${uid}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  resetPassword: (
    uid: string,
    data: {
      newPassword?: string
      generateTemporary?: boolean
      sendEmail?: boolean
    }
  ) =>
    apiRequest<{
      ok: boolean
      emailSent: boolean
      temporaryPassword?: string
      emailWarning?: string
    }>(
      `/users/${uid}/reset-password`,
      { method: 'POST', body: JSON.stringify(data) }
    ),

  list: async (): Promise<User[]> => apiRequest<User[]>('/users'),

  getLoginHistory: (uid: string) =>
    apiRequest<LoginHistoryEntry[]>(`/users/${uid}/login-history`),

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

  updateTags: (uid: string, tags: FeatureTagKey[]) =>
    apiRequest<User>(`/users/${uid}/tags`, {
      method: 'PATCH',
      body: JSON.stringify({ tags }),
    }),

  invite: async (data: {
    email: string
    name?: string
    role: UserRole
    department?: string
  }): Promise<{ user: User; emailSent: boolean; temporaryPassword?: string }> => {
    return apiRequest('/users/invite', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}
