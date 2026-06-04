import { apiRequest, getToken } from '../../lib/apiClient'
import { Interview } from '../../types'

export const interviewService = {
  getAll: () => apiRequest<Interview[]>('/interviews'),

  getById: async (id: string): Promise<Interview | undefined> => {
    try {
      return await apiRequest<Interview>(`/interviews/${id}`)
    } catch {
      return undefined
    }
  },

  getByCandidateId: (candidateId: string) =>
    apiRequest<Interview[]>(`/interviews/by-candidate/${candidateId}`),

  create: (data: Omit<Interview, 'id'>) =>
    apiRequest<Interview>('/interviews', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<Interview>) =>
    apiRequest<Interview>(`/interviews/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  updateStatus: (id: string, status: Interview['status']) =>
    apiRequest<Interview>(`/interviews/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  fetchCandidateResume: async (interviewId: string): Promise<Blob | null> => {
    const token = getToken()
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await fetch(`/api/interviews/${interviewId}/candidate-resume`, { headers })
    if (res.status === 404) return null
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error((body as { error?: string }).error || res.statusText)
    }
    return res.blob()
  },
}
