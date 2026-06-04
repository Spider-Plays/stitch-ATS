import type { Candidate } from '../types'

/** Candidate portal sign-ups and job applications (self-applied). */
export function isCareersCandidate(candidate: Candidate): boolean {
  return candidate.source === 'Candidate Portal'
}

/** Profiles submitted via the employee referral portal (ERP). */
export function isEmployeeReferralCandidate(candidate: Candidate): boolean {
  if (candidate.referredByUserId) return true
  return candidate.source.startsWith('Employee Referral')
}

export function employeeReferralSourceLabel(candidate: Candidate): string {
  if (candidate.source.startsWith('Employee Referral:')) {
    return candidate.source.replace(/^Employee Referral:\s*/, '')
  }
  if (candidate.referralRelationship) {
    return candidate.referralRelationship
  }
  return candidate.source
}

export function careersCandidateStats(candidates: Candidate[]) {
  const pool = candidates.filter(isCareersCandidate)
  return {
    total: pool.length,
    active: pool.filter((c) => c.status !== 'HIRED' && c.status !== 'REJECTED').length,
    hired: pool.filter((c) => c.status === 'HIRED').length,
  }
}

export function employeeReferralStats(candidates: Candidate[]) {
  const pool = candidates.filter(isEmployeeReferralCandidate)
  return {
    total: pool.length,
    active: pool.filter((c) => c.status !== 'HIRED' && c.status !== 'REJECTED').length,
    hired: pool.filter((c) => c.status === 'HIRED').length,
  }
}

export function recruitmentSourceBreakdown(candidates: Candidate[]) {
  const careers = candidates.filter(isCareersCandidate).length
  const erp = candidates.filter(isEmployeeReferralCandidate).length
  const vendor = candidates.filter((c) => c.source.startsWith('Vendor:')).length
  const other = candidates.length - careers - erp - vendor
  return { careers, erp, vendor, other, total: candidates.length }
}
