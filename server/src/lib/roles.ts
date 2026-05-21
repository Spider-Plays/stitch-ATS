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

export const STAFF_MUTATE = [
  'ADMIN',
  'HR_HEAD',
  'HR_MANAGER',
  'RECRUITER',
  'TEAM_LEAD',
] as const

export const REQ_APPROVERS = ['ADMIN', 'HR_HEAD', 'HR_MANAGER', 'HIRING_MANAGER'] as const

export const OFFER_ROLES = ['ADMIN', 'HR_HEAD', 'HR_MANAGER', 'TEAM_LEAD'] as const

export const INTERVIEW_SCHEDULERS = [
  'ADMIN',
  'HR_HEAD',
  'HR_MANAGER',
  'RECRUITER',
  'TEAM_LEAD',
  'HIRING_MANAGER',
] as const
