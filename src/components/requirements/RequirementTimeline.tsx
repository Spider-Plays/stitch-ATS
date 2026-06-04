import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import clsx from 'clsx'
import type { Requirement, User } from '../../types'
import {
  buildRequirementTimeline,
  formatVersionChanges,
  versionKindLabel,
  workflowEventDotClass,
  workflowEventTitle,
} from '../../lib/requirementTimeline'

type RequirementTimelineProps = {
  requirement: Requirement
  users: User[]
}

export function RequirementTimeline({ requirement, users }: RequirementTimelineProps) {
  const entries = useMemo(
    () => buildRequirementTimeline(requirement),
    [requirement.approvalHistory, requirement.versions]
  )

  const userName = (id: string) => users.find((u) => u.uid === id)?.name ?? id

  if (entries.length === 0) {
    return (
      <div className="text-center p-12 text-slate-500 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
        No activity yet. Approvals, edits, and assignment changes will appear here.
      </div>
    )
  }

  return (
    <div className="relative border-l-2 border-slate-200 dark:border-white/10 ml-3 space-y-8">
      {entries.map((entry, idx) => {
        if (entry.kind === 'workflow') {
          const { event } = entry
          return (
            <div key={`wf-${event.at}-${idx}`} className="relative pl-8">
              <div
                className={clsx(
                  'absolute -left-[9px] top-0 size-4 rounded-full border-2 border-white dark:border-black',
                  workflowEventDotClass(event.action)
                )}
              />
              <div>
                <p className="text-sm font-bold text-primary dark:text-white">
                  {workflowEventTitle(event, users)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {format(new Date(event.at), 'PPP p')}
                  {event.role ? ` · ${event.role.replace(/_/g, ' ')}` : ''}
                </p>
                {event.comments &&
                  event.action !== 'RECRUITER_ASSIGNED' &&
                  event.action !== 'RECRUITER_UNASSIGNED' && (
                  <p className="mt-2 text-sm bg-slate-50 dark:bg-white/5 p-3 rounded-lg text-slate-600 dark:text-slate-300">
                    {event.comments}
                  </p>
                )}
              </div>
            </div>
          )
        }

        const ver = entry.version
        const kind =
          ver.kind ??
          (typeof ver.changes?.candidateId === 'string' ? 'CANDIDATE_LINKED' : 'UPDATE')
        const changes = formatVersionChanges(ver.changes ?? {})

        return (
          <div key={`ver-${ver.changedAt}-${idx}`} className="relative pl-8">
            <div
              className={clsx(
                'absolute -left-[9px] top-0 size-4 rounded-full border-2 border-white dark:border-black',
                kind === 'CANDIDATE_LINKED' ? 'bg-emerald-500' : 'bg-indigo-500'
              )}
            />
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-primary dark:text-white">
                  {versionKindLabel(ver)}
                </p>
                {ver.version > 0 && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200">
                    v{ver.version}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {userName(ver.changedBy)} · {format(new Date(ver.changedAt), 'PPP p')}
              </p>

              {kind === 'CANDIDATE_LINKED' && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30">
                  <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                    {String(
                      ver.changes.candidateName ??
                        ver.linkedCandidates?.find(
                          (lc) => lc.id === ver.changes.candidateId
                        )?.name ??
                        'Candidate'
                    )}
                  </p>
                  {typeof ver.changes.matchScore === 'number' && (
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">
                      Match score: {ver.changes.matchScore}%
                    </p>
                  )}
                </div>
              )}

              {kind === 'UPDATE' && changes.length > 0 && (
                <ul className="text-sm space-y-1.5">
                  {changes.map((c) => (
                    <li key={c.label} className="flex flex-col sm:flex-row sm:gap-2">
                      <span className="text-slate-500 shrink-0 sm:w-40">{c.label}</span>
                      <span className="text-primary dark:text-white font-medium break-words">
                        {c.value}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {(ver.linkedCandidates?.length ?? 0) > 0 && (
                <div className="pt-2 border-t border-slate-200/80 dark:border-white/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                    Linked candidates ({ver.linkedCandidates!.length})
                  </p>
                  <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                    {ver.linkedCandidates!.slice(0, 8).map((lc) => (
                      <li key={lc.id}>
                        <Link
                          to={`/candidates/${lc.id}`}
                          className="font-bold text-primary dark:text-white hover:underline"
                        >
                          {lc.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
