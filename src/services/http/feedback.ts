import { apiRequest, getToken } from '../../lib/apiClient'
import { Feedback } from '../../types'

export const feedbackService = {
  getByInterviewId: (interviewId: string) =>
    apiRequest<Feedback[]>(`/feedback/by-interview/${interviewId}`),

  getByCandidateId: (candidateId: string) =>
    apiRequest<Feedback[]>(`/feedback/by-candidate/${candidateId}`),

  getById: (id: string) => apiRequest<Feedback>(`/feedback/${id}`),

  create: (data: Omit<Feedback, 'id' | 'createdAt' | 'interviewerName'>) =>
    apiRequest<Feedback>('/feedback', { method: 'POST', body: JSON.stringify(data) }),

  downloadHtml: async (id: string, filename: string): Promise<void> => {
    const token = getToken()
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await fetch(`/api/feedback/${id}/download`, { headers })
    if (!res.ok) throw new Error('Download failed')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  },
}
