import type { Interview } from '../types'
import { canEditInterview } from './interviewDisplayStatus'
import { hasOrgWideAccess } from './orgAccess'

/** Administration section (user management, catalogs, role access). */
export function isAdminRole(role?: string | null): boolean {
  return role === 'ADMIN'
}

/** Org-wide operational access (all candidates, requirements, etc.). */
export { hasOrgWideAccess } from './orgAccess'

/** HR leadership / admin can edit any record regardless of ownership */
export function canEditOwnedOrAdmin(
  role: string | undefined,
  ownerId: string | undefined,
  currentUserId: string | undefined
): boolean {
  if (hasOrgWideAccess(role)) return true
  if (!ownerId || !currentUserId) return false
  return ownerId === currentUserId
}

export function canEditInterviewAsRole(interview: Interview, role?: string | null): boolean {
  return canEditInterview(interview, role)
}

export function canDeleteFeedback(role?: string | null): boolean {
  return hasOrgWideAccess(role)
}
