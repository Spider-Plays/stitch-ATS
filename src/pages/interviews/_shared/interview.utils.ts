import { format, isToday, isTomorrow, isYesterday, startOfDay } from 'date-fns'
import type { Interview } from '@/types'
import { getInterviewDisplayLabel, isInterviewPast } from '@/lib/interviewDisplayStatus'

export type InterviewFilter = 'all' | 'upcoming' | 'feedback' | 'completed' | 'cancelled'

export function isUpcoming(interview: Interview): boolean {
  return interview.status === 'SCHEDULED' && !isInterviewPast(interview)
}

export function needsFeedback(interview: Interview): boolean {
  if (interview.status === 'CANCELLED') return false
  return getInterviewDisplayLabel(interview) === 'Awaiting for feedback'
}

export function isCompletedPipeline(interview: Interview): boolean {
  const label = getInterviewDisplayLabel(interview)
  return ['Selected', 'On Hold', 'Rejected'].includes(label)
}

export function filterInterviews(list: Interview[], filter: InterviewFilter): Interview[] {
  switch (filter) {
    case 'upcoming':
      return list.filter(isUpcoming)
    case 'feedback':
      return list.filter(needsFeedback)
    case 'completed':
      return list.filter(isCompletedPipeline)
    case 'cancelled':
      return list.filter((i) => i.status === 'CANCELLED')
    default:
      return list
  }
}

export function interviewStats(list: Interview[]) {
  return {
    upcoming: list.filter(isUpcoming).length,
    feedback: list.filter(needsFeedback).length,
    completed: list.filter(isCompletedPipeline).length,
    cancelled: list.filter((i) => i.status === 'CANCELLED').length,
    total: list.length,
  }
}

export function formatInterviewDay(date: Date): string {
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'EEEE, MMM d')
}

export function formatInterviewTime(date: Date): string {
  return format(date, 'h:mm a')
}

export function groupInterviewsByDay(interviews: Interview[]): Map<string, Interview[]> {
  const sorted = [...interviews].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  )
  const groups = new Map<string, Interview[]>()
  for (const iv of sorted) {
    const key = startOfDay(new Date(iv.scheduledAt)).toISOString()
    const bucket = groups.get(key) ?? []
    bucket.push(iv)
    groups.set(key, bucket)
  }
  return groups
}

export function stageLabel(interview: Interview): string {
  return interview.stageName ?? interview.type.replace(/_/g, ' ')
}

export function stageOrderLabel(interview: Interview): string | null {
  if (interview.stageOrder == null) return null
  return `Round ${interview.stageOrder + 1}`
}
