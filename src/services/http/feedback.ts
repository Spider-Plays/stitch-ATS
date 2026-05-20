import { apiRequest } from '../../lib/apiClient'
import { Feedback } from '../../types'

export const feedbackService = {
  getByInterviewId: (interviewId: string) =>
    apiRequest<Feedback[]>(`/feedback/by-interview/${interviewId}`),

  getByCandidateId: (candidateId: string) =>
    apiRequest<Feedback[]>(`/feedback/by-candidate/${candidateId}`),

  create: (data: Omit<Feedback, 'id'>) =>
    apiRequest<Feedback>('/feedback', { method: 'POST', body: JSON.stringify(data) }),
}
