import { apiRequest } from '../../lib/apiClient'
import { Offer } from '../../types'

export const offerService = {
  getAll: () => apiRequest<Offer[]>('/offers'),

  getById: async (id: string): Promise<Offer | undefined> => {
    try {
      return await apiRequest<Offer>(`/offers/${id}`)
    } catch {
      return undefined
    }
  },

  getByCandidateId: (candidateId: string) =>
    apiRequest<Offer[]>(`/offers/by-candidate/${candidateId}`),

  create: (data: Omit<Offer, 'id' | 'createdAt'>) =>
    apiRequest<Offer>('/offers', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<Offer>, userId: string) =>
    apiRequest<Offer>(`/offers/${id}`, { method: 'PATCH', body: JSON.stringify({ ...data, userId }) }),

  updateStatus: (id: string, status: Offer['status']) =>
    apiRequest<Offer>(`/offers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  remove: (id: string) => apiRequest<void>(`/offers/${id}`, { method: 'DELETE' }),
}
