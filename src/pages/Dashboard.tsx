import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  ArrowRight,
  Briefcase,
  CalendarClock,
  ChevronRight,
  LayoutDashboard,
  MessageSquare,
  MessageSquareWarning,
  Plus,
  UserPlus,
  Users,
  Video,
  Zap,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react'
import clsx from 'clsx'
import { UserAvatar } from '../components/ui/UserAvatar'
import { api } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import {
  canApproveRequirement,
  requiresHrHeadDelegationForApproval,
} from '../lib/requirementPermissions'
import { PageHero, heroBtnPrimary, heroBtnSecondary } from '../components/layout/PageHero'
import { EmptyState } from '../components/ui/EmptyState'
import { InterviewStatCard } from '../components/interviews/InterviewStatCard'
import {
  activityLogLink,
  adminMetrics,
  candidatePipelineCounts,
  formatActivityTitle,
  interviewerMetrics,
  isScheduledToday,
  recruiterMetrics,
  relativeTime,
  sortInterviewsChronologically,
} from '../lib/dashboardPage'
import {
  fillProgress,
  priorityMeta,
  requirementStatusClass,
  requirementStatusLabel,
} from '../lib/requirementPage'
import {
  formatInterviewDay,
  formatInterviewTime,
  isUpcoming,
  needsFeedback,
  stageLabel,
} from '../lib/interviewPage'
import { scopeInterviewsForUser } from '../lib/interviewPermissions'
import { InterviewListItem } from '../components/interviews/InterviewListItem'
import type {
  ActivityLog,
  Candidate,
  Interview,
  Offer,
  Requirement,
  User,
} from '../types'

function QuickLink({
  to,
  icon: Icon,
  label,
}: {
  to: string
  icon: LucideIcon
  label: string
}) {
  return (
    <Link
      to={to}
      className="app-card-interactive inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-foreground hover:border-primary/25 transition-all"
    >
      <Icon size={16} className="text-muted-foreground" />
      {label}
      <ChevronRight size={14} className="opacity-40" />
    </Link>
  )
}

