export const HIRING_STAGE_EDIT_ROLES = ['RECRUITER', 'HR_MANAGER', 'TEAM_LEAD'] as const

export const POSTING_CONTROL_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'HR_HEAD',
  'HR_MANAGER',
  'TEAM_LEAD',
  'HIRING_MANAGER',
] as const

export const PORTAL_VISIBILITY_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'HR_HEAD',
  'HR_MANAGER',
  'TEAM_LEAD',
] as const

export const REQUIREMENT_CREATE_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'HR_HEAD',
  'HR_MANAGER',
  'HIRING_MANAGER',
] as const

/** HR Head and Super Admin approve directly; Admin may approve only on behalf of HR Head. */
export const REQ_APPROVAL_ROLES = ['HR_HEAD', 'SUPER_ADMIN', 'ADMIN'] as const

export type RequirementApprovalContext = {
  createdBy: string | null
  createdByRole: string | null
}

export type RequirementApprovalOptions = {
  onBehalfOfHrHead?: boolean
}

export function isRequirementHiringManager(
  auth: { userId: string; name?: string },
  requirement: { createdBy: string | null; hiringManager: string }
): boolean {
  if (requirement.createdBy === auth.userId) return true
  if (requirement.hiringManager === auth.userId) return true
  if (!auth.name?.trim()) return false
  return (
    requirement.hiringManager.trim().toLowerCase() === auth.name.trim().toLowerCase()
  )
}

export function assertCanManageRequirementPosting(
  auth: { userId: string; role: string; name?: string },
  requirement: { createdBy: string | null; hiringManager: string }
): void {
  if (['SUPER_ADMIN', 'ADMIN', 'HR_HEAD', 'HR_MANAGER', 'TEAM_LEAD'].includes(auth.role)) {
    return
  }
  if (auth.role === 'HIRING_MANAGER') {
    if (!isRequirementHiringManager(auth, requirement)) {
      throw new Error('You can only manage requirements you created or hiring-manage')
    }
    return
  }
  throw new Error('Not allowed to manage posting for this requirement')
}

export function assertCanUpdateHiringStage(
  auth: { userId: string; role: string },
  requirement: { status: string }
): void {
  if (!['LIVE', 'ON_HOLD'].includes(requirement.status)) {
    throw new Error('Hiring stage can only be updated for live or on-hold requirements')
  }
  if (!HIRING_STAGE_EDIT_ROLES.includes(auth.role as (typeof HIRING_STAGE_EDIT_ROLES)[number])) {
    throw new Error('Only recruiters, HR managers, and team leads can update hiring stage')
  }
}

export function assertCanApproveRequirement(
  auth: { userId: string; role: string },
  requirement: RequirementApprovalContext,
  options: RequirementApprovalOptions = {}
): void {
  if (auth.role === 'HIRING_MANAGER') {
    throw new Error('Hiring managers cannot approve requirements')
  }

  if (requirement.createdBy && requirement.createdBy === auth.userId) {
    throw new Error('You cannot approve a requirement you submitted')
  }

  if (auth.role === 'HR_HEAD' || auth.role === 'SUPER_ADMIN') {
    return
  }

  if (auth.role === 'ADMIN') {
    if (!options.onBehalfOfHrHead) {
      throw new Error('Admin must select “on behalf of HR Head” to approve or reject')
    }
    return
  }

  throw new Error('Only HR Head can approve or reject requirements')
}
