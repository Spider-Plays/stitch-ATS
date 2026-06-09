import React from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/services/api'
import {
  Calendar,
  FileText,
  Briefcase,
  MapPin,
  AlertCircle,
  ArrowRight,
  Video,
} from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { PortalPipelineTracker } from '@/components/portal/PortalPipelineTracker'
import { statusDisplayLabel } from '@/lib/portalWorkflow'
import clsx from 'clsx'
import { format } from 'date-fns'
import './dashboard.css'

const CandidateDashboard = () => {
  const { user } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['portal-me'],
    queryFn: api.portal.getMe,
  })

  const { data: openCount = 0 } = useQuery({
    queryKey: ['portal-positions'],
    queryFn: api.portal.getOpenPositions,
    select: (jobs) => jobs.length,
  })

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-slate-500">
        Loading your dashboard…
      </div>
    )
  }

  if (!data?.linked) {
    return <Navigate to="/portal/onboarding" replace />
  }

  const { candidate, requirement, requirementHidden, requirementMessage, interviews, offers } =
    data

  const upcomingInterview = interviews.find(
    (iv) => iv.status === 'SCHEDULED' && new Date(iv.scheduledAt) > new Date()
  )

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
            Candidate home
          </p>
          <h1 className="text-3xl font-black text-slate-900 mt-1">
            Hello, {candidate.name.split(' ')[0]}
          </h1>
          <p className="text-slate-600 text-sm mt-1">{user?.email}</p>
        </div>
        <Link
          to="/portal/onboarding"
          className="text-sm font-bold text-[#0f3d38] hover:underline shrink-0"
        >
          Edit profile
        </Link>
      </header>

      {!requirement && (
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-[#0f3d38]">Ready to apply?</h2>
            <p className="text-sm text-slate-600 mt-1">
              {openCount > 0
                ? `${openCount} open role${openCount !== 1 ? 's' : ''} on the portal. Pick one and submit your application.`
                : 'Check back soon for new openings.'}
            </p>
          </div>
          <Link
            to="/portal/jobs"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0f3d38] text-white font-bold text-sm shrink-0"
          >
            Browse roles
            <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {requirement && (
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 pt-4 flex justify-end">
            <Link
              to={
                requirement.id
                  ? `/portal/jobs/applied/${requirement.id}`
                  : '/portal/jobs?tab=applied'
              }
              className="text-sm font-bold text-[#0f3d38] hover:underline"
            >
              Current updates →
            </Link>
          </div>
          <div className="p-6 border-b border-slate-100">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Your application</p>
                <h2 className="text-xl font-black text-slate-900 mt-0.5">
                  {requirementHidden ? 'Application in progress' : requirement.title}
                </h2>
                {!requirementHidden && (
                  <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin size={14} />
                    {requirement.client ? `${requirement.client} · ` : ''}
                    {requirement.department}
                    {requirement.location ? ` · ${requirement.location}` : ''}
                  </p>
                )}
              </div>
              <span
                className={clsx(
                  'px-3 py-1 rounded-full text-xs font-bold uppercase',
                  candidate.status === 'HIRED' && 'bg-emerald-100 text-emerald-800',
                  candidate.status === 'REJECTED' && 'bg-rose-100 text-rose-800',
                  candidate.status !== 'HIRED' &&
                    candidate.status !== 'REJECTED' &&
                    'bg-teal-100 text-teal-800'
                )}
              >
                {statusDisplayLabel(candidate.status)}
              </span>
            </div>
            {requirementHidden && requirementMessage && (
              <p className="flex items-start gap-2 mt-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                {requirementMessage}
              </p>
            )}
          </div>
          <div className="p-6">
            <p className="text-xs font-bold uppercase text-slate-400 mb-4">Application progress</p>
            <PortalPipelineTracker status={candidate.status} />
          </div>
        </section>
      )}

      {upcomingInterview && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-3">
            <div className="size-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Video size={22} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-blue-700">Next interview</p>
              <p className="font-bold text-slate-900">{upcomingInterview.type}</p>
              <p className="text-sm text-slate-600">
                {format(new Date(upcomingInterview.scheduledAt), 'PPP p')}
              </p>
            </div>
          </div>
          {upcomingInterview.meetingLink && (
            <a
              href={upcomingInterview.meetingLink}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold shrink-0 text-center"
            >
              Join meeting
            </a>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Calendar size={20} className="text-[#0f3d38]" />
            Interviews ({interviews.length})
          </h2>
          {interviews.length === 0 ? (
            <EmptyState
              icon="event"
              title="No interviews yet"
              description="When the team schedules a round, details will show here."
            />
          ) : (
            <ul className="space-y-3">
              {interviews.map((iv) => (
                <li
                  key={iv.id}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50 text-sm"
                >
                  <div className="flex justify-between gap-2">
                    <p className="font-bold text-slate-900">{iv.type}</p>
                    <span className="text-[10px] font-bold uppercase text-slate-500">
                      {iv.status}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1">
                    {format(new Date(iv.scheduledAt), 'PPP p')}
                  </p>
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
          )}
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
            <FileText size={20} className="text-[#0f3d38]" />
            Offers ({offers.length})
          </h2>
          {offers.length === 0 ? (
            <EmptyState
              icon="card_giftcard"
              title="No offers yet"
              description="Offer details will appear when extended by the hiring team."
            />
          ) : (
            <ul className="space-y-3">
              {offers.map((o) => (
                <li
                  key={o.id}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50 text-sm"
                >
                  <p className="font-bold text-slate-900">
                    Base: {o.baseSalary.toLocaleString()}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">Status: {o.status}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <Link
        to="/portal/jobs"
        className="flex items-center justify-between p-5 rounded-2xl border border-slate-200 bg-white hover:border-[#0f3d38]/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Briefcase className="text-[#0f3d38]" size={24} />
          <div>
            <p className="font-bold text-slate-900">Open roles</p>
            <p className="text-sm text-slate-500">View all positions on the portal</p>
          </div>
        </div>
        <ArrowRight size={20} className="text-slate-400" />
      </Link>
    </div>
  )
}

export default CandidateDashboard
