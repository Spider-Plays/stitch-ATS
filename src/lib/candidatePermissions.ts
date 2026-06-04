import type { Candidate, CandidateStatus } from '../types'
import { hasOrgWideAccess } from './orgAccess'

export function canCreateCandidate(role?: string | null): boolean {
  return ['ADMIN', 'HR_HEAD', 'HR_MANAGER', 'RECRUITER', 'TEAM_LEAD'].includes(role ?? '')
}

/** Hired candidates stay locked unless the user has org-wide access. */
export function isHiredStageLocked(
  candidate: Pick<Candidate, 'status'>,
  role?: string | null
): boolean {
  return candidate.status === 'HIRED' && !hasOrgWideAccess(role)
}

export function canChangeCandidateStage(
  candidate: Pick<Candidate, 'status'>,
  newStage: CandidateStatus,
  role?: string | null
): boolean {
  if (newStage === candidate.status) return false
  if (candidate.status === 'HIRED' && !hasOrgWideAccess(role)) return false
  return true
}

export const HIRED_STAGE_LOCK_MESSAGE =
  'Only HR leadership roles can change pipeline stage after a candidate is hired.'
