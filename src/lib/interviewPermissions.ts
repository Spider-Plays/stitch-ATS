const INTERVIEW_SCHEDULER_ROLES = [
  'ADMIN',
  'HR_HEAD',
  'HR_MANAGER',
  'RECRUITER',
  'TEAM_LEAD',
  'HIRING_MANAGER',
] as const

export function canScheduleInterviews(role?: string): boolean {
  return !!role && (INTERVIEW_SCHEDULER_ROLES as readonly string[]).includes(role)
}
