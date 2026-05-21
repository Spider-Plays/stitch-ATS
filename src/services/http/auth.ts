import { apiRequest, setToken, clearToken } from '../../lib/apiClient'
import { User } from '../../types'

export const authApi = {
  login: async (email: string, password: string): Promise<User> => {
    const data = await apiRequest<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    setToken(data.token)
    return data.user
  },

  me: async (): Promise<User> => {
    return apiRequest<User>('/auth/me')
  },

  logout: () => {
    clearToken()
  },

  forgotPassword: (email: string) =>
    apiRequest<{ ok: boolean; message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, newPassword: string) =>
    apiRequest<{ ok: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    }),

  changePassword: async (currentPassword: string, newPassword: string): Promise<User> => {
    const data = await apiRequest<{ token: string; user: User }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    })
    setToken(data.token)
    return data.user
  },
}
