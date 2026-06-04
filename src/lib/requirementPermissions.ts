import type { Requirement } from '../types'

/** Roles that can update current hiring stage (Sourcing → L1 → …). */
export const HIRING_STAGE_EDIT_ROLES = ['RECRUITER', 'HR_MANAGER', 'TEAM_LEAD'] as const

/** Roles that can put jobs on hold, resume, and cancel. */
export const POSTING_CONTROL_ROLES = [
  'ADMIN',
  'HR_HEAD',
  'HR_MANAGER',
  'TEAM_LEAD',
  'HIRING_MANAGER',
] as const

/** Roles that may show/hide a requirement on the candidate portal. */
export const PORTAL_VISIBILITY_ROLES = [
  'ADMIN',
  'HR_HEAD',
  'HR_MANAGER',
  'TEAM_LEAD',
] as const

/** Roles that can create new job requirements. */
export const REQUIREMENT_CREATE_ROLES = [
  'ADMIN',
  'HR_HEAD',
  'HR_MANAGER',
  'HIRING_MANAGER',
] as const

/** HR Head approves directly; Admin may approve on behalf of HR Head. */
export const REQ_APPROVAL_ROLES = ['HR_HEAD', 'ADMIN'] as const

export function canManagePostingControls(role?: string | null): boolean {
  return POSTING_CONTROL_ROLES.includes(role as (typeof POSTING_CONTROL_ROLES)[number])
}

/** Posting actions (hold / cancel) for a specific requirement. */
export function canManageRequirementPosting(
  role: string | undefined | null,
  requirement: Pick<Requirement, 'createdBy' | 'hiringManager'>,
  user?: { uid: string; name?: string } | null
): boolean {
  if (!canManagePostingControls(role)) return false
  if (role === 'HIRING_MANAGER') {
    return isRequirementHiringManager(requirement, user)
  }
  return true
}

export function canControlPortalVisibility(role?: string | null): boolean {
  return PORTAL_VISIBILITY_ROLES.includes(role as (typeof PORTAL_VISIBILITY_ROLES)[number])
}

export function canCreateRequirement(role?: string | null): boolean {
  return REQUIREMENT_CREATE_ROLES.includes(role as (typeof REQUIREMENT_CREATE_ROLES)[number])
}

export function isRequirementHiringManager(
  requirement: Pick<Requirement, 'createdBy' | 'hiringManager'>,
  user?: { uid: string; name?: string } | null
): boolean {
  if (!user?.uid) return false
  if (requirement.createdBy === user.uid) return true
  if (requirement.hiringManager === user.uid) return true
  if (!user.name?.trim()) return false
  return (
    requirement.hiringManager.trim().toLowerCase() === user.name.trim().toLowerCase()
  )
}

export function canEditRequirement(
  role: string | undefined | null,
  requirement: Pick<Requirement, 'createdBy' | 'hiringManager'>,
  user?: { uid: string; name?: string } | null
): boolean {
  if (!role || !user) return false
  if (['ADMIN', 'HR_HEAD', 'HR_MANAGER'].includes(role)) return true
  if (role === 'HIRING_MANAGER') {
    return isRequirementHiringManager(requirement, user)
  }
  if (role === 'RECRUITER' || role === 'TEAM_LEAD') {
    return requirement.createdBy === user.uid
  }
  return false
}

/** Update pipeline stage (Sourcing → L1 → …) on live/on-hold jobs. */
export function canUpdateHiringStage(
  role: string | undefined | null,
  requirement: Pick<Requirement, 'status'>
): boolean {
  if (requirement.status !== 'LIVE' && requirement.status !== 'ON_HOLD') return false
  return HIRING_STAGE_EDIT_ROLES.includes(role as (typeof HIRING_STAGE_EDIT_ROLES)[number])
}

/** Inline admin edit panel on requirement detail (not for hiring managers). */
export function canUseAdminRequirementEditor(role?: string | null): boolean {
  return ['ADMIN', 'HR_HEAD', 'HR_MANAGER', 'TEAM_LEAD'].includes(role ?? '')
}

export function canUseHiringManagerEditPage(
  role: string | undefined | null,
  requirement: Pick<Requirement, 'createdBy' | 'hiringManager'>,
  user?: { uid: string; name?: string } | null
): boolean {
  return role === 'HIRING_MANAGER' && canEditRequirement(role, requirement, user)
}

export function canApproveRequirement(role?: string | null): boolean {
  return REQ_APPROVAL_ROLES.includes(role as (typeof REQ_APPROVAL_ROLES)[number])
}

export function canApproveRequirementDirectly(role?: string | null): boolean {
  return role === 'HR_HEAD'
}

export function requiresHrHeadDelegationForApproval(role?: string | null): boolean {
  return role === 'ADMIN'
}
