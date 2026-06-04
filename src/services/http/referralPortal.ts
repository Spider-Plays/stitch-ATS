import { apiRequest, uploadFormData } from '../../lib/apiClient'
import type { Candidate } from '../../types'
import type { CandidateEmailCheck, ParsedResumeFields } from './candidates'

export type ReferralPortalPosition = {
  id: string
  jobCode: string
  client?: string
  title: string
  department: string
  location?: string
  workMode?: string
  priority?: string
  openings: number
  filled: number
  openingsRemaining: number
  description?: string
  salaryBand?: string
  experienceMinYears?: number
  experienceMaxYears?: number
  referralBonusAmount?: number
  primarySkills: string[]
  updatedAt: string
}

export type ReferralPortalMe = {
  user: {
    name: string
    email: string
    uid: string
    department?: string
    role: string
  }
  referralCode: string
  stats: {
    openJobs: number
    totalReferrals: number
    inPipeline: number
    hired: number
    rejected: number
    potentialBonus: number
    statusBreakdown: { status: string; count: number }[]
  }
  recentReferrals: {
    id: string
    name: string
    email: string
    status: string
    jobTitle?: string | null
    jobCode?: string | null
    referralRelationship?: string
    createdAt: string
    bonusAmount?: number
  }[]
}

export type ReferralSubmitPayload = {
  firstName: string
  lastName: string
  email: string
  phone: string
  location: string
  pan: string
  totalExperience: string
  currentCompany: string
  currentCTC: string
  expectedCTC: string
  noticePeriod: string
  linkedIn?: string
  portfolio?: string
  primarySkills: string[]
  secondarySkills?: string[]
  referralRelationship: string
  referralNotes?: string
}

export type ReferralDetail = {
  candidate: Candidate
  referralRelationship?: string
  referralNotes?: string
  referralBonusAmount?: number
  timeline: {
    action: string
    timestamp: string
    performerName?: string
    details?: Record<string, unknown>
  }[]
}

export const referralPortalService = {
  getMe: () => apiRequest<ReferralPortalMe>('/referral-portal/me'),
  getPositions: (params?: { q?: string; department?: string }) => {
    const search = new URLSearchParams()
    if (params?.q) search.set('q', params.q)
    if (params?.department) search.set('department', params.department)
    const qs = search.toString()
    return apiRequest<ReferralPortalPosition[]>(
      `/referral-portal/positions${qs ? `?${qs}` : ''}`
    )
  },
  getDepartments: () => apiRequest<string[]>('/referral-portal/positions/departments'),
  getPosition: (id: string) =>
    apiRequest<ReferralPortalPosition>(`/referral-portal/positions/${id}`),
  getReferrals: () => apiRequest<Candidate[]>('/referral-portal/referrals'),
  getReferral: (id: string) => apiRequest<ReferralDetail>(`/referral-portal/referrals/${id}`),

  parseResume: (file: File) => {
    const formData = new FormData()
    formData.append('resume', file)
    return uploadFormData<{ fields: ParsedResumeFields }>(
      '/referral-portal/parse-resume',
      formData
    )
  },

  checkEmail: (email: string) =>
    apiRequest<CandidateEmailCheck>(
      `/referral-portal/check-email?email=${encodeURIComponent(email.trim())}`
    ),

  submitReferral: (requirementId: string, data: ReferralSubmitPayload) =>
    apiRequest<Candidate>(`/referral-portal/positions/${requirementId}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  uploadResume: (candidateId: string, file: File) => {
    const formData = new FormData()
    formData.append('resume', file)
    return uploadFormData<Candidate>(`/referral-portal/referrals/${candidateId}/resume`, formData)
  },
}
