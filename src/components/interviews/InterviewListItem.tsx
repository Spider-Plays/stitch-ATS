import React from 'react'
import { Link } from 'react-router-dom'
import {
  Clock,
  Video,
  MapPin,
  ExternalLink,
  Pencil,
  X,
  MessageSquare,
  User,
  FileText,
} from 'lucide-react'
import clsx from 'clsx'
import type { Interview } from '../../types'
import {
  canEditInterview,
  canViewInterviewFeedback,
  getInterviewDisplayLabel,
  interviewDisplayStatusClass,
} from '../../lib/interviewDisplayStatus'
import { formatInterviewTime, isUpcoming, needsFeedback, stageLabel, stageOrderLabel } from '../../lib/interviewPage'
import { showInterviewerSessionActions } from '../../lib/interviewPermissions'

interface InterviewListItemProps {
  interview: Interview
  jobTitle?: string
  variant?: 'timeline' | 'row' | 'alert'
  canManage: boolean
  userRole?: string | null
  currentUserId?: string | null
  onCancel?: (interview: Interview) => void
  cancelPending?: boolean
  hideCandidateLink?: boolean
}

export function InterviewListItem({
  interview,
  jobTitle,
  variant = 'row',
  canManage,
  userRole,
  currentUserId,
  onCancel,
  cancelPending,
  hideCandidateLink = false,
}: InterviewListItemProps) {
  const displayLabel = getInterviewDisplayLabel(interview)
  const scheduled = new Date(interview.scheduledAt)
  const showSubmitFeedback = needsFeedback(interview)
  const showViewFeedback = canViewInterviewFeedback(interview)
  const round = stageOrderLabel(interview)

  const statusBadge = (
    <span
      className={clsx(
        'shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border',
        interviewDisplayStatusClass(displayLabel)
      )}
    >
      {displayLabel}
    </span>
  )

  const sessionActions = showInterviewerSessionActions(interview, currentUserId)
  const canJoinMeeting =
    !!interview.meetingLink &&
    interview.status !== 'CANCELLED' &&
    (isUpcoming(interview) || displayLabel === 'Scheduled')

  const interviewerSessionActions = sessionActions ? (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        to={`/interviews/${interview.id}/resume`}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary/15 dark:border-white/15 app-card text-primary dark:text-white text-xs font-bold uppercase tracking-wider hover:bg-primary/5 dark:hover:bg-white/10 transition-colors"
      >
        <FileText size={14} />
        View resume
      </Link>
      {canJoinMeeting && (
        <a
          href={interview.meetingLink}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
        >
          <Video size={14} />
          Join meeting
        </a>
      )}
    </div>
  ) : null

  const actions = (
    <div className="flex flex-col gap-2">
      {interviewerSessionActions}
      <div className="flex flex-wrap items-center gap-2">
      {canJoinMeeting && !sessionActions && (
        <a
          href={interview.meetingLink}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
        >
          <Video size={14} /> Join meeting
        </a>
      )}
      {showSubmitFeedback && (
        <Link
          to={`/interviews/${interview.id}/feedback`}
          className={clsx(
            'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all',
            variant === 'alert'
              ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/25'
              : 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-500/30'
          )}
        >
          <MessageSquare size={14} />
          Submit feedback
        </Link>
      )}
      {showViewFeedback && !showSubmitFeedback && (
        <Link
          to={`/interviews/${interview.id}/feedback`}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200 text-xs font-bold uppercase tracking-wider hover:bg-green-200 dark:hover:bg-green-500/30 transition-all"
        >
          <MessageSquare size={14} />
          View feedback
        </Link>
      )}
      {canManage && canEditInterview(interview, userRole) && (
        <>
          <Link
            to={`/interviews/${interview.id}/edit`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/5 dark:bg-white/5 text-primary dark:text-white text-xs font-bold uppercase tracking-wider hover:bg-primary/10 dark:hover:bg-white/10 transition-colors"
          >
            <Pencil size={14} /> Edit
          </Link>
          {onCancel && (
            <button
              type="button"
              onClick={() => onCancel(interview)}
              disabled={cancelPending}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 text-xs font-bold uppercase tracking-wider hover:bg-red-100 dark:hover:bg-red-500/20 disabled:opacity-50 transition-colors"
            >
              <X size={14} /> Cancel
            </button>
          )}
        </>
      )}
      {!hideCandidateLink && !sessionActions && (
        <Link
          to={`/candidates/${interview.candidateId}`}
          className="inline-flex items-center justify-center p-2 rounded-xl bg-primary/5 dark:bg-white/5 text-primary dark:text-white hover:bg-primary/10 dark:hover:bg-white/10 transition-colors"
          title="View candidate"
        >
          <User size={16} />
        </Link>
      )}
      </div>
    </div>
  )

  if (variant === 'timeline') {
    return (
      <article
        className={clsx(
          'relative flex gap-4 p-4 rounded-2xl border transition-all hover:shadow-md',
          showSubmitFeedback
            ? 'border-amber-200/80 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/5'
            : 'border-primary/10 dark:border-white/10 app-card'
        )}
      >
        <div className="shrink-0 w-16 text-center">
          <p className="text-lg font-black text-primary dark:text-white tabular-nums">
            {formatInterviewTime(scheduled)}
          </p>
          <p className="text-[10px] font-bold text-primary/50 dark:text-white/50 uppercase">
            {interview.duration ?? 60}m
          </p>
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-primary dark:text-white truncate">
                {interview.candidateName || 'Unknown candidate'}
              </h3>
              <p className="text-xs font-medium text-primary/60 dark:text-white/60">
                {[round, stageLabel(interview), jobTitle].filter(Boolean).join(' · ')}
              </p>
            </div>
            {statusBadge}
          </div>
          <div className="flex items-center gap-2 text-xs text-primary/60 dark:text-white/60">
            {interview.meetingLink ? <Video size={14} /> : <MapPin size={14} />}
            <span>{interview.meetingLink ? 'Video call' : interview.location || 'Location TBD'}</span>
          </div>
          {actions}
        </div>
      </article>
    )
  }

  return (
    <article
      className={clsx(
        'flex flex-col lg:flex-row lg:items-center gap-4 p-5 rounded-2xl border transition-all hover:shadow-sm',
        variant === 'alert'
          ? 'border-amber-300/60 dark:border-amber-500/40 bg-gradient-to-r from-amber-50 to-white dark:from-amber-500/10 dark:to-white/5'
          : 'border-primary/10 dark:border-white/10 app-card'
      )}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div
          className={clsx(
            'size-12 rounded-2xl flex items-center justify-center font-black text-lg shrink-0',
            variant === 'alert'
              ? 'bg-amber-200/80 text-amber-900 dark:bg-amber-500/30 dark:text-amber-100'
              : 'bg-primary/10 dark:bg-white/10 text-primary dark:text-white'
          )}
        >
          {(interview.candidateName || '?').charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-primary dark:text-white truncate">
              {hideCandidateLink
                ? [round, stageLabel(interview)].filter(Boolean).join(' · ') || interview.type
                : interview.candidateName || 'Unknown candidate'}
            </h3>
            {!hideCandidateLink && (
              <span className="px-2 py-0.5 rounded-md bg-primary/10 dark:bg-white/10 text-[10px] font-bold uppercase text-primary/80 dark:text-white/80">
                {stageLabel(interview)}
              </span>
            )}
            {!hideCandidateLink && round && (
              <span className="text-[10px] font-bold text-muted-foreground">{round}</span>
            )}
          </div>
          <p className="text-xs font-medium text-primary/60 dark:text-white/60 mt-0.5 truncate">
            {hideCandidateLink
              ? [jobTitle, interview.type.replace(/_/g, ' ')].filter(Boolean).join(' · ')
              : `${interview.candidateRole || '—'}${jobTitle ? ` · ${jobTitle}` : ''}`}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-medium text-primary/50 dark:text-white/50">
            <span className="inline-flex items-center gap-1">
              <Clock size={12} />
              {scheduled.toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
            <span>{interview.duration ?? 60} min</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:shrink-0">
        {statusBadge}
        <div className="flex flex-wrap gap-2">{actions}</div>
      </div>
    </article>
  )
}
