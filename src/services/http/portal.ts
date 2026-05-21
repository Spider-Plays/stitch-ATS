import { apiRequest } from '../../lib/apiClient'
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

export type PortalData =
  | {
      linked: false
      message: string
      user: { name: string; email: string }
    }
  | {
      linked: true
      candidate: Candidate
      requirement: Requirement | null
      requirementHidden?: boolean
      requirementMessage?: string
      interviews: Interview[]
      offers: Offer[]
    }

export type PortalApplyResult = {
  alreadyApplied: boolean
  candidate: import('../../types').Candidate
}

export const portalService = {
  getMe: () => apiRequest<PortalData>('/portal/me'),
  getOpenPositions: () => apiRequest<PortalOpenPosition[]>('/portal/positions'),
  getPosition: (id: string) => apiRequest<PortalOpenPosition>(`/portal/positions/${id}`),
  applyToPosition: (id: string) =>
    apiRequest<PortalApplyResult>(`/portal/positions/${id}/apply`, { method: 'POST' }),
}
