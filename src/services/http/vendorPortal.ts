import { apiRequest } from '../../lib/apiClient'
import type { Candidate, Vendor } from '../../types'

export type VendorPortalPosition = {
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

export type VendorPortalMe = {
  user: { name: string; email: string; uid: string }
  vendor: Vendor
  stats: {
    assignedJobs: number
    totalSubmissions: number
    statusBreakdown: { status: string; count: number }[]
  }
  recentSubmissions: {
    id: string
    name: string
    email: string
    status: string
    jobTitle?: string | null
    jobCode?: string | null
    createdAt: string
  }[]
}

export type VendorSubmitPayload = {
  name: string
  email: string
  phone: string
  role: string
  location: string
  pan: string
  totalExperience: string
  currentCompany: string
  currentCTC: string
  expectedCTC: string
  noticePeriod: string
  linkedIn?: string
  portfolio?: string
}

export const vendorPortalService = {
  getMe: () => apiRequest<VendorPortalMe>('/vendor-portal/me'),
  getPositions: () => apiRequest<VendorPortalPosition[]>('/vendor-portal/positions'),
  getPosition: (id: string) => apiRequest<VendorPortalPosition>(`/vendor-portal/positions/${id}`),
  getSubmissions: () => apiRequest<Candidate[]>('/vendor-portal/submissions'),
  submitCandidate: (requirementId: string, data: VendorSubmitPayload) =>
    apiRequest<Candidate>(`/vendor-portal/positions/${requirementId}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}
