import { apiRequest, fetchResumeBlob, uploadFormData } from '../../lib/apiClient'
import { Candidate } from '../../types'

export type CandidateEmailCheck = {
  exists: boolean
  candidateId?: string
  name?: string
  error?: string
}

export type ParsedResumeFields = {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  location?: string
  linkedin?: string
  portfolio?: string
  totalExperience?: string
  primarySkills?: string[]
  secondarySkills?: string[]
}

export const candidateService = {
  getAll: () => apiRequest<Candidate[]>('/candidates'),

  parseResume: (file: File) => {
    const formData = new FormData()
    formData.append('resume', file)
    return uploadFormData<{ fields: ParsedResumeFields }>(
      '/candidates/parse-resume',
      formData
    )
  },

  checkEmail: (email: string) =>
    apiRequest<CandidateEmailCheck>(
      `/candidates/check-email?email=${encodeURIComponent(email.trim())}`
    ),

  getByRequirementId: (requirementId: string) =>
    apiRequest<Candidate[]>(`/candidates/by-requirement/${requirementId}`),

  getById: (id: string) => apiRequest<Candidate>(`/candidates/${id}`),

  create: (data: Omit<Candidate, 'id'>) =>
    apiRequest<Candidate>('/candidates', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<Candidate>) =>
    apiRequest<Candidate>(`/candidates/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  updateStatus: (id: string, status: Candidate['status']) =>
    apiRequest<Candidate>(`/candidates/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  uploadResume: (id: string, file: File) => {
    const formData = new FormData()
    formData.append('resume', file)
    return uploadFormData<Candidate>(`/candidates/${id}/resume`, formData)
  },

  fetchResume: (id: string) => fetchResumeBlob(id),

  deleteResume: (id: string) =>
    apiRequest<Candidate>(`/candidates/${id}/resume`, { method: 'DELETE' }),

  delete: (id: string) =>
    apiRequest<void>(`/candidates/${id}`, { method: 'DELETE' }),
}
