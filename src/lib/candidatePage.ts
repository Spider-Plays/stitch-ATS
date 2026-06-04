import type { Candidate, CandidateStatus } from '../types'

export type CandidateFilter = 'ALL' | 'ACTIVE' | CandidateStatus

export const CANDIDATE_FILTERS: { id: CandidateFilter; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'ACTIVE', label: 'In pipeline' },
  { id: 'INTERVIEW', label: 'Interview' },
  { id: 'OFFER', label: 'Offer' },
  { id: 'HIRED', label: 'Hired' },
  { id: 'REJECTED', label: 'Rejected' },
]

export const CANDIDATE_STAGE_ORDER: CandidateStatus[] = [
  'SOURCED',
  'APPLIED',
  'SCREENING',
  'SHORTLISTED',
  'INTERVIEW',
  'OFFER',
  'HIRED',
  'JOINED',
  'REJECTED',
]

const STAGE_GROUP_TITLES: Record<CandidateStatus, string> = {
  SOURCED: 'Sourced',
  APPLIED: 'Applied',
  SCREENING: 'Screening',
  SHORTLISTED: 'Shortlisted',
  INTERVIEW: 'Interview',
  OFFER: 'Offer',
  HIRED: 'Hired',
  JOINED: 'Joined',
  REJECTED: 'Rejected',
}

export function isTerminalStatus(status: CandidateStatus): boolean {
  return status === 'HIRED' || status === 'REJECTED'
}

export function isActiveCandidate(candidate: Candidate): boolean {
  return !isTerminalStatus(candidate.status)
}

export function isHighMatch(candidate: Candidate, threshold = 80): boolean {
  return candidate.matchScore >= threshold
}

export function candidateStatusLabel(status: CandidateStatus): string {
  return STAGE_GROUP_TITLES[status] ?? status.replace(/_/g, ' ')
}

export function candidateStatusClass(status: CandidateStatus): string {
  switch (status) {
    case 'SOURCED':
    case 'APPLIED':
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300 border-slate-200/80 dark:border-white/10'
    case 'SCREENING':
    case 'SHORTLISTED':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border-amber-200/80 dark:border-amber-500/30'
    case 'INTERVIEW':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300 border-purple-200/80 dark:border-purple-500/30'
    case 'OFFER':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300 border-blue-200/80 dark:border-blue-500/30'
    case 'HIRED':
    case 'JOINED':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-500/30'
    case 'REJECTED':
      return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300 border-red-200/80 dark:border-red-500/30'
    default:
      return 'bg-primary/10 text-primary dark:text-white/80 border-primary/15 dark:border-white/10'
  }
}

export function recruiterDisplay(candidate: Candidate): string {
  if (candidate.recruiterName) return candidate.recruiterName
  if (candidate.source === 'Candidate Portal') return 'Self-applied'
  return '—'
}

export function candidateStats(candidates: Candidate[]) {
  return {
    total: candidates.length,
    active: candidates.filter(isActiveCandidate).length,
    interview: candidates.filter((c) => c.status === 'INTERVIEW').length,
    offer: candidates.filter((c) => c.status === 'OFFER').length,
    hired: candidates.filter((c) => c.status === 'HIRED').length,
    rejected: candidates.filter((c) => c.status === 'REJECTED').length,
    highMatch: candidates.filter((c) => isHighMatch(c) && isActiveCandidate(c)).length,
    selfApplied: candidates.filter((c) => c.source === 'Candidate Portal').length,
  }
}

export function filterCandidates(candidates: Candidate[], filter: CandidateFilter): Candidate[] {
  if (filter === 'ALL') return candidates
  if (filter === 'ACTIVE') return candidates.filter(isActiveCandidate)
  return candidates.filter((c) => c.status === filter)
}

export function sortCandidates(candidates: Candidate[]): Candidate[] {
  const order = new Map(CANDIDATE_STAGE_ORDER.map((s, i) => [s, i]))
  return [...candidates].sort((a, b) => {
    const statusDiff = (order.get(a.status) ?? 99) - (order.get(b.status) ?? 99)
    if (statusDiff !== 0) return statusDiff
    const aTime = new Date(a.updatedAt || a.appliedDate).getTime()
    const bTime = new Date(b.updatedAt || b.appliedDate).getTime()
    return bTime - aTime
  })
}

export function groupCandidatesByStatus(candidates: Candidate[]) {
  const groups: { key: string; title: string; items: Candidate[] }[] =
    CANDIDATE_STAGE_ORDER.map((key) => ({
      key,
      title: STAGE_GROUP_TITLES[key],
      items: [] as Candidate[],
    }))
  const other: Candidate[] = []
  for (const c of candidates) {
    const bucket = groups.find((g) => g.key === c.status)
    if (bucket) bucket.items.push(c)
    else other.push(c)
  }
  const withItems = groups.filter((g) => g.items.length > 0)
  if (other.length > 0) {
    withItems.push({ key: 'OTHER', title: 'Other', items: other })
  }
  return withItems
}

export function candidateSearchFields(candidate: Candidate): (string | undefined)[] {
  return [
    candidate.name,
    candidate.email,
    candidate.role,
    candidate.jobTitle,
    candidate.reqId,
    candidate.client,
    candidate.recruiterName,
    candidate.source,
    candidate.status,
  ]
}
