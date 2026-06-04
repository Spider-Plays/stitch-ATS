import React from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { api } from '../../services/api'
import { PortalPipelineTracker } from '../../components/portal/PortalPipelineTracker'
import {
  portalJobStatusLabel,
  resolvePortalJobStatus,
} from '../../lib/portalApplicationStatus'
import type { CandidateStatus } from '../../types'
import clsx from 'clsx'
import {
  AlertCircle,
  Briefcase,
  Building2,
  Calendar,
  FileText,
  Hash,
  Loader2,
  MapPin,
} from 'lucide-react'
import { EmptyState } from '../../components/ui/EmptyState'

const PortalApplicationUpdates = () => {
  const { requirementId } = useParams<{ requirementId: string }>()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['portal-application', requirementId],
    queryFn: () => api.portal.getApplication(requirementId!),
    enabled: !!requirementId,
  })

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-slate-500">
        <Loader2 className="animate-spin" size={28} />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center space-y-4">
        <p className="text-red-600 font-medium">Application not found</p>
      </div>
    )
  }

  const { application, updates, interviews, offers } = data
  const isClosed =
    application.portalJobStatus === 'CLOSED' ||
    resolvePortalJobStatus(
      application.requirementStatus,
      application.listedOnPortal,
      application.pipelineStatus
    ) === 'CLOSED'
  const pipelineStatus = application.pipelineStatus as CandidateStatus

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10 space-y-6">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
          Current updates
        </p>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
              <Hash size={12} /> {application.jobCode}
            </p>
            <h1 className="text-2xl font-black text-slate-900 mt-1">{application.title}</h1>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-600">
              {application.client && (
                <span className="inline-flex items-center gap-1">
                  <Building2 size={14} /> {application.client}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Briefcase size={14} /> {application.department}
              </span>
              {application.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={14} /> {application.location}
                </span>
              )}
            </div>
          </div>
          <span
            className={clsx(
              'px-3 py-1 rounded-full text-xs font-bold uppercase shrink-0',
              isClosed ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-800'
            )}
          >
            {portalJobStatusLabel(
              application.portalJobStatus ??
                resolvePortalJobStatus(
                  application.requirementStatus,
                  application.listedOnPortal,
                  application.pipelineStatus
                )
            )}
          </span>
        </div>
      </header>

      {isClosed && application.closedReason && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex gap-3 text-sm text-slate-700">
          <AlertCircle size={18} className="shrink-0 text-slate-500" />
          <p>{application.closedReason}</p>
        </div>
      )}

      {!isClosed && application.isCurrent && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <p className="text-xs font-bold uppercase text-slate-400 mb-4">Application progress</p>
          <PortalPipelineTracker status={pipelineStatus} />
        </section>
      )}

      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-bold text-slate-900 mb-4">Update timeline</h2>
        {updates.length === 0 ? (
          <EmptyState
            icon="history"
            title="No updates yet"
            description="Activity for this application will appear here as your hiring process moves forward."
          />
        ) : (
          <ul className="relative border-l-2 border-slate-200 ml-3 space-y-6">
            {updates.map((u) => (
              <li key={u.id} className="relative pl-6">
                <span className="absolute -left-[9px] top-1 size-4 rounded-full bg-[#0f3d38] ring-4 ring-white" />
                <p className="text-xs text-slate-500">{format(new Date(u.at), 'PPP p')}</p>
                <p className="font-bold text-slate-900 mt-0.5">{u.summary}</p>
                {u.performerName && (
                  <p className="text-xs text-slate-500 mt-0.5">By {u.performerName}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {interviews.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Calendar size={20} className="text-[#0f3d38]" />
            Interviews ({interviews.length})
          </h2>
          <ul className="space-y-3">
            {interviews.map((iv) => (
              <li key={iv.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 text-sm">
                <p className="font-bold">{iv.type}</p>
                <p className="text-slate-600">{format(new Date(iv.scheduledAt), 'PPP p')}</p>
                <p className="text-xs text-slate-400 mt-1">{iv.status}</p>
                {iv.meetingLink && (
                  <a
                    href={iv.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#0f3d38] font-bold text-xs mt-2 inline-block"
                  >
                    Join meeting →
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {offers.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
            <FileText size={20} className="text-[#0f3d38]" />
            Offers ({offers.length})
          </h2>
          <ul className="space-y-3">
            {offers.map((o) => (
              <li key={o.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 text-sm">
                <p className="font-bold">Base salary: {o.baseSalary.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1">Status: {o.status}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

export default PortalApplicationUpdates
