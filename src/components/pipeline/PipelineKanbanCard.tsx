import React from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Calendar, ChevronRight, Phone, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import type { Candidate, CandidateStatus } from '../../types'
import { recruiterDisplay } from '@/pages/candidates/_shared/candidate.utils'
import { candidateStageSelectOptions, toCandidateStatus } from '../../lib/selectOptions'
import { AppSelect } from '../ui/AppSelect'
import { isHiredStageLocked } from '@/permissions'

interface PipelineKanbanCardProps {
  candidate: Candidate
  canManage: boolean
  userRole?: string | null
  showJob?: boolean
  onMoveStage: (candidate: Candidate, status: CandidateStatus) => void
}

function matchBadgeClass(score: number) {
  if (score >= 80) return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-500/30'
  if (score >= 50) return 'bg-primary/10 text-primary dark:text-white border-primary/15 dark:border-white/15'
  return 'bg-primary/5 text-primary/60 dark:text-white/50 border-primary/10 dark:border-white/10'
}

export function PipelineKanbanCard({
  candidate,
  canManage,
  userRole,
  showJob,
  onMoveStage,
}: PipelineKanbanCardProps) {
  const hiredLocked = isHiredStageLocked(candidate, userRole)
  const applied = new Date(candidate.appliedDate).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
  const jobLabel = candidate.jobTitle ?? candidate.role

  return (
    <article className="app-card-interactive flex flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <div className="shrink-0 size-10 rounded-xl bg-muted flex items-center justify-center font-bold text-foreground overflow-hidden shadow-sm ring-1 ring-border/50">
          {candidate.avatar ? (
            <img src={candidate.avatar} alt="" className="size-full object-cover" />
          ) : (
            candidate.name.charAt(0)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <Link
            to={`/candidates/${candidate.id}`}
            className="text-sm font-bold text-primary dark:text-white hover:underline line-clamp-1"
          >
            {candidate.name}
          </Link>
          <p className="text-[11px] font-medium text-primary/50 dark:text-white/50 truncate">
            {recruiterDisplay(candidate)}
          </p>
        </div>
        <span
          className={clsx(
            'shrink-0 rounded-lg border px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
            matchBadgeClass(candidate.matchScore)
          )}
        >
          {candidate.matchScore}%
        </span>
      </div>

      {showJob && jobLabel && (
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-primary/70 dark:text-white/60">
          <Briefcase size={12} className="shrink-0 opacity-60" />
          <span className="truncate">{jobLabel}</span>
        </div>
      )}

      {candidate.status === 'INTERVIEW' && (
        <div className="flex items-center gap-2 rounded-xl bg-violet-500/10 dark:bg-violet-500/15 px-2.5 py-2 text-[11px] font-bold text-violet-800 dark:text-violet-200">
          <Phone size={13} />
          Interview stage
        </div>
      )}
      {candidate.status === 'OFFER' && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 px-2.5 py-2 text-[11px] font-bold text-amber-800 dark:text-amber-200">
          <Sparkles size={13} />
          Offer in progress
        </div>
      )}

      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        <Calendar size={11} />
        Applied {applied}
      </div>

      <div className="flex flex-col gap-2 pt-1 border-t border-primary/5 dark:border-white/5">
        {canManage && !hiredLocked && (
          <div onClick={(e) => e.stopPropagation()}>
            <AppSelect
              variant="filled"
              size="sm"
              value={candidate.status}
              onChange={(v) => onMoveStage(candidate, toCandidateStatus(v))}
              options={candidateStageSelectOptions()}
              aria-label={`Update stage for ${candidate.name}`}
            />
          </div>
        )}
        {canManage && hiredLocked && (
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center py-1">
            Hired — admin only
          </p>
        )}
        <Link
          to={`/candidates/${candidate.id}`}
          className="inline-flex items-center justify-center gap-1 w-full rounded-xl border border-primary/10 dark:border-white/10 py-2 text-[11px] font-bold text-primary dark:text-white hover:bg-primary/5 dark:hover:bg-white/10 transition-colors"
        >
          View profile
          <ChevronRight size={14} />
        </Link>
      </div>
    </article>
  )
}
