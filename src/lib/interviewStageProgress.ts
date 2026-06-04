import type { InterviewStageProgressStatus } from '../types'

export const INTERVIEW_STAGE_STATUS_LABEL: Record<InterviewStageProgressStatus, string> = {
  locked: 'Complete prior stage first',
  available: 'Ready to schedule',
  scheduled: 'Scheduled',
  awaiting_feedback: 'Awaiting feedback',
  completed: 'Passed',
  failed: 'Did not pass',
}

export function interviewStageDotClass(status: InterviewStageProgressStatus): string {
  switch (status) {
    case 'completed':
      return 'bg-emerald-500 ring-emerald-500/30'
    case 'failed':
      return 'bg-red-500 ring-red-500/30'
    case 'awaiting_feedback':
      return 'bg-amber-500 ring-amber-500/30'
    case 'scheduled':
      return 'bg-blue-500 ring-blue-500/30'
    case 'available':
      return 'bg-primary dark:bg-white ring-primary/20 dark:ring-white/20'
    default:
      return 'bg-primary/20 dark:bg-white/20 ring-primary/10 dark:ring-white/10'
  }
}

export function interviewStageCardClass(
  status: InterviewStageProgressStatus,
  selected: boolean
): string {
  if (selected) {
    return 'border-primary dark:border-white bg-primary/5 dark:bg-white/10 shadow-sm'
  }
  switch (status) {
    case 'awaiting_feedback':
      return 'border-amber-300/60 dark:border-amber-500/40 bg-amber-50/80 dark:bg-amber-500/10'
    case 'completed':
      return 'border-emerald-200/60 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/5'
    case 'failed':
      return 'border-red-200/60 dark:border-red-500/30 bg-red-50/50 dark:bg-red-500/5'
    case 'scheduled':
      return 'border-blue-200/60 dark:border-blue-500/30 bg-blue-50/50 dark:bg-blue-500/5'
    case 'available':
      return 'border-primary/20 dark:border-white/20 bg-white dark:bg-white/5 hover:border-primary/40 dark:hover:border-white/40'
    default:
      return 'border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] opacity-70'
  }
}
