import type {
  ActivityLog,
  Candidate,
  CandidateStatus,
  Interview,
  Offer,
  Requirement,
  User,
} from '@/types'
import { isToday } from 'date-fns'
import { isCompletedPipeline, isUpcoming, needsFeedback } from '@/pages/interviews/_shared/interview.utils'
import { requirementStats } from '@/pages/requirements/_shared/requirement.utils'

export const PIPELINE_STAGES: CandidateStatus[] = [
  'SOURCED',
  'SCREENING',
  'SHORTLISTED',
  'INTERVIEW',
  'OFFER',
  'HIRED',
]

export function candidatePipelineCounts(candidates: Candidate[]) {
  return PIPELINE_STAGES.map((stage) => ({
    stage,
    label: stage.charAt(0) + stage.slice(1).toLowerCase(),
    count: candidates.filter((c) => c.status === stage).length,
  }))
}

export function adminMetrics(
  requirements: Requirement[],
  candidates: Candidate[],
  users: User[],
  activityLogs: ActivityLog[]
) {
  const reqStats = requirementStats(requirements)
  const team = users.filter((u) => u.role !== 'CANDIDATE' && u.role !== 'VENDOR')
  return {
    ...reqStats,
    candidates: candidates.length,
    team: team.length,
    activity: activityLogs.length,
    hires: candidates.filter((c) => c.status === 'HIRED').length,
  }
}

export function recruiterMetrics(
  requirements: Requirement[],
  candidates: Candidate[],
  interviews: Interview[],
  offers: Offer[]
) {
  const reqStats = requirementStats(requirements)
  return {
    live: reqStats.live,
    candidates: candidates.length,
    upcoming: interviews.filter(isUpcoming).length,
    feedback: interviews.filter(needsFeedback).length,
    offers: offers.length,
    hires: candidates.filter((c) => c.status === 'HIRED').length,
  }
}

export function isScheduledToday(interview: Interview): boolean {
  if (interview.status === 'CANCELLED') return false
  return isToday(new Date(interview.scheduledAt))
}

export function interviewerMetrics(interviews: Interview[]) {
  const upcoming = interviews.filter(isUpcoming)
  return {
    total: interviews.length,
    today: upcoming.filter(isScheduledToday).length,
    upcoming: upcoming.length,
    feedback: interviews.filter(needsFeedback).length,
    decided: interviews.filter(isCompletedPipeline).length,
    candidates: new Set(interviews.map((i) => i.candidateId)).size,
  }
}

export function sortInterviewsChronologically(interviews: Interview[]): Interview[] {
  return [...interviews].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  )
}

export function activityLogLink(log: ActivityLog): string | undefined {
  switch (log.entityType) {
    case 'REQUIREMENT':
      return `/requirements/${log.entityId}`
    case 'CANDIDATE':
      return `/candidates/${log.entityId}`
    case 'INTERVIEW':
      return `/interviews`
    case 'OFFER':
      return `/offers`
    default:
      return undefined
  }
}

export function formatActivityTitle(log: ActivityLog): string {
  const action = log.action.replace(/_/g, ' ').toLowerCase()
  if (log.entityType === 'REQUIREMENT' && log.details?.title) {
    return `${log.details.title as string} — ${action}`
  }
  if (log.entityType === 'CANDIDATE' && log.details?.name) {
    return `${log.details.name as string} — ${action}`
  }
  return `${log.entityType.toLowerCase()} ${action}`
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}
