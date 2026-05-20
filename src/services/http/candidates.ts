import { apiRequest } from '../../lib/apiClient'
import { Candidate } from '../../types'

export const candidateService = {
  getAll: () => apiRequest<Candidate[]>('/candidates'),

  getByRequirementId: (requirementId: string) =>
    apiRequest<Candidate[]>(`/candidates/by-requirement/${requirementId}`),

  getById: async (id: string): Promise<Candidate | undefined> => {
    try {
      return await apiRequest<Candidate>(`/candidates/${id}`)
    } catch {
      return undefined
    }
  },

  create: (data: Omit<Candidate, 'id'>) =>
    apiRequest<Candidate>('/candidates', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<Candidate>) =>
    apiRequest<Candidate>(`/candidates/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  updateStatus: (id: string, status: Candidate['status']) =>
    apiRequest<Candidate>(`/candidates/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
}
