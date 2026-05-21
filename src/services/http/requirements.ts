import { apiRequest } from '../../lib/apiClient'
import { MatchingProfile, Requirement, RequirementStatus } from '../../types'

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

  approve: (id: string, user: { uid: string; role: string }) =>
    apiRequest<Requirement>(`/requirements/${id}/approve`, { method: 'POST', body: JSON.stringify(user) }),

  reject: (id: string, user: { uid: string; role: string }) =>
    apiRequest<Requirement>(`/requirements/${id}/reject`, { method: 'POST', body: JSON.stringify(user) }),

  assignRecruiter: (id: string, recruiterId: string, _currentRecruiters: string[]) =>
    apiRequest<Requirement>(`/requirements/${id}/assign-recruiter`, {
      method: 'POST',
      body: JSON.stringify({ recruiterId }),
    }),

  setVisibility: (id: string, visibleToCandidates: boolean) =>
    apiRequest<Requirement>(`/requirements/${id}/visibility`, {
      method: 'PATCH',
      body: JSON.stringify({ visibleToCandidates }),
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
}
