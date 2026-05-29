import type { Interview } from '../types'

/** Full platform administrator */
export function isAdminRole(role?: string | null): boolean {
  return role === 'ADMIN'
}

/** Admin can edit any record regardless of ownership */
export function canEditOwnedOrAdmin(
  role: string | undefined,
  ownerId: string | undefined,
  currentUserId: string | undefined
): boolean {
  if (isAdminRole(role)) return true
  if (!ownerId || !currentUserId) return false
  return ownerId === currentUserId
}

export function canEditInterviewAsRole(interview: Interview, role?: string | null): boolean {
  if (isAdminRole(role)) return interview.status !== 'CANCELLED'
  return interview.status !== 'CANCELLED' && !interview.hasFeedback
}
