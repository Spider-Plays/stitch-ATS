export const INTERVIEW_PLAN_EDIT_ROLES = [
  'ADMIN',
  'HR_HEAD',
  'HR_MANAGER',
  'TEAM_LEAD',
  'RECRUITER',
] as const

export function canEditInterviewPlan(role?: string | null): boolean {
  return INTERVIEW_PLAN_EDIT_ROLES.includes(role as (typeof INTERVIEW_PLAN_EDIT_ROLES)[number])
}
