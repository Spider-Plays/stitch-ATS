import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Briefcase,
  Building2,
  ChevronRight,
  Eye,
  EyeOff,
  GitBranch,
  Users,
} from 'lucide-react'
import clsx from 'clsx'
import type { Requirement } from '../../types'
import { ActionsMenu } from '../ui/ActionsMenu'
import {
  fillProgress,
  priorityMeta,
  requirementStatusClass,
  requirementStatusLabel,
} from '@/pages/requirements/_shared/requirement.utils'
import { formatRequirementLocation, seniorityLabel } from '../../lib/requirementFields'

export type RequirementMenuItem = {
  id: string
  label: string
  onClick: () => void
  hidden?: boolean
  variant?: 'danger'
}

interface RequirementListItemProps {
  requirement: Requirement
  recruiterNames?: string[]
  menuItems: RequirementMenuItem[]
  variant?: 'default' | 'highlight'
}

export function RequirementListItem({
  requirement,
  recruiterNames = [],
  menuItems,
  variant = 'default',
}: RequirementListItemProps) {
  const navigate = useNavigate()
  const progress = fillProgress(requirement.filled, requirement.openings)
  const priority = priorityMeta(requirement.priority)
  const portalVisible = requirement.visibleToCandidates ?? true
  const referralVisible = requirement.visibleToReferrals ?? true
  const posted = new Date(requirement.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/requirements/${requirement.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          navigate(`/requirements/${requirement.id}`)
        }
      }}
      className={clsx(
        'group rounded-2xl border p-4 md:p-5 transition-all cursor-pointer',
        'app-card-interactive',
        variant === 'highlight' &&
          'border-amber-300/60 dark:border-amber-500/40 ring-1 ring-amber-200/50 dark:ring-amber-500/20'
      )}
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <div
            className={clsx(
              'shrink-0 p-3 rounded-xl',
              requirement.status === 'PENDING_APPROVAL'
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                : requirement.status === 'LIVE'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : 'bg-primary/10 dark:bg-white/10 text-primary dark:text-white'
            )}
          >
            <Briefcase size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-base font-bold text-primary dark:text-white truncate group-hover:underline decoration-primary/30">
                {requirement.title}
              </h3>
              {requirement.jobCode && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-primary/5 dark:bg-white/10 text-primary/70 dark:text-white/60">
                  {requirement.jobCode}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-primary/55 dark:text-white/55">
              <span className="inline-flex items-center gap-1">
                <Building2 size={12} />
                {requirement.department}
              </span>
              {requirement.client && (
                <>
                  <span className="opacity-30">·</span>
                  <span>{requirement.client}</span>
                </>
              )}
              {requirement.seniorityLevel && (
                <>
                  <span className="opacity-30">·</span>
                  <span>{seniorityLabel(requirement.seniorityLevel)}</span>
                </>
              )}
              <span className="opacity-30">·</span>
              <span>{formatRequirementLocation(requirement)}</span>
              <span className="opacity-30">·</span>
              <span>Posted {posted}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 lg:gap-4 shrink-0">
          <span
            className={clsx(
              'px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border',
              requirementStatusClass(requirement.status)
            )}
          >
            {requirementStatusLabel(requirement.status)}
          </span>

          <span className={clsx('text-xs font-bold', priority.className)}>{priority.label}</span>

          {requirement.status !== 'DRAFT' && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold text-primary/50 dark:text-white/50"
              title={
                portalVisible
                  ? 'Visible on candidate portal'
                  : 'Hidden from candidate portal'
              }
            >
              {portalVisible ? <Eye size={12} /> : <EyeOff size={12} />}
              {portalVisible ? 'Careers' : 'Careers off'}
            </span>
          )}

          {requirement.status === 'LIVE' && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-600/80 dark:text-violet-300/80"
              title={
                referralVisible
                  ? 'Open on employee referral portal'
                  : 'Not on employee portal'
              }
            >
              <Users size={12} />
              {referralVisible ? 'Referrals' : 'Referrals off'}
            </span>
          )}

          <div className="w-28 flex flex-col gap-1">
            <div className="flex justify-between text-[10px] font-bold text-primary/60 dark:text-white/50 tabular-nums">
              <span>{progress.label}</span>
              <span>{progress.pct}%</span>
            </div>
            <div className="h-1.5 w-full bg-primary/10 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className={clsx(
                  'h-full rounded-full transition-all duration-500',
                  progress.complete ? 'bg-emerald-500' : 'bg-primary dark:bg-white/80'
                )}
                style={{ width: `${progress.pct}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 min-w-[100px]" title={recruiterNames.join(', ') || 'No recruiters'}>
            <Users size={14} className="text-muted-foreground shrink-0" />
            {recruiterNames.length > 0 ? (
              <span className="text-xs font-medium text-primary/70 dark:text-white/70 truncate max-w-[120px]">
                {recruiterNames.slice(0, 2).join(', ')}
                {recruiterNames.length > 2 ? ` +${recruiterNames.length - 2}` : ''}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground italic">Unassigned</span>
            )}
          </div>
        </div>

        <div
          className="flex items-center gap-2 shrink-0 lg:ml-auto"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <Link
            to={`/pipeline/${requirement.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/5 dark:bg-white/5 text-primary dark:text-white text-xs font-bold uppercase tracking-wider hover:bg-primary/10 dark:hover:bg-white/10 transition-colors"
          >
            <GitBranch size={14} />
            Pipeline
          </Link>
          <ActionsMenu items={menuItems} aria-label={`Actions for ${requirement.title}`} />
          <ChevronRight
            size={18}
            className="text-primary/30 dark:text-white/30 group-hover:text-primary dark:group-hover:text-white transition-colors hidden sm:block"
          />
        </div>
      </div>
    </article>
  )
}
