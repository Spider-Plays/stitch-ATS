import type { ActivityLog, Interview } from '@/types'
import {
  filterInterviews,
  interviewStats,
  isUpcoming,
  needsFeedback,
  type InterviewFilter,
} from '@/pages/interviews/_shared/interview.utils'

export const CANDIDATE_PROFILE_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'resume', label: 'Resume' },
  { id: 'interviews', label: 'Interviews' },
  { id: 'activity', label: 'Activity' },
] as const

export type CandidateInterviewFilter = InterviewFilter

export function candidateInterviewStats(interviews: Interview[]) {
  return interviewStats(interviews)
}

export function filterCandidateInterviews(
  interviews: Interview[],
  filter: CandidateInterviewFilter
) {
  return filterInterviews(interviews, filter)
}

export function sortCandidateInterviews(interviews: Interview[]) {
  return [...interviews].sort(
    (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
  )
}

export function upcomingCandidateInterviews(interviews: Interview[]) {
  return interviews
    .filter(isUpcoming)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
}

export function feedbackCandidateInterviews(interviews: Interview[]) {
  return interviews.filter(needsFeedback)
}
export type CandidateProfileTab = (typeof CANDIDATE_PROFILE_TABS)[number]['id']

export const PROFILE_INPUT =
  'w-full px-4 py-2.5 rounded-xl border border-primary/10 dark:border-white/10 bg-white dark:bg-white/[0.02] text-sm font-medium text-primary dark:text-white placeholder:text-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-shadow'

export const PROFILE_LABEL =
  'block text-[10px] font-bold text-primary/50 dark:text-white/50 uppercase tracking-wider mb-1.5'

export const ACTION_LABELS: Record<string, string> = {
  CREATED: 'Candidate created',
  UPDATED: 'Profile updated',
  STATUS_CHANGED: 'Stage changed',
  RESUME_UPLOADED: 'Resume uploaded',
  INTERVIEW_SCHEDULED: 'Interview scheduled',
  INTERVIEW_RESCHEDULED: 'Interview rescheduled',
  INTERVIEW_UPDATED: 'Interview updated',
  INTERVIEW_CANCELLED: 'Interview cancelled',
  INTERVIEW_FEEDBACK_DELETED: 'Interview feedback removed',
}

export function formatActivityDetails(log: ActivityLog): string | null {
  const d = log.details
  if (!d) return null
  if (typeof d === 'string') return d
  if (log.action === 'STATUS_CHANGED' && typeof d === 'object' && d !== null) {
    const parts: string[] = []
    if (d.newStatus) parts.push(`New stage: ${d.newStatus}`)
    if (d.offerDate) parts.push(`Offer: ${d.offerDate}`)
    if (d.offerMonth) parts.push(`Offer month: ${d.offerMonth}`)
    if (d.offerQuarter) parts.push(`Offer quarter: ${d.offerQuarter}`)
    if (d.expectedJoiningDate) parts.push(`Expected join: ${d.expectedJoiningDate}`)
    if (d.joiningDate) parts.push(`Joined: ${d.joiningDate}`)
    if (d.joiningMonth) parts.push(`Join month: ${d.joiningMonth}`)
    if (d.joiningQuarter) parts.push(`Join quarter: ${d.joiningQuarter}`)
    if (parts.length > 0) return parts.join(' · ')
  }
  if (log.action === 'RESUME_UPLOADED' && d.fileName) return `File: ${d.fileName}`
  if (
    log.action === 'INTERVIEW_SCHEDULED' ||
    log.action === 'INTERVIEW_RESCHEDULED' ||
    log.action === 'INTERVIEW_UPDATED' ||
    log.action === 'INTERVIEW_CANCELLED' ||
    log.action === 'INTERVIEW_FEEDBACK_DELETED'
  ) {
    const parts: string[] = []
    if (d.stageName) parts.push(String(d.stageName))
    if (d.scheduledAt) {
      parts.push(new Date(String(d.scheduledAt)).toLocaleString())
    }
    return parts.length > 0 ? parts.join(' · ') : null
  }
  if (Array.isArray(d)) return d.join(', ')
  if (typeof d === 'object') {
    return Object.entries(d)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' · ')
  }
  return null
}

export function candidateInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
}

export function matchScoreTone(score: number): string {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400'
  if (score >= 50) return 'text-primary dark:text-white'
  return 'text-primary/50 dark:text-white/50'
}

export function matchScoreBarClass(score: number): string {
  if (score >= 80) return 'bg-emerald-500'
  return 'bg-primary dark:bg-white'
}
