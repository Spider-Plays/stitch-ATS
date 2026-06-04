import { apiRequest, setToken, clearToken } from '../../lib/apiClient'
import { User } from '../../types'
import { PageKey } from '../../lib/pageAccess'

export type AuthSession = {
  user: User
  allowedPages: PageKey[]
}

export const authApi = {
  login: async (email: string, password: string): Promise<AuthSession> => {
    const data = await apiRequest<{ token: string; user: User; allowedPages: PageKey[] }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    )
    setToken(data.token)
    return { user: data.user, allowedPages: data.allowedPages ?? [] }
  },

  me: async (): Promise<AuthSession> => {
    const data = await apiRequest<User & { allowedPages?: PageKey[] }>('/auth/me')
    const { allowedPages, ...user } = data
    return { user: user as User, allowedPages: allowedPages ?? [] }
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

  registerCandidate: async (input: {
    firstName: string
    lastName: string
    email: string
    password: string
  }): Promise<AuthSession> => {
    const data = await apiRequest<{ token: string; user: User; allowedPages: PageKey[] }>(
      '/auth/register-candidate',
      {
        method: 'POST',
        body: JSON.stringify(input),
      }
    )
    setToken(data.token)
    return { user: data.user, allowedPages: data.allowedPages ?? [] }
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<AuthSession> => {
    const data = await apiRequest<{ token: string; user: User; allowedPages?: PageKey[] }>(
      '/auth/change-password',
      {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      }
    )
    setToken(data.token)
    return { user: data.user, allowedPages: data.allowedPages ?? [] }
  },
}
