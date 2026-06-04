import { differenceInCalendarDays, format } from 'date-fns'
import type { Requirement, RequirementHiringStage, RequirementStatus } from '../types'

export const HIRING_STAGES: { value: RequirementHiringStage; label: string }[] = [
  { value: 'SOURCING', label: 'Sourcing' },
  { value: 'L1_INTERVIEW', label: 'L1 interview' },
  { value: 'L2_INTERVIEW', label: 'L2 interview' },
  { value: 'HR_INTERVIEW', label: 'HR interview' },
  { value: 'TO_BE_OFFERED', label: 'To be offered' },
  { value: 'OFFERED', label: 'Offered' },
  { value: 'JOINED', label: 'Joined' },
]

export function hiringStageLabel(stage?: RequirementHiringStage): string {
  return HIRING_STAGES.find((s) => s.value === stage)?.label ?? 'Sourcing'
}

export function hiringStageClass(stage?: RequirementHiringStage): string {
  switch (stage) {
    case 'SOURCING':
      return 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300 border-sky-200/80 dark:border-sky-500/30'
    case 'L1_INTERVIEW':
    case 'L2_INTERVIEW':
      return 'bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300 border-violet-200/80 dark:border-violet-500/30'
    case 'HR_INTERVIEW':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-500/30'
    case 'TO_BE_OFFERED':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border-amber-200/80 dark:border-amber-500/30'
    case 'OFFERED':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300 border-blue-200/80 dark:border-blue-500/30'
    case 'JOINED':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-500/30'
    default:
      return 'bg-primary/10 text-primary dark:text-white/80 border-primary/15 dark:border-white/10'
  }
}

export function isTerminalPostingStatus(status: RequirementStatus): boolean {
  return status === 'CLOSED' || status === 'CANCELLED' || status === 'REJECTED'
}

export function canEditHiringStage(status: RequirementStatus): boolean {
  return status === 'LIVE' || status === 'ON_HOLD'
}

export type RequirementAgeing = {
  createdLabel: string
  totalDaysOpen: number
  daysSinceLive: number | null
  daysOnHold: number | null
  daysToDeadline: number | null
  deadlineOverdue: boolean
  liveSinceLabel: string | null
  onHoldSinceLabel: string | null
}

export function computeRequirementAgeing(requirement: Requirement): RequirementAgeing {
  const now = new Date()
  const created = new Date(requirement.createdAt)
  const totalDaysOpen = Math.max(0, differenceInCalendarDays(now, created))

  const liveAt = requirement.liveAt ? new Date(requirement.liveAt) : null
  const daysSinceLive =
    liveAt && !Number.isNaN(liveAt.getTime())
      ? Math.max(0, differenceInCalendarDays(now, liveAt))
      : requirement.status === 'LIVE' || requirement.status === 'ON_HOLD'
        ? totalDaysOpen
        : null

  const onHoldAt = requirement.onHoldAt ? new Date(requirement.onHoldAt) : null
  const daysOnHold =
    requirement.status === 'ON_HOLD' && onHoldAt && !Number.isNaN(onHoldAt.getTime())
      ? Math.max(0, differenceInCalendarDays(now, onHoldAt))
      : null

  const deadline = requirement.hiringDeadline ? new Date(requirement.hiringDeadline) : null
  let daysToDeadline: number | null = null
  let deadlineOverdue = false
  if (deadline && !Number.isNaN(deadline.getTime())) {
    daysToDeadline = differenceInCalendarDays(deadline, now)
    deadlineOverdue = daysToDeadline < 0
  }

  return {
    createdLabel: format(created, 'MMM d, yyyy'),
    totalDaysOpen,
    daysSinceLive,
    daysOnHold,
    daysToDeadline,
    deadlineOverdue,
    liveSinceLabel: liveAt ? format(liveAt, 'MMM d, yyyy') : null,
    onHoldSinceLabel: onHoldAt ? format(onHoldAt, 'MMM d, yyyy') : null,
  }
}
