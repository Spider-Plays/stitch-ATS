import type { Interview } from '../types'

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

export function isAssignedInterviewer(
  interview: Interview,
  userId?: string | null
): boolean {
  return !!userId && interview.interviewerIds.includes(userId)
}

/** Resume + join actions for users assigned to this interview. */
export function showInterviewerSessionActions(
  interview: Interview,
  userId?: string | null
): boolean {
  if (interview.status === 'CANCELLED') return false
  return isAssignedInterviewer(interview, userId)
}

/** Interviews visible to the current user (all for staff; assigned only for interviewers). */
export function scopeInterviewsForUser(
  interviews: Interview[],
  role?: string | null,
  userId?: string | null
): Interview[] {
  if (role === 'INTERVIEWER' && userId) {
    return interviews.filter((i) => isAssignedInterviewer(i, userId))
  }
  return interviews
}
