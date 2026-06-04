import type { Feedback, Interview } from '../types'

export type InterviewDisplayLabel =
  | 'Scheduled'
  | 'Awaiting for feedback'
  | 'Selected'
  | 'On Hold'
  | 'Rejected'
  | 'Cancelled'

export function recommendationToDisplayLabel(
  recommendation: Feedback['recommendation']
): InterviewDisplayLabel {
  switch (recommendation) {
    case 'STRONG_HIRE':
    case 'HIRE':
      return 'Selected'
    case 'ON_HOLD':
      return 'On Hold'
    case 'NO_HIRE':
    case 'STRONG_NO_HIRE':
      return 'Rejected'
    default:
      return 'Awaiting for feedback'
  }
}

function interviewEndTime(interview: Interview): Date {
  const end = new Date(interview.scheduledAt)
  end.setMinutes(end.getMinutes() + (interview.duration ?? 60))
  return end
}

export function isInterviewPast(interview: Interview): boolean {
  return interviewEndTime(interview) <= new Date()
}

export function getInterviewDisplayLabel(interview: Interview): InterviewDisplayLabel {
  if (interview.status === 'CANCELLED') return 'Cancelled'

  if (interview.hasFeedback && interview.feedbackRecommendation) {
    return recommendationToDisplayLabel(interview.feedbackRecommendation)
  }

  if (interview.status === 'SCHEDULED' && !isInterviewPast(interview)) {
    return 'Scheduled'
  }

  return 'Awaiting for feedback'
}

export function interviewDisplayStatusClass(label: InterviewDisplayLabel): string {
  switch (label) {
    case 'Scheduled':
      return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-200 dark:border-blue-500/30'
    case 'Awaiting for feedback':
      return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-500/30'
    case 'Selected':
      return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-200 dark:border-green-500/30'
    case 'On Hold':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-200 dark:border-yellow-500/30'
    case 'Rejected':
      return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-200 dark:border-red-500/30'
    case 'Cancelled':
      return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/10 dark:text-white/50 dark:border-white/10'
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

/** Interview has a final feedback outcome (selected, on hold, rejected). */
export function isInterviewDecided(interview: Interview): boolean {
  if (interview.status === 'CANCELLED') return false
  const label = getInterviewDisplayLabel(interview)
  return ['Selected', 'On Hold', 'Rejected'].includes(label)
}

export function canViewInterviewFeedback(interview: Interview): boolean {
  return interview.status !== 'CANCELLED' && !!interview.hasFeedback
}

export function canEditInterview(interview: Interview, _role?: string | null): boolean {
  if (interview.status === 'CANCELLED') return false
  if (interview.hasFeedback || isInterviewDecided(interview)) return false
  return true
}
