import type { Requirement, RequirementStatus } from '@/types'

export type RequirementFilter = RequirementStatus | 'ALL'

export const REQUIREMENT_FILTERS: { id: RequirementFilter; label: string }[] = [
  { id: 'ALL', label: 'All jobs' },
  { id: 'LIVE', label: 'Active' },
  { id: 'ON_HOLD', label: 'On hold' },
  { id: 'PENDING_APPROVAL', label: 'Pending' },
  { id: 'DRAFT', label: 'Drafts' },
]

export function requirementStatusLabel(status: RequirementStatus): string {
  return status.replace(/_/g, ' ')
}

export function requirementStatusClass(status: RequirementStatus): string {
  switch (status) {
    case 'LIVE':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-500/30'
    case 'ON_HOLD':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300 border-orange-200/80 dark:border-orange-500/30'
    case 'PENDING_APPROVAL':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border-amber-200/80 dark:border-amber-500/30'
    case 'DRAFT':
      return 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/60 border-slate-200/80 dark:border-white/10'
    case 'CLOSED':
      return 'bg-slate-200 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300 border-slate-300/80'
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300 border-red-200/80 dark:border-red-500/30'
    case 'REJECTED':
      return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300 border-red-200/80 dark:border-red-500/30'
    default:
      return 'bg-primary/10 text-primary dark:text-white/80 border-primary/15 dark:border-white/10'
  }
}

export function priorityMeta(priority?: Requirement['priority']) {
  switch (priority) {
    case 'CRITICAL':
      return { label: 'Critical', className: 'text-red-600 dark:text-red-400' }
    case 'HIGH':
      return { label: 'High', className: 'text-orange-600 dark:text-orange-400' }
    case 'MEDIUM':
      return { label: 'Medium', className: 'text-amber-600 dark:text-amber-400' }
    case 'LOW':
      return { label: 'Low', className: 'text-primary/50 dark:text-white/50' }
    default:
      return { label: 'Normal', className: 'text-primary/50 dark:text-white/50' }
  }
}

export function fillProgress(filled: number, openings: number) {
  const total = Math.max(openings, 1)
  const pct = Math.min(100, Math.round((filled / total) * 100))
  return { pct, label: `${filled} of ${openings}`, complete: filled >= openings && openings > 0 }
}

export function requirementStats(requirements: Requirement[]) {
  return {
    total: requirements.length,
    live: requirements.filter((r) => r.status === 'LIVE').length,
    onHold: requirements.filter((r) => r.status === 'ON_HOLD').length,
    pending: requirements.filter((r) => r.status === 'PENDING_APPROVAL').length,
    draft: requirements.filter((r) => r.status === 'DRAFT').length,
  }
}

export function filterRequirements(requirements: Requirement[], filter: RequirementFilter) {
  if (filter === 'ALL') return requirements
  return requirements.filter((r) => r.status === filter)
}

export function sortRequirements(requirements: Requirement[]) {
  const order: Partial<Record<RequirementStatus, number>> = {
    PENDING_APPROVAL: 0,
    LIVE: 1,
    ON_HOLD: 2,
    DRAFT: 3,
    APPROVED: 4,
    CLOSED: 5,
    CANCELLED: 5,
    REJECTED: 6,
  }
  return [...requirements].sort((a, b) => {
    const statusDiff = (order[a.status] ?? 99) - (order[b.status] ?? 99)
    if (statusDiff !== 0) return statusDiff
    return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
  })
}

export function groupRequirementsByStatus(requirements: Requirement[]) {
  const groups: { key: RequirementStatus; title: string; items: Requirement[] }[] = [
    { key: 'PENDING_APPROVAL', title: 'Pending approval', items: [] },
    { key: 'LIVE', title: 'Active jobs', items: [] },
    { key: 'ON_HOLD', title: 'On hold', items: [] },
    { key: 'DRAFT', title: 'Drafts', items: [] },
    { key: 'CLOSED', title: 'Closed', items: [] },
    { key: 'CANCELLED', title: 'Cancelled', items: [] },
    { key: 'REJECTED', title: 'Rejected', items: [] },
  ]
  for (const req of requirements) {
    const bucket = groups.find((g) => g.key === req.status)
    if (bucket) bucket.items.push(req)
  }
  return groups.filter((g) => g.items.length > 0)
}
