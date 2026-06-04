import { apiRequest } from '../../lib/apiClient'
import type { InterviewPanelLevel } from '../../types'

export const interviewPanelService = {
  list: () => apiRequest<InterviewPanelLevel[]>('/interview-panels'),

  seed: () =>
    apiRequest<InterviewPanelLevel[]>('/interview-panels/seed', { method: 'POST' }),

  update: (levelId: string, interviewerIds: string[]) =>
    apiRequest<InterviewPanelLevel>(`/interview-panels/${levelId}`, {
      method: 'PUT',
      body: JSON.stringify({ interviewerIds }),
    }),
}
