import { apiRequest } from '../../lib/apiClient'
import {
  CandidateInterviewProgress,
  InterviewPlan,
  MatchingProfile,
  Requirement,
  RequirementHiringStage,
  RequirementStatus,
} from '../../types'

export const requirementService = {
  getAll: () => apiRequest<Requirement[]>('/requirements'),

  getPending: () => apiRequest<Requirement[]>('/requirements/pending'),

  getById: async (id: string): Promise<Requirement | undefined> => {
    try {
      return await apiRequest<Requirement>(`/requirements/${id}`)
    } catch {
      return undefined
    }
  },

  create: (data: Omit<Requirement, 'id' | 'createdAt' | 'filled' | 'updatedAt'>) =>
    apiRequest<Requirement>('/requirements', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<Requirement>, user?: { uid: string; role: string }) =>
    apiRequest<Requirement>(`/requirements/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ ...data, _user: user }),
    }),

  updateStatus: (id: string, status: RequirementStatus) =>
    apiRequest<Requirement>(`/requirements/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  updateHiringStage: (id: string, hiringStage: RequirementHiringStage) =>
    apiRequest<Requirement>(`/requirements/${id}/hiring-stage`, {
      method: 'PATCH',
      body: JSON.stringify({ hiringStage }),
    }),

  cancel: (id: string, payload: { closureReason: string; closedAt: string }) =>
    apiRequest<Requirement>(`/requirements/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  approve: (id: string, options?: { onBehalfOfHrHead?: boolean }) =>
    apiRequest<Requirement>(`/requirements/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify(options ?? {}),
    }),

  reject: (id: string, options?: { onBehalfOfHrHead?: boolean }) =>
    apiRequest<Requirement>(`/requirements/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify(options ?? {}),
    }),

  assignRecruiter: (id: string, recruiterId: string) =>
    apiRequest<Requirement>(`/requirements/${id}/assign-recruiter`, {
      method: 'POST',
      body: JSON.stringify({ recruiterId }),
    }),

  unassignRecruiter: (id: string, recruiterId: string) =>
    apiRequest<Requirement>(`/requirements/${id}/assign-recruiter/${recruiterId}`, {
      method: 'DELETE',
    }),

  setVisibility: (id: string, visibleToCandidates: boolean) =>
    apiRequest<Requirement>(`/requirements/${id}/visibility`, {
      method: 'PATCH',
      body: JSON.stringify({ visibleToCandidates }),
    }),

  setReferralVisibility: (
    id: string,
    visibleToReferrals: boolean,
    referralBonusAmount?: number | null
  ) =>
    apiRequest<Requirement>(`/requirements/${id}/referral-visibility`, {
      method: 'PATCH',
      body: JSON.stringify({ visibleToReferrals, referralBonusAmount }),
    }),

  delete: (id: string) =>
    apiRequest<void>(`/requirements/${id}`, { method: 'DELETE' }),

  getMatchingProfiles: (id: string) =>
    apiRequest<{ matches: MatchingProfile[]; totalCandidates: number }>(
      `/requirements/${id}/matching-profiles`
    ),

  linkCandidate: (requirementId: string, candidateId: string) =>
    apiRequest<import('../../types').Candidate>(
      `/requirements/${requirementId}/link-candidate`,
      { method: 'POST', body: JSON.stringify({ candidateId }) }
    ),

  getInterviewPlan: (requirementId: string) =>
    apiRequest<InterviewPlan>(`/requirements/${requirementId}/interview-plan`),

  updateInterviewPlan: (
    requirementId: string,
    stages: Array<{
      id?: string
      name: string
      interviewType?: InterviewPlan['stages'][0]['interviewType']
      defaultDuration?: number
      defaultInterviewerIds?: string[]
    }>
  ) =>
    apiRequest<InterviewPlan>(`/requirements/${requirementId}/interview-plan`, {
      method: 'PUT',
      body: JSON.stringify({ stages }),
    }),

  getCandidateInterviewProgress: (requirementId: string, candidateId: string) =>
    apiRequest<CandidateInterviewProgress>(
      `/requirements/${requirementId}/interview-plan/candidate/${candidateId}/progress`
    ),
}
