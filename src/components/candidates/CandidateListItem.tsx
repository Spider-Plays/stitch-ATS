import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase,
  Building2,
  Calendar,
  ChevronRight,
  GitBranch,
  Mail,
  Sparkles,
  User,
} from 'lucide-react'
import clsx from 'clsx'
import type { Candidate, CandidateStatus } from '../../types'
import { ActionsMenu } from '../ui/ActionsMenu'
import {
  candidateStatusClass,
  candidateStatusLabel,
  recruiterDisplay,
} from '../../lib/candidatePage'

export type CandidateMenuItem = {
  id: string
  label: string
  onClick: () => void
  hidden?: boolean
  variant?: 'danger'
}

interface CandidateListItemProps {
  candidate: Candidate
  menuItems: CandidateMenuItem[]
  variant?: 'default' | 'highlight'
  isInterviewerView?: boolean
  /** e.g. ERP, Portal — shown next to the candidate name */
  channelBadge?: { label: string; title?: string }
  /** Override recruiter/source line in meta chips */
  sourceOverride?: string
}

function statusAccentClass(status: CandidateStatus): string {
  switch (status) {
    case 'HIRED':
      return 'border-l-emerald-500'
    case 'REJECTED':
      return 'border-l-red-500'
    case 'INTERVIEW':
      return 'border-l-violet-500'
    case 'OFFER':
      return 'border-l-blue-500'
    case 'SCREENING':
    case 'SHORTLISTED':
      return 'border-l-amber-500'
    default:
      return 'border-l-slate-400 dark:border-l-slate-500'
  }
}

function matchBadgeClass(score: number): string {
  if (score >= 80)
    return 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-500/35'
  if (score >= 50)
    return 'bg-primary/8 text-primary dark:text-foreground border-primary/15 dark:border-white/15'
  return 'bg-muted/60 text-muted-foreground border-border/80'
}

export function CandidateListItem({
  candidate,
  menuItems,
  variant = 'default',
  isInterviewerView = false,
  channelBadge,
  sourceOverride,
}: CandidateListItemProps) {
  const navigate = useNavigate()
  const applied = new Date(candidate.appliedDate).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const jobLabel = candidate.jobTitle ?? candidate.role
  const sourceLabel = sourceOverride ?? recruiterDisplay(candidate)

  const metaChips: { icon: React.ElementType; label: string; key: string }[] = []
  if (!isInterviewerView && candidate.client) {
    metaChips.push({ icon: Building2, label: candidate.client, key: 'client' })
  }
  if (jobLabel) {
    metaChips.push({ icon: Briefcase, label: jobLabel, key: 'job' })
  }
  if (!isInterviewerView) {
    metaChips.push({ icon: User, label: sourceLabel, key: 'source' })
    metaChips.push({ icon: Calendar, label: applied, key: 'date' })
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/candidates/${candidate.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          navigate(`/candidates/${candidate.id}`)
        }
      }}
      className={clsx(
        'group relative overflow-hidden rounded-2xl border border-l-4 transition-all cursor-pointer',
        'app-card-interactive',
        !isInterviewerView && statusAccentClass(candidate.status),
        isInterviewerView && 'border-l-border',
        variant === 'highlight' &&
          'border-emerald-300/50 dark:border-emerald-500/35 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06] ring-1 ring-emerald-200/40 dark:ring-emerald-500/20'
      )}
    >
      <div className="flex flex-col gap-4 p-4 md:p-5 sm:flex-row sm:items-center sm:gap-5">
        <div className="flex min-w-0 flex-1 items-start gap-3.5 md:gap-4">
          <div
            className={clsx(
              'shrink-0 size-11 md:size-12 rounded-2xl flex items-center justify-center font-bold text-base overflow-hidden ring-1 ring-border/60 shadow-sm',
              variant === 'highlight'
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-200/50 dark:ring-emerald-500/30'
                : 'bg-muted/50 dark:bg-muted text-foreground'
            )}
          >
            {candidate.avatar ? (
              <img src={candidate.avatar} alt="" className="size-full object-cover" />
            ) : (
              candidate.name.charAt(0).toUpperCase()
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-2.5">
            <div className="flex flex-wrap items-center gap-2 gap-y-1">
              <h3 className="text-base font-bold text-foreground truncate max-w-[min(100%,280px)]">
                {candidate.name}
              </h3>
              {!isInterviewerView && (
                <span
                  className={clsx(
                    'shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border',
                    candidateStatusClass(candidate.status)
                  )}
                >
                  {candidateStatusLabel(candidate.status)}
                </span>
              )}
              {!isInterviewerView && variant === 'highlight' && (
                <span className="inline-flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-500/30">
                  <Sparkles size={10} />
                  Strong match
                </span>
              )}
              {!isInterviewerView && channelBadge && (
                <span
                  title={channelBadge.title ?? channelBadge.label}
                  className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-violet-500/12 text-violet-800 dark:text-violet-300 border border-violet-200/70 dark:border-violet-500/35"
                >
                  {channelBadge.label}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 min-w-0 max-w-full">
                <Mail size={13} className="shrink-0 opacity-70" />
                <span className="truncate font-medium">{candidate.email}</span>
              </span>
              {!isInterviewerView && candidate.reqId && (
                <>
                  <span className="hidden sm:inline opacity-40">·</span>
                  <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-muted/80 dark:bg-muted text-foreground/80">
                    {candidate.reqId}
                  </span>
                </>
              )}
            </div>

            {metaChips.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {metaChips.map(({ icon: Icon, label, key }) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1 max-w-[200px] px-2 py-1 rounded-lg bg-muted/50 dark:bg-muted/80 border border-border/50 text-[11px] font-medium text-muted-foreground"
                  >
                    <Icon size={11} className="shrink-0 opacity-60" />
                    <span className="truncate">{label}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div
          className="flex items-center justify-between gap-3 shrink-0 border-t border-border/50 pt-3 sm:border-t-0 sm:pt-0 sm:justify-end"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {!isInterviewerView && (
            <div
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 tabular-nums',
                matchBadgeClass(candidate.matchScore)
              )}
            >
              <span className="text-sm font-black">{candidate.matchScore}%</span>
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                match
              </span>
            </div>
          )}

          <div className="flex items-center gap-1">
            {!isInterviewerView && candidate.requirementId && (
              <button
                type="button"
                title="Open pipeline"
                onClick={() => navigate(`/pipeline/${candidate.requirementId}`)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border/80 bg-muted/30 dark:bg-muted/50 text-foreground text-xs font-bold hover:bg-muted/60 dark:hover:bg-muted transition-colors"
              >
                <GitBranch size={14} className="opacity-80" />
                <span className="hidden lg:inline">Pipeline</span>
              </button>
            )}
            <ActionsMenu items={menuItems} aria-label={`Actions for ${candidate.name}`} />
            <ChevronRight
              size={18}
              className="text-muted-foreground/40 group-hover:text-muted-foreground hidden md:block ml-0.5"
            />
          </div>
        </div>
      </div>
    </article>
  )
}
