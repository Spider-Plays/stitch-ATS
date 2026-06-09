import React from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase,
  CalendarCheck,
  GitBranch,
  Sparkles,
  UserX,
} from 'lucide-react'
import clsx from 'clsx'
import type { Candidate, CandidateStatus } from '@/types'
import {
  CANDIDATE_STAGE_ORDER,
  candidateStatusClass,
  candidateStatusLabel,
  isHighMatch,
} from '@/pages/candidates/_shared/candidate.utils'
import { matchScoreBarClass, matchScoreTone } from '@/pages/candidates/profile/profile.utils'
import { useAuth } from '@/hooks/useAuth'
import { isHiredStageLocked } from '@/permissions'
import { AppSelect } from '@/components/ui/AppSelect'

type CandidateProfileSidebarProps = {
  candidate: Candidate
  displayData: Candidate
  hasResume: boolean
  canEdit: boolean
  onMoveStage: (status: CandidateStatus) => void
  onOpenInterviewsTab?: () => void
}

export function CandidateProfileSidebar({
  candidate,
  displayData,
  hasResume,
  canEdit,
  onMoveStage,
  onOpenInterviewsTab,
}: CandidateProfileSidebarProps) {
  const { user } = useAuth()
  const score = displayData.matchScore ?? 0
  const strongMatch = isHighMatch(displayData)
  const hiredLocked = isHiredStageLocked(displayData, user?.role)

  const stageOptions = CANDIDATE_STAGE_ORDER.map((status) => ({
    value: status,
    label: candidateStatusLabel(status),
    chipClassName: candidateStatusClass(status),
  }))

  return (
    <aside className="w-full lg:w-[340px] shrink-0 flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start overflow-visible">
      <div
        className={clsx(
          'rounded-2xl border p-5 shadow-sm',
          strongMatch
            ? 'border-emerald-300/60 dark:border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10'
            : 'border-primary/10 dark:border-border bg-card'
        )}
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles
            size={18}
            className={strongMatch ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary/50'}
          />
          <h3 className="text-sm font-bold text-primary dark:text-white">Job match</h3>
        </div>
        <div className="flex items-end gap-4">
          <p className={clsx('text-4xl font-black tabular-nums leading-none', matchScoreTone(score))}>
            {score}%
          </p>
          <div className="flex-1 pb-1">
            <div className="h-2 rounded-full bg-primary/10 dark:bg-white/10 overflow-hidden">
              <div
                className={clsx('h-full rounded-full transition-all', matchScoreBarClass(score))}
                style={{ width: `${Math.min(100, score)}%` }}
              />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-2">
              {strongMatch ? 'Strong fit for role' : hasResume ? 'Based on profile & JD' : 'Upload resume to improve'}
            </p>
          </div>
        </div>
      </div>

      <div className="app-card p-5 space-y-3">
        <h3 className="text-sm font-bold text-primary dark:text-white">Quick actions</h3>
        <div className="flex flex-col gap-2">
          {candidate.requirementId && (
            <>
              <Link
                to={`/requirements/${candidate.requirementId}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/5 dark:bg-white/5 text-primary dark:text-white text-xs font-bold uppercase tracking-wider hover:bg-primary/10 dark:hover:bg-white/10"
              >
                <Briefcase size={16} />
                View job
              </Link>
              <Link
                to={`/pipeline/${candidate.requirementId}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/5 dark:bg-white/5 text-primary dark:text-white text-xs font-bold uppercase tracking-wider hover:bg-primary/10 dark:hover:bg-white/10"
              >
                <GitBranch size={16} />
                Open pipeline
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={onOpenInterviewsTab}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:opacity-90 w-full justify-center"
          >
            <CalendarCheck size={16} />
            Schedule interview
          </button>
        </div>
      </div>

      {canEdit && (
        <div className="app-card p-5 !overflow-visible">
          <h3 className="text-sm font-bold text-primary dark:text-white mb-4">Pipeline stage</h3>
          {hiredLocked && (
            <p className="text-xs font-medium text-primary/50 dark:text-white/50 mb-3 leading-relaxed">
              This candidate is hired. Only an administrator can change their pipeline stage.
            </p>
          )}
          <AppSelect
            variant="filled"
            value={displayData.status}
            onChange={(v) => onMoveStage(v as CandidateStatus)}
            options={stageOptions}
            disabled={hiredLocked}
            aria-label="Pipeline stage"
          />
          {!hiredLocked && (
            <button
              type="button"
              onClick={() => onMoveStage('REJECTED')}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200/80 dark:border-red-500/40 text-red-700 dark:text-red-300 text-sm font-bold hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              <UserX size={16} />
              Reject candidate
            </button>
          )}
        </div>
      )}

      {!canEdit && (
        <p className="text-center text-xs font-medium text-muted-foreground py-4">
          Read-only access
        </p>
      )}
    </aside>
  )
}
