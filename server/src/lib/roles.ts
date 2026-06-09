/** Role groups for route guards */
export const INTERNAL_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'HR_HEAD',
  'HR_MANAGER',
  'RECRUITER',
  'TEAM_LEAD',
  'HIRING_MANAGER',
  'INTERVIEWER',
] as const

/** Dedicated employee referrer accounts (referral portal only) */
export const EMPLOYEE_ROLE = 'EMPLOYEE' as const

export const STAFF_MUTATE = [
  'SUPER_ADMIN',
  'ADMIN',
  'HR_HEAD',
  'HR_MANAGER',
  'RECRUITER',
  'TEAM_LEAD',
] as const

/** HR Head and Super Admin approve directly; Admin with on-behalf-of-HR-Head flag. */
export const REQ_APPROVERS = ['HR_HEAD', 'SUPER_ADMIN', 'ADMIN'] as const

export const OFFER_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR_HEAD', 'HR_MANAGER', 'TEAM_LEAD'] as const

export const INTERVIEW_SCHEDULERS = [
  'SUPER_ADMIN',
  'ADMIN',
  'HR_HEAD',
  'HR_MANAGER',
  'RECRUITER',
  'TEAM_LEAD',
  'HIRING_MANAGER',
] as const

export const INTERVIEW_PLAN_EDITORS = [
  'SUPER_ADMIN',
  'ADMIN',
  'HR_HEAD',
  'HR_MANAGER',
  'TEAM_LEAD',
  'RECRUITER',
] as const

export function isAdminRole(role: string): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
}

export function isSuperAdminRole(role: string): boolean {
  return role === 'SUPER_ADMIN'
}

export function roleMatchesAllowed(userRole: string, allowedRoles: readonly string[]): boolean {
  if (userRole === 'SUPER_ADMIN') return true
  return allowedRoles.includes(userRole)
}
