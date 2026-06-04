import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { PortalPipelineTracker } from './PortalPipelineTracker'
import {
  portalJobStatusLabel,
  resolvePortalJobStatus,
} from '../../lib/portalApplicationStatus'
import { statusDisplayLabel } from '../../lib/portalWorkflow'
import type { CandidateStatus } from '../../types'
import type { PortalApplication } from '../../services/http/portal'
import clsx from 'clsx'
import { AlertCircle, Briefcase, Building2, Hash, MapPin } from 'lucide-react'

export function PortalApplicationCard({ app }: { app: PortalApplication }) {
  const pipelineStatus = app.pipelineStatus as CandidateStatus
  const jobStatus =
    app.portalJobStatus ??
    resolvePortalJobStatus(
      app.requirementStatus,
      app.listedOnPortal,
      app.pipelineStatus
    )
  const isClosed = jobStatus === 'CLOSED'

  return (
    <article
      className={clsx(
        'app-card overflow-hidden',
        app.isCurrent && !isClosed
          ? 'border-emerald-300 dark:border-emerald-500/40 ring-1 ring-emerald-100 dark:ring-emerald-500/20'
          : 'border-slate-200',
        isClosed && 'opacity-95'
      )}
    >
      <div className="p-6 border-b border-slate-100 dark:border-border">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {app.isCurrent && !isClosed && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                  Current application
                </span>
              )}
              <span
                className={clsx(
                  'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                  isClosed ? 'bg-slate-200 text-slate-700' : 'bg-teal-100 text-teal-800'
                )}
              >
                {portalJobStatusLabel(jobStatus)}
              </span>
              <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                <Hash size={12} /> {app.jobCode}
              </p>
            </div>
            <h2 className="text-xl font-black text-slate-900">{app.title}</h2>
            <div className="flex flex-wrap gap-3 text-sm text-slate-600">
              {app.client && (
                <span className="inline-flex items-center gap-1">
                  <Building2 size={14} /> {app.client}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Briefcase size={14} /> {app.department}
              </span>
              {app.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={14} /> {app.location}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Applied {format(new Date(app.appliedAt), 'PPP')}
              {app.matchScore > 0 && ` · Match ${app.matchScore}%`}
              {!isClosed && ` · Stage: ${statusDisplayLabel(pipelineStatus)}`}
            </p>
          </div>
        </div>

        {isClosed && app.closedReason && (
          <p className="flex items-start gap-2 mt-4 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            {app.closedReason}
          </p>
        )}
      </div>

      {app.isCurrent && !isClosed && (
        <div className="p-6 space-y-4 border-b border-slate-100">
          <p className="text-xs font-bold uppercase text-slate-400">Your progress</p>
          <PortalPipelineTracker status={pipelineStatus} compact />
        </div>
      )}

      <div className="px-6 py-4 flex flex-wrap gap-3">
        <Link
          to={`/portal/jobs/applied/${app.requirementId}`}
          className="inline-flex items-center gap-1 px-4 py-2.5 rounded-xl bg-[#0f3d38] text-white text-sm font-bold"
        >
          Current updates
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
        </Link>
        {app.listedOnPortal && !isClosed && (
          <Link
            to={`/portal/jobs/${app.requirementId}`}
            className="text-sm font-bold text-slate-600 hover:text-[#0f3d38] py-2.5"
          >
            Job posting →
          </Link>
        )}
      </div>
    </article>
  )
}
