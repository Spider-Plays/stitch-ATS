import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart3,
  Briefcase,
  ChevronRight,
  LayoutDashboard,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react'
import clsx from 'clsx'
import { api } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import { InterviewStatCard } from '@/components/interviews/InterviewStatCard'
import { adminMetrics, candidatePipelineCounts, recruiterMetrics } from '@/pages/dashboard/dashboard.utils'
import { recruitmentSourceBreakdown } from '@/lib/featureCandidates'
import { dashboardsForPages } from '@/pages/features/mis/mis.utils'
import { requirementStats } from '@/pages/requirements/_shared/requirement.utils'
import { scopeInterviewsForUser, isAdminRole } from '@/permissions'
import type { Candidate } from '@/types'
import { PageHero } from '@/components/layout/PageHero'
import './mis.css'

function PipelineBar({ candidates }: { candidates: Candidate[] }) {
  const stages = useMemo(() => candidatePipelineCounts(candidates), [candidates])
  const total = stages.reduce((s, x) => s + x.count, 0) || 1
  const barColors = [
    'bg-slate-400',
    'bg-sky-500',
    'bg-blue-500',
    'bg-violet-500',
    'bg-amber-500',
    'bg-emerald-500',
  ]

  return (
    <div className="space-y-4">
      <div className="flex h-3 rounded-full overflow-hidden bg-primary/5 dark:bg-white/10">
        {stages.map((s, i) =>
          s.count > 0 ? (
            <div
              key={s.stage}
              className={clsx('h-full', barColors[i])}
              style={{ width: `${(s.count / total) * 100}%` }}
              title={`${s.label}: ${s.count}`}
            />
          ) : null
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {stages.map((s, i) => (
          <div key={s.stage} className="app-card-inset p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {s.label}
            </p>
            <p className="text-lg font-black tabular-nums text-foreground">{s.count}</p>
            <div className={clsx('size-1.5 rounded-full mt-1', barColors[i])} />
          </div>
        ))}
      </div>
    </div>
  )
}

const MisDashboard = () => {
  const { user, allowedPages } = useAuth()
  const role = user?.role ?? 'RECRUITER'

  const { data: candidates = [] } = useQuery({
    queryKey: ['candidates'],
    queryFn: api.candidates.list,
  })
  const { data: requirements = [] } = useQuery({
    queryKey: ['requirements'],
    queryFn: api.requirements.list,
  })
  const { data: interviews = [] } = useQuery({
    queryKey: ['interviews'],
    queryFn: api.interviews.list,
  })
  const { data: offers = [] } = useQuery({
    queryKey: ['offers'],
    queryFn: api.offers.list,
  })
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: api.users.list,
    enabled: isAdminRole(role) || role === 'HR_HEAD' || role === 'HR_MANAGER',
  })
  const { data: activityLogs = [] } = useQuery({
    queryKey: ['activityLogs'],
    queryFn: () => api.activityLogs.list(),
    enabled: isAdminRole(role),
  })

  const scopedInterviews = useMemo(
    () => scopeInterviewsForUser(interviews, role, user?.uid),
    [interviews, role, user?.uid]
  )

  const reqStats = useMemo(() => requirementStats(requirements), [requirements])
  const sources = useMemo(() => recruitmentSourceBreakdown(candidates), [candidates])
  const dashboards = useMemo(() => dashboardsForPages(allowedPages), [allowedPages])

  const metrics = useMemo(() => {
    if (isAdminRole(role)) {
      const m = adminMetrics(requirements, candidates, users, activityLogs)
      return {
        live: m.live,
        candidates: m.candidates,
        hires: m.hires,
        pending: m.pending,
        team: m.team,
      }
    }
    const m = recruiterMetrics(requirements, candidates, scopedInterviews, offers)
    return {
      live: m.live,
      candidates: m.candidates,
      hires: m.hires,
      pending: reqStats.pending,
      team: undefined as number | undefined,
    }
  }, [role, requirements, candidates, users, activityLogs, scopedInterviews, offers, reqStats.pending])

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      <PageHero
        icon={BarChart3}
        eyebrow="MIS"
        title="MIS & recruitment dashboards"
        description="Hiring KPIs, source mix, pipeline health, and quick access to every recruitment module you are allowed to use."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <InterviewStatCard label="Live roles" value={metrics.live} icon={Briefcase} accent="blue" />
        <InterviewStatCard label="Candidates" value={metrics.candidates} icon={Users} accent="slate" />
        <InterviewStatCard label="Hires" value={metrics.hires} icon={TrendingUp} accent="green" />
        <InterviewStatCard
          label="Portal apps"
          value={sources.careers}
          icon={UserPlus}
          accent="amber"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="app-card p-6 space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
            Source mix
          </h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div className="app-card-inset p-4">
              <dt className="text-[10px] font-bold uppercase text-muted-foreground">Careers / portal</dt>
              <dd className="text-2xl font-black tabular-nums mt-1">{sources.careers}</dd>
            </div>
            <div className="app-card-inset p-4">
              <dt className="text-[10px] font-bold uppercase text-muted-foreground">ERP referrals</dt>
              <dd className="text-2xl font-black tabular-nums mt-1">{sources.erp}</dd>
            </div>
            <div className="app-card-inset p-4">
              <dt className="text-[10px] font-bold uppercase text-muted-foreground">Vendor</dt>
              <dd className="text-2xl font-black tabular-nums mt-1">{sources.vendor}</dd>
            </div>
            <div className="app-card-inset p-4">
              <dt className="text-[10px] font-bold uppercase text-muted-foreground">Other</dt>
              <dd className="text-2xl font-black tabular-nums mt-1">{sources.other}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-2 pt-2">
            <Link
              to="/features/careers"
              className="text-xs font-bold text-primary hover:underline"
            >
              Careers list →
            </Link>
            <Link
              to="/features/employee-referral"
              className="text-xs font-bold text-primary hover:underline"
            >
              ERP list →
            </Link>
          </div>
        </section>

        <section className="app-card p-6 space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
            Pipeline snapshot
          </h2>
          <PipelineBar candidates={candidates} />
        </section>
      </div>

      <section className="app-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border/60 flex items-center gap-2">
          <LayoutDashboard size={18} className="text-muted-foreground" />
          <h2 className="text-base font-bold text-foreground">Recruitment dashboards</h2>
        </div>
        {dashboards.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            No standard recruitment pages are enabled for your role. Contact an admin to adjust role
            page access.
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {dashboards.map((d) => {
              const Icon = d.icon
              return (
                <li key={d.to}>
                  <Link
                    to={d.to}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-primary/[0.02] dark:hover:bg-white/[0.03] transition-colors group"
                  >
                    <div className="size-10 rounded-xl bg-primary/10 dark:bg-white/10 flex items-center justify-center shrink-0">
                      <Icon size={18} className="text-primary dark:text-white/80" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{d.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{d.description}</p>
                    </div>
                    <ChevronRight
                      size={18}
                      className="text-muted-foreground group-hover:text-foreground shrink-0"
                    />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {metrics.pending !== undefined && metrics.pending > 0 && (
        <div className="app-card p-4 flex flex-wrap items-center justify-between gap-3 border-amber-200/60 dark:border-amber-500/30 bg-amber-500/5">
          <p className="text-sm font-medium text-foreground">
            <span className="font-black tabular-nums">{metrics.pending}</span> requirement
            {metrics.pending === 1 ? '' : 's'} pending approval
          </p>
          {allowedPages.includes('requirements') && (
            <Link
              to="/requirements"
              className="text-sm font-bold text-primary hover:underline inline-flex items-center gap-1"
            >
              Review <ChevronRight size={14} />
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

export default MisDashboard
