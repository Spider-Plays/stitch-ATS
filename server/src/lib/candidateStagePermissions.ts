import { hasOrgWideAccess } from './orgAccess.js'

export const HIRED_STAGE_LOCK_MESSAGE =
  'Only HR leadership roles can change pipeline stage after a candidate is hired.'

export function assertCanChangeCandidateStatus(
  currentStatus: string,
  newStatus: string,
  role: string
): void {
  if (
    currentStatus === 'HIRED' &&
    newStatus !== currentStatus &&
    !hasOrgWideAccess(role)
  ) {
    throw new Error(HIRED_STAGE_LOCK_MESSAGE)
  }
}
