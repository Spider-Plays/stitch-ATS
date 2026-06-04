export const REFERRAL_PORTAL_ROLES = [
  'EMPLOYEE',
  'ADMIN',
  'HR_HEAD',
  'HR_MANAGER',
  'RECRUITER',
  'TEAM_LEAD',
  'HIRING_MANAGER',
  'INTERVIEWER',
] as const

export function isReferralPortalRole(role: string): boolean {
  return (REFERRAL_PORTAL_ROLES as readonly string[]).includes(role)
}
