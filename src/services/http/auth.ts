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
}
