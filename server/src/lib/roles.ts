/** Role groups for route guards */
export const INTERNAL_ROLES = [
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
  'ADMIN',
  'HR_HEAD',
  'HR_MANAGER',
  'RECRUITER',
  'TEAM_LEAD',
] as const

/** HR Head directly; Admin with on-behalf-of-HR-Head flag (see requirementApproval). */
export const REQ_APPROVERS = ['HR_HEAD', 'ADMIN'] as const

export const OFFER_ROLES = ['ADMIN', 'HR_HEAD', 'HR_MANAGER', 'TEAM_LEAD'] as const

export const INTERVIEW_SCHEDULERS = [
  'ADMIN',
  'HR_HEAD',
  'HR_MANAGER',
  'RECRUITER',
  'TEAM_LEAD',
  'HIRING_MANAGER',
] as const

export const INTERVIEW_PLAN_EDITORS = [
  'ADMIN',
  'HR_HEAD',
  'HR_MANAGER',
  'TEAM_LEAD',
  'RECRUITER',
] as const
