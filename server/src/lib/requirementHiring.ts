export const HIRING_STAGES = [
  'SOURCING',
  'L1_INTERVIEW',
  'L2_INTERVIEW',
  'HR_INTERVIEW',
  'TO_BE_OFFERED',
  'OFFERED',
  'JOINED',
] as const

export type HiringStage = (typeof HIRING_STAGES)[number]

export function isHiringStage(value: string): value is HiringStage {
  return (HIRING_STAGES as readonly string[]).includes(value)
}

export const TERMINAL_POSTING_STATUSES = ['CLOSED', 'CANCELLED', 'REJECTED'] as const

export function canEditHiringStage(postingStatus: string): boolean {
  return ['LIVE', 'ON_HOLD'].includes(postingStatus)
}
