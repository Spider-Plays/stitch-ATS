import type { Candidate, CandidateStatus } from '../types'
import {
  CANDIDATE_STAGE_ORDER,
  candidateSearchFields,
  candidateStats,
  candidateStatusLabel,
} from './candidatePage'

export const PIPELINE_KANBAN_STAGES: CandidateStatus[] = CANDIDATE_STAGE_ORDER

export type PipelineStageFilter = 'ALL' | CandidateStatus

export function canManageCandidateStage(role?: string | null): boolean {
  return ['ADMIN', 'HR_HEAD', 'HR_MANAGER', 'RECRUITER', 'TEAM_LEAD'].includes(role ?? '')
}

export function pipelineStats(candidates: Candidate[]) {
  const base = candidateStats(candidates)
  return {
    ...base,
    sourced: candidates.filter((c) => c.status === 'SOURCED' || c.status === 'APPLIED').length,
    screening: candidates.filter((c) =>
      ['SCREENING', 'SHORTLISTED'].includes(c.status)
    ).length,
  }
}

export function groupCandidatesByKanbanStage(candidates: Candidate[]) {
  return PIPELINE_KANBAN_STAGES.map((stage) => ({
    stage,
    title: candidateStatusLabel(stage),
    items: candidates.filter((c) => c.status === stage),
  }))
}

export function pipelineSearchFields(candidate: Candidate, jobTitle?: string) {
  return [...candidateSearchFields(candidate), jobTitle]
}

const STAGE_DOT_COLORS: Record<CandidateStatus, string> = {
  SOURCED: 'bg-slate-400',
  APPLIED: 'bg-slate-500',
  SCREENING: 'bg-sky-500',
  SHORTLISTED: 'bg-blue-500',
  INTERVIEW: 'bg-violet-500',
  OFFER: 'bg-amber-500',
  HIRED: 'bg-emerald-500',
  REJECTED: 'bg-red-400',
}

export function stageDotColor(status: CandidateStatus): string {
  return STAGE_DOT_COLORS[status] ?? 'bg-primary/40'
}

export function sortKanbanCards(candidates: Candidate[]): Candidate[] {
  return [...candidates].sort((a, b) => {
    const aTime = new Date(a.updatedAt || a.appliedDate).getTime()
    const bTime = new Date(b.updatedAt || b.appliedDate).getTime()
    return bTime - aTime
  })
}