function SectionCard({
  title,
  action,
  children,
  className,
  id,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  id?: string
}) {
  return (
    <section
      id={id}
      className={clsx(
        'app-card overflow-hidden',
        className
      )}
    >
      <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between gap-4">
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function PipelineOverview({ candidates }: { candidates: Candidate[] }) {
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

  if (total <= 1 && candidates.length === 0) {
    return (
      <EmptyState
        icon="account_tree"
        title="No candidates yet"
        description="Add candidates or open a job pipeline to see stage breakdown."
      />
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex h-3 rounded-full overflow-hidden bg-primary/5 dark:bg-white/10">
        {stages.map((s, i) =>
          s.count > 0 ? (
            <div
              key={s.stage}
              className={clsx('h-full transition-all duration-700', barColors[i])}
              style={{ width: `${(s.count / total) * 100}%` }}
              title={`${s.label}: ${s.count}`}
            />
          ) : null
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stages.map((s, i) => (
          <div
            key={s.stage}
            className="app-card-inset p-3"
          >
            <div className={clsx('size-2 rounded-full mb-2', barColors[i])} />
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary/50 dark:text-white/50">
              {s.label}
            </p>
            <p className="text-xl font-black text-primary dark:text-white tabular-nums mt-0.5">{s.count}</p>
            <p className="text-[10px] font-bold text-muted-foreground mt-1">
              {Math.round((s.count / total) * 100)}%
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ActivityFeed({ logs }: { logs: ActivityLog[] }) {
  if (logs.length === 0) {
    return <EmptyState icon="history" title="No activity yet" description="Actions across the ATS will appear here." />
  }

  return (
    <ul className="divide-y section-divider">
      {logs.slice(0, 10).map((log) => {
        const href = activityLogLink(log)
        const content = (
          <div className="flex items-start gap-4 px-6 py-4 hover:bg-primary/[0.02] dark:hover:bg-white/[0.03] transition-colors">
            <div className="size-9 rounded-xl bg-primary/10 dark:bg-white/10 flex items-center justify-center shrink-0">
              <Activity size={16} className="text-primary dark:text-white/80" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-primary dark:text-white truncate">
                {formatActivityTitle(log)}
              </p>
              <p className="text-xs text-primary/50 dark:text-white/50 mt-0.5">
                {log.performerName || 'System'}
                {log.performerRole ? ` · ${log.performerRole.replace(/_/g, ' ')}` : ''}
              </p>
            </div>
            <span className="text-[11px] font-bold text-muted-foreground shrink-0 tabular-nums">
              {relativeTime(log.timestamp)}
            </span>
          </div>
        )
        return (
          <li key={log.id}>
            {href ? (
              <Link to={href} className="block">
                {content}
              </Link>
            ) : (
              content
            )}
          </li>
        )
      })}
    </ul>
  )
}

function RequirementCompactRow({ req }: { req: Requirement }) {
  const { pct, label } = fillProgress(req.filled, req.openings)
  const priority = priorityMeta(req.priority)

  return (
    <Link
      to={`/requirements/${req.id}`}
      className="flex items-center gap-4 px-6 py-4 hover:bg-primary/[0.02] dark:hover:bg-white/[0.03] transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <p className="text-sm font-bold text-primary dark:text-white truncate">{req.title}</p>
          <span
            className={clsx(
              'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border',
              requirementStatusClass(req.status)
            )}
          >
            {requirementStatusLabel(req.status)}
          </span>
          {req.priority && req.priority !== 'MEDIUM' && (
            <span className={clsx('text-[10px] font-bold uppercase', priority.className)}>
              {priority.label}
            </span>
          )}
        </div>
        <p className="text-xs text-primary/50 dark:text-white/50 truncate">
          {req.department}
          {req.location ? ` · ${req.location}` : ''}
          {req.jobCode ? ` · ${req.jobCode}` : ''}
        </p>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full bg-primary/10 dark:bg-white/10 overflow-hidden max-w-[140px]">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-primary/50 dark:text-white/50">{label} filled</span>
        </div>
      </div>
      <ChevronRight
        size={18}
        className="text-primary/30 group-hover:text-primary dark:group-hover:text-white shrink-0 transition-colors"
      />
    </Link>
  )
}

function InterviewAgendaItem({
  interview,
  jobTitle,
}: {
  interview: Interview
  jobTitle?: string
}) {
  const when = new Date(interview.scheduledAt)
  const dayLabel = formatInterviewDay(when)
  const timeLabel = formatInterviewTime(when)

  return (
    <div className="flex gap-4 px-6 py-4 border-b border-primary/5 dark:border-white/10 last:border-0">
      <div className="flex flex-col items-center justify-center rounded-xl min-w-[56px] h-14 bg-primary/5 dark:bg-white/10 border border-primary/10 dark:border-white/10">
        <span className="text-xs font-black text-primary dark:text-white tabular-nums">{timeLabel}</span>
        <span className="text-[9px] font-bold text-primary/50 dark:text-white/50 uppercase mt-0.5 truncate max-w-[52px]">
          {dayLabel}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-primary dark:text-white truncate">
          {interview.candidateName ?? 'Candidate'}
        </p>
        <p className="text-xs text-primary/50 dark:text-white/50 truncate mt-0.5">
          {stageLabel(interview)}
          {jobTitle ? ` · ${jobTitle}` : ''}
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          {interview.meetingLink && (
            <a
              href={interview.meetingLink}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-bold bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              Join meeting
            </a>
          )}
          <Link
            to={`/candidates/${interview.candidateId}`}
            className="text-[11px] font-bold text-primary/70 dark:text-white/70 bg-primary/5 dark:bg-white/10 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors"
          >
            Profile
          </Link>
        </div>
      </div>
    </div>
  )
}

function AdminDashboard({
  requirements,
  candidates,
  activityLogs,
  users,
  user,
}: {
  requirements: Requirement[]
  candidates: Candidate[]
  activityLogs: ActivityLog[]
  users: User[]
  user: User | null
}) {
  const metrics = useMemo(
    () => adminMetrics(requirements, candidates, users, activityLogs),
    [requirements, candidates, users, activityLogs]
  )

  const pending = useMemo(
    () =>
      [...requirements]
        .filter((r) => r.status === 'PENDING_APPROVAL')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [requirements]
  )

  const liveJobs = useMemo(
    () =>
      [...requirements]
        .filter((r) => r.status === 'LIVE')
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5),
    [requirements]
  )

  const team = useMemo(
    () =>
      users
        .filter((u) => u.role !== 'CANDIDATE' && u.role !== 'VENDOR')
        .slice(0, 6),
    [users]
  )

  const firstName = user?.name?.split(' ')[0] ?? 'there'

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <PageHero
        icon={LayoutDashboard}
        eyebrow="Administration"
        title={`Good to see you, ${firstName}`}
        description="Organization-wide hiring health, approvals, and team activity at a glance."
        actions={
          <>
            <Link to="/admin/users" className={heroBtnSecondary}>
              <UserPlus size={16} className="mr-2" />
              Manage team
            </Link>
            <Link to="/notifications" className={heroBtnPrimary}>
              View activity
              <ArrowRight size={16} className="ml-2" />
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <InterviewStatCard label="Live jobs" value={metrics.live} icon={Briefcase} accent="green" />
        <InterviewStatCard label="Pending approval" value={metrics.pending} icon={Zap} accent="amber" />
        <InterviewStatCard label="On hold" value={metrics.onHold} icon={CalendarClock} accent="slate" />
        <InterviewStatCard label="Candidates" value={metrics.candidates} icon={Users} accent="blue" />
        <InterviewStatCard label="Hired" value={metrics.hires} icon={Activity} accent="green" />
        <InterviewStatCard label="Team" value={metrics.team} icon={Users} accent="slate" />
      </div>

      <div className="flex flex-wrap gap-2">
        <QuickLink to="/requirements" icon={Briefcase} label="Requirements" />
        <QuickLink to="/candidates" icon={Users} label="Candidates" />
        <QuickLink to="/admin" icon={UserPlus} label="Administration" />
        <QuickLink to="/notifications" icon={Activity} label="Notifications" />
      </div>

      {pending.length > 0 && (
        <div className="rounded-2xl border border-amber-200/80 dark:border-amber-500/30 bg-amber-50/80 dark:bg-amber-500/10 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300">
                <MessageSquareWarning size={20} />
              </div>
              <div>
                <h2 className="font-bold text-amber-900 dark:text-amber-100">
                  {pending.length} requirement{pending.length === 1 ? '' : 's'} awaiting approval
                </h2>
                <p className="text-sm text-amber-800/80 dark:text-amber-200/70">
                  {canApproveRequirement(user?.role)
                    ? requiresHrHeadDelegationForApproval(user?.role)
                      ? 'Approve on behalf of HR Head to publish roles.'
                      : 'Review and approve to publish roles.'
                    : 'These roles are waiting for HR Head approval.'}
                </p>
              </div>
            </div>
            <Link
              to="/requirements"
              className="text-sm font-bold text-amber-800 dark:text-amber-200 hover:underline inline-flex items-center gap-1"
            >
              Review queue <ArrowRight size={14} />
            </Link>
          </div>
          <ul className="rounded-xl border border-amber-200/60 dark:border-amber-500/20 bg-white/60 dark:bg-black/20 divide-y divide-amber-100 dark:divide-amber-500/20 overflow-hidden">
            {pending.slice(0, 3).map((req) => (
              <li key={req.id}>
                <RequirementCompactRow req={req} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <SectionCard
            title="Candidate pipeline"
            action={
              <Link to="/pipeline" className="text-xs font-bold text-primary dark:text-blue-400 hover:underline">
                Open pipeline
              </Link>
            }
          >
            <PipelineOverview candidates={candidates} />
          </SectionCard>

          <SectionCard
            title="Live roles"
            action={
              <Link to="/requirements" className="text-xs font-bold text-primary dark:text-blue-400 hover:underline">
                All jobs
              </Link>
            }
          >
            {liveJobs.length === 0 ? (
              <EmptyState icon="work" title="No live roles" description="Approve requirements to go live." />
            ) : (
              <ul className="divide-y section-divider">
                {liveJobs.map((req) => (
                  <li key={req.id}>
                    <RequirementCompactRow req={req} />
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        <div className="space-y-8">
          <SectionCard title="Team snapshot">
            {team.length === 0 ? (
              <EmptyState icon="groups" title="No team members" description="Invite users from Administration." />
            ) : (
              <ul className="p-4 space-y-2">
                {team.map((member) => (
                  <li key={member.uid}>
                    <Link
                      to={`/admin/users/${member.uid}`}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-primary/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <UserAvatar
                        name={member.name}
                        avatar={member.avatar}
                        size="sm"
                        className="rounded-xl"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-primary dark:text-white truncate">{member.name}</p>
                        <p className="text-xs text-primary/50 dark:text-white/50">
                          {member.role.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-primary/30 shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="px-4 pb-4">
              <Link
                to="/admin/users"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-primary dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <UserPlus size={16} />
                Invite team member
              </Link>
            </div>
          </SectionCard>
        </div>
      </div>

      <SectionCard
        title="Recent activity"
        action={
          <Link to="/notifications" className="text-xs font-bold text-primary dark:text-blue-400 hover:underline">
            View all
          </Link>
        }
      >
        <ActivityFeed logs={activityLogs} />
      </SectionCard>
    </div>
  )
}

function RecruiterDashboard({
  requirements,
  candidates,
  interviews,
  offers,
  user,
}: {
  requirements: Requirement[]
  candidates: Candidate[]
  interviews: Interview[]
  offers: Offer[]
  user: User | null
}) {
  const metrics = useMemo(
    () => recruiterMetrics(requirements, candidates, interviews, offers),
    [requirements, candidates, interviews, offers]
  )

  const jobTitleById = useMemo(
    () => new Map(requirements.map((r) => [r.id, r.title])),
    [requirements]
  )

  const priorityJobs = useMemo(
    () =>
      [...requirements]
        .filter((r) => ['LIVE', 'PENDING_APPROVAL', 'ON_HOLD'].includes(r.status))
        .sort((a, b) => {
          const order: Record<string, number> = { PENDING_APPROVAL: 0, LIVE: 1, ON_HOLD: 2 }
          return (order[a.status] ?? 9) - (order[b.status] ?? 9)
        })
        .slice(0, 6),
    [requirements]
  )

  const upcomingInterviews = useMemo(
    () =>
      [...interviews]
        .filter(isUpcoming)
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
        .slice(0, 5),
    [interviews]
  )

  const recentCandidates = useMemo(
    () =>
      [...candidates]
        .sort((a, b) => {
          const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
          const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
          return tb - ta
        })
        .slice(0, 5),
    [candidates]
  )

  const firstName = user?.name?.split(' ')[0] ?? 'there'

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <PageHero
        icon={LayoutDashboard}
        eyebrow="Your workspace"
        title={`Welcome back, ${firstName}`}
        description="Track open roles, upcoming interviews, and pipeline momentum for today."
        actions={
          <>
            <Link to="/candidates/new" className={heroBtnSecondary}>
              <Plus size={16} className="mr-2" />
              Add candidate
            </Link>
            <Link to="/interviews/new" className={heroBtnPrimary}>
              <Video size={16} className="mr-2" />
              Schedule interview
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <InterviewStatCard label="Live roles" value={metrics.live} icon={Briefcase} accent="green" />
        <InterviewStatCard label="Candidates" value={metrics.candidates} icon={Users} accent="blue" />
        <InterviewStatCard label="Upcoming" value={metrics.upcoming} icon={CalendarClock} accent="blue" />
        <InterviewStatCard label="Needs feedback" value={metrics.feedback} icon={MessageSquareWarning} accent="amber" />
        <InterviewStatCard label="Offers" value={metrics.offers} icon={Zap} accent="slate" />
      </div>

      <div className="flex flex-wrap gap-2">
        <QuickLink to="/requirements" icon={Briefcase} label="Requirements" />
        <QuickLink to="/candidates" icon={Users} label="Candidates" />
        <QuickLink to="/interviews" icon={Video} label="Interviews" />
        <QuickLink to="/offers" icon={Zap} label="Offers" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <SectionCard
            title="Active & priority roles"
            action={
              <Link to="/requirements" className="text-xs font-bold text-primary dark:text-blue-400 hover:underline">
                View all
              </Link>
            }
          >
            {priorityJobs.length === 0 ? (
              <EmptyState icon="work" title="No active roles" description="Create or get assigned to job requirements." />
            ) : (
              <ul className="divide-y section-divider">
                {priorityJobs.map((req) => (
                  <li key={req.id}>
                    <RequirementCompactRow req={req} />
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            title="Pipeline summary"
            action={
              <Link to="/pipeline" className="text-xs font-bold text-primary dark:text-blue-400 hover:underline">
                Pipeline view
              </Link>
            }
          >
            <PipelineOverview candidates={candidates} />
          </SectionCard>
        </div>

        <div className="space-y-8">
          <SectionCard
            title="Upcoming interviews"
            action={
              <Link to="/interviews" className="text-xs font-bold text-primary dark:text-blue-400 hover:underline">
                Calendar
              </Link>
            }
          >
            {upcomingInterviews.length === 0 ? (
              <EmptyState icon="event" title="Nothing scheduled" description="Schedule interviews from a candidate profile." />
            ) : (
              <div>
                {upcomingInterviews.map((iv) => (
                  <InterviewAgendaItem
                    key={iv.id}
                    interview={iv}
                    jobTitle={jobTitleById.get(iv.requirementId)}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Recent candidate updates">
            {recentCandidates.length === 0 ? (
              <EmptyState icon="person" title="No candidates yet" />
            ) : (
              <ul className="p-4 space-y-1">
                {recentCandidates.map((c) => (
                  <li key={c.id}>
                    <Link
                      to={`/candidates/${c.id}`}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-primary/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary dark:text-white text-sm">
                        {c.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-primary dark:text-white truncate">{c.name}</p>
                        <p className="text-xs text-primary/50 dark:text-white/50">
                          Moved to{' '}
                          <span className="font-bold text-primary dark:text-white">{c.status}</span>
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground shrink-0">
                        {c.updatedAt ? relativeTime(c.updatedAt) : '—'}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

function InterviewerDashboard({
  interviews,
  candidates,
  user,
}: {
  interviews: Interview[]
  candidates: Candidate[]
  user: User | null
}) {
  const metrics = useMemo(() => interviewerMetrics(interviews), [interviews])

  const feedbackQueue = useMemo(
    () => sortInterviewsChronologically(interviews.filter(needsFeedback)),
    [interviews]
  )

  const todayInterviews = useMemo(
    () =>
      sortInterviewsChronologically(
        interviews.filter((i) => isUpcoming(i) && isScheduledToday(i))
      ),
    [interviews]
  )

  const upcomingInterviews = useMemo(
    () =>
      sortInterviewsChronologically(
        interviews.filter((i) => isUpcoming(i) && !isScheduledToday(i))
      ).slice(0, 5),
    [interviews]
  )

  const myCandidates = useMemo(() => {
    const nextByCandidate = new Map<string, number>()
    for (const iv of interviews.filter(isUpcoming)) {
      const t = new Date(iv.scheduledAt).getTime()
      const prev = nextByCandidate.get(iv.candidateId)
      if (prev == null || t < prev) nextByCandidate.set(iv.candidateId, t)
    }
    return [...candidates].sort((a, b) => {
      const ta = nextByCandidate.get(a.id) ?? Number.POSITIVE_INFINITY
      const tb = nextByCandidate.get(b.id) ?? Number.POSITIVE_INFINITY
      if (ta !== tb) return ta - tb
      return a.name.localeCompare(b.name)
    })
  }, [candidates, interviews])

  const firstName = user?.name?.split(' ')[0] ?? 'there'

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <PageHero
        icon={Video}
        eyebrow="Interviewer workspace"
        title={`Hello, ${firstName}`}
        description="Your assigned interviews, feedback tasks, and candidate profiles in one place."
        actions={
          <Link to="/interviews" className={heroBtnPrimary}>
            <Video size={16} className="mr-2" />
            My interviews
            <ArrowRight size={16} className="ml-2" />
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <InterviewStatCard
          label="Today"
          value={metrics.today}
          icon={CalendarClock}
          accent="blue"
        />
        <InterviewStatCard
          label="Upcoming"
          value={metrics.upcoming}
          icon={Video}
          accent="slate"
        />
        <InterviewStatCard
          label="Needs feedback"
          value={metrics.feedback}
          icon={MessageSquareWarning}
          accent="amber"
        />
        <InterviewStatCard
          label="Decided"
          value={metrics.decided}
          icon={CheckCircle2}
          accent="green"
        />
        <InterviewStatCard
          label="Candidates"
          value={metrics.candidates}
          icon={Users}
          accent="slate"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <QuickLink to="/interviews" icon={Video} label="My interviews" />
        <QuickLink to="/candidates" icon={Users} label="My candidates" />
        <QuickLink to="/notifications" icon={Activity} label="Notifications" />
      </div>

      {feedbackQueue.length > 0 && (
        <div className="rounded-2xl border border-amber-200/80 dark:border-amber-500/30 bg-amber-50/80 dark:bg-amber-500/10 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300">
                <MessageSquare size={20} />
              </div>
              <div>
                <h2 className="font-bold text-amber-900 dark:text-amber-100">
                  {feedbackQueue.length} interview{feedbackQueue.length === 1 ? '' : 's'} need your
                  feedback
                </h2>
                <p className="text-sm text-amber-800/80 dark:text-amber-200/70">
                  Submit feedback after each session so recruiting can move candidates forward.
                </p>
              </div>
            </div>
            <Link
              to="/interviews"
              className="text-sm font-bold text-amber-800 dark:text-amber-200 hover:underline inline-flex items-center gap-1"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {feedbackQueue.slice(0, 3).map((interview) => (
              <InterviewListItem
                key={interview.id}
                interview={interview}
                jobTitle={interview.candidateRole}
                variant="alert"
                canManage={false}
                userRole={user?.role}
                currentUserId={user?.uid}
              />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <SectionCard
            id="today"
            title="Today's sessions"
            action={
              <Link
                to="/interviews"
                className="text-xs font-bold text-primary dark:text-blue-400 hover:underline"
              >
                Full calendar
              </Link>
            }
          >
            {todayInterviews.length === 0 ? (
              <EmptyState
                icon="event"
                title="Nothing scheduled today"
                description="Upcoming interviews assigned to you will appear here."
              />
            ) : (
              <div className="p-4 space-y-3">
                {todayInterviews.map((interview) => (
                  <InterviewListItem
                    key={interview.id}
                    interview={interview}
                    jobTitle={interview.candidateRole}
                    variant="timeline"
                    canManage={false}
                    userRole={user?.role}
                    currentUserId={user?.uid}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Coming up"
            action={
              <Link
                to="/interviews"
                className="text-xs font-bold text-primary dark:text-blue-400 hover:underline"
              >
                View all
              </Link>
            }
          >
            {upcomingInterviews.length === 0 ? (
              <EmptyState
                icon="calendar_month"
                title="No upcoming sessions"
                description="When you are assigned to future interviews, they will show here."
              />
            ) : (
              <div className="p-4 space-y-3">
                {upcomingInterviews.map((interview) => (
                  <InterviewListItem
                    key={interview.id}
                    interview={interview}
                    jobTitle={interview.candidateRole}
                    variant="timeline"
                    canManage={false}
                    userRole={user?.role}
                    currentUserId={user?.uid}
                  />
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="space-y-8">
          <SectionCard
            title="My candidates"
            action={
              <Link
                to="/candidates"
                className="text-xs font-bold text-primary dark:text-blue-400 hover:underline"
              >
                View all
              </Link>
            }
          >
            {myCandidates.length === 0 ? (
              <EmptyState
                icon="person"
                title="No candidates yet"
                description="Candidates appear here once you are assigned to their interviews."
              />
            ) : (
              <ul className="p-4 space-y-1">
                {myCandidates.slice(0, 8).map((c) => {
                  const nextIv = interviews
                    .filter((i) => i.candidateId === c.id && isUpcoming(i))
                    .sort(
                      (a, b) =>
                        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
                    )[0]
                  return (
                    <li key={c.id}>
                      <Link
                        to={`/candidates/${c.id}`}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-primary/5 dark:hover:bg-white/5 transition-colors"
                      >
                        <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary dark:text-white text-sm">
                          {c.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary dark:text-white truncate">
                            {c.name}
                          </p>
                          <p className="text-xs text-primary/50 dark:text-white/50 truncate">
                            {c.jobTitle || c.role || '—'}
                            {nextIv
                              ? ` · ${formatInterviewDay(new Date(nextIv.scheduledAt))} ${formatInterviewTime(new Date(nextIv.scheduledAt))}`
                              : ''}
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-primary/30 shrink-0" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse pb-12">
      <div className="h-44 rounded-3xl bg-primary/10 dark:bg-white/10" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-primary/5 dark:bg-white/5" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-primary/5 dark:bg-white/5" />
    </div>
  )
}

const Dashboard = () => {
  const { user } = useAuth()
  const role = user?.role || 'RECRUITER'
  const isInterviewer = role === 'INTERVIEWER'
  const isAdminOrHR = ['ADMIN', 'HR_MANAGER', 'HR_HEAD', 'TEAM_LEAD'].includes(role)

  const { data: requirements = [], isLoading: loadingReqs } = useQuery({
    queryKey: ['requirements'],
    queryFn: api.requirements.list,
    enabled: !isInterviewer,
  })
  const { data: candidates = [], isLoading: loadingCands } = useQuery({
    queryKey: ['candidates'],
    queryFn: api.candidates.list,
  })
  const { data: interviews = [], isLoading: loadingInts } = useQuery({
    queryKey: ['interviews'],
    queryFn: api.interviews.list,
    enabled: isInterviewer || !isAdminOrHR,
  })
  const { data: offers = [], isLoading: loadingOffers } = useQuery({
    queryKey: ['offers'],
    queryFn: api.offers.list,
    enabled: !isAdminOrHR && !isInterviewer,
  })
  const { data: activityLogs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ['activityLogs', 'dashboard'],
    queryFn: () => api.activityLogs.list(20),
    enabled: isAdminOrHR,
  })
  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['users', 'dashboard'],
    queryFn: api.users.list,
    enabled: isAdminOrHR,
  })

  const scopedInterviews = useMemo(
    () => scopeInterviewsForUser(interviews, role, user?.uid),
    [interviews, role, user?.uid]
  )

  const isLoading = isInterviewer
    ? loadingCands || loadingInts
    : isAdminOrHR
      ? loadingReqs || loadingCands || loadingLogs || loadingUsers
      : loadingReqs || loadingCands || loadingInts || loadingOffers

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <DashboardSkeleton />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {isInterviewer ? (
        <InterviewerDashboard
          interviews={scopedInterviews}
          candidates={candidates}
          user={user}
        />
      ) : isAdminOrHR ? (
        <AdminDashboard
          requirements={requirements}
          candidates={candidates}
          activityLogs={activityLogs}
          users={users}
          user={user}
        />
      ) : (
        <RecruiterDashboard
          requirements={requirements}
          candidates={candidates}
          interviews={scopedInterviews}
          offers={offers}
          user={user}
        />
      )}
    </div>
  )
}

export default Dashboard
