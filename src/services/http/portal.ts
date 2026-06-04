import { apiRequest, uploadFormData } from '../../lib/apiClient'
import { Candidate, Interview, Offer, Requirement } from '../../types'

export type PortalOpenPosition = {
  id: string
  jobCode: string
  client?: string
  title: string
  department: string
  location?: string
  priority?: string
  openings: number
  filled: number
  description?: string
  updatedAt: string
}

export type PortalProfileInput = {
  firstName: string
  lastName: string
  phone: string
  location: string
  totalExperience: string
  currentCompany: string
  currentCTC: string
  expectedCTC: string
  noticePeriod: string
  pan: string
  linkedIn?: string
  portfolio?: string
}

export type PortalProfileResult = {
  candidate: Candidate
  profileComplete: boolean
  missingFields: string[]
}

export type PortalData =
  | {
      linked: false
      profileComplete: boolean
      missingFields: string[]
      message: string
      user: { name: string; email: string }
    }
  | {
      linked: true
      profileComplete: boolean
      missingFields: string[]
      candidate: Candidate
      requirement: Requirement | null
      requirementHidden?: boolean
      requirementMessage?: string
      interviews: Interview[]
      offers: Offer[]
      user: { name: string; email: string }
    }

export type PortalApplyResult = {
  alreadyApplied: boolean
  candidate: Candidate
}

export type PortalJobStatus = 'ACTIVE' | 'CLOSED'

export type PortalApplication = {
  requirementId: string
  jobCode: string
  title: string
  department: string
  client?: string
  location?: string
  description?: string
  requirementStatus: string
  pipelineStatus: string
  portalJobStatus: PortalJobStatus
  closedReason?: string
  matchScore: number
  appliedAt: string
  isCurrent: boolean
  listedOnPortal: boolean
}

export type PortalApplicationUpdate = {
  id: string
  action: string
  title: string
  summary: string
  at: string
  performerName?: string
}

export type PortalApplicationDetail = {
  application: PortalApplication
  interviews: Interview[]
  offers: Offer[]
  updates: PortalApplicationUpdate[]
}

export const portalService = {
  getMe: () => apiRequest<PortalData>('/portal/me'),
  getApplications: () =>
    apiRequest<{ applications: PortalApplication[] }>('/portal/applications'),
  getApplication: (requirementId: string) =>
    apiRequest<PortalApplicationDetail>(`/portal/applications/${requirementId}`),
  saveProfile: (data: PortalProfileInput) =>
    apiRequest<PortalProfileResult>('/portal/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  uploadResume: (file: File) => {
    const formData = new FormData()
    formData.append('resume', file)
    return uploadFormData<PortalProfileResult>('/portal/profile/resume', formData)
  },
  getOpenPositions: () => apiRequest<PortalOpenPosition[]>('/portal/positions'),
  getPosition: (id: string) => apiRequest<PortalOpenPosition>(`/portal/positions/${id}`),
  applyToPosition: (id: string) =>
    apiRequest<PortalApplyResult>(`/portal/positions/${id}/apply`, { method: 'POST' }),
}
