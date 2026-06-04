import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  Settings2,
  Shield,
  Sparkles,
  UserPlus,
  Users,
  UsersRound,
} from 'lucide-react'
import clsx from 'clsx'
import { api } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import { InterviewStatCard } from '../../components/interviews/InterviewStatCard'
import { PageHero, heroBtnPrimary } from '../../components/layout/PageHero'
import { UserAvatar } from '../../components/ui/UserAvatar'
import { EmptyState } from '../../components/ui/EmptyState'
import {
  adminSetupMetrics,
  adminSetupTasks,
  recentStaffUsers,
  staffRoleCounts,
} from '../../lib/adminOverviewPage'

function AdminOverviewSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse pb-10">
      <div className="h-28 rounded-2xl bg-surface-container-high" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[88px] rounded-xl bg-surface-container-high" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-48 rounded-xl bg-surface-container-high" />
        <div className="h-48 rounded-xl bg-surface-container-high" />
      </div>
    </div>
  )
}

function CatalogPill({ to, label, count }: { to: string; label: string; count: number }) {
  return (
    <Link
      to={to}
      className="flex flex-col gap-0.5 p-3 rounded-xl border border-outline-variant/50 bg-surface-container-low hover:bg-surface-container hover:shadow-m3-1 transition-all"
    >
      <span className="text-lg font-bold tabular-nums text-primary">{count}</span>
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
    </Link>
  )
}

const AdminOverview = () => {
  const { user } = useAuth()
  const firstName = user?.name?.split(' ')[0] ?? 'there'

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['users', 'admin-overview'],
    queryFn: api.users.list,
  })
  const { data: departments = [], isLoading: loadingDepts } = useQuery({
    queryKey: ['department-catalog'],
    queryFn: api.departments.list,
  })
  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['client-catalog'],
    queryFn: api.clients.list,
  })
  const { data: skills = [], isLoading: loadingSkills } = useQuery({
    queryKey: ['skills'],
    queryFn: api.skills.list,
  })
  const { data: panelLevels = [], isLoading: loadingPanels } = useQuery({
    queryKey: ['interview-panels'],
    queryFn: api.interviewPanels.list,
  })

  const metrics = useMemo(
    () => adminSetupMetrics(users, departments, clients, skills, panelLevels),
    [users, departments, clients, skills, panelLevels]
  )
  const tasks = useMemo(() => adminSetupTasks(metrics), [metrics])
  const roles = useMemo(() => staffRoleCounts(users), [users])
  const recentTeam = useMemo(() => recentStaffUsers(users), [users])

  const isLoading =
    loadingUsers || loadingDepts || loadingClients || loadingSkills || loadingPanels

  if (isLoading) {
    return <AdminOverviewSkeleton />
  }

  const allClear = tasks.length === 0

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      <PageHero
        icon={Settings2}
        eyebrow="Workspace configuration"
        title={`Hello, ${firstName}`}
        description="Monitor catalogs, team access, and interview defaults. Use the tabs above for each settings area."
        actions={
          <Link to="/admin/users" className={heroBtnPrimary}>
            <UserPlus size={16} className="mr-2" />
            Invite team member
          </Link>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/admin/users" className="block h-full">
          <InterviewStatCard label="Staff accounts" value={metrics.staffTotal} icon={Users} accent="brand" />
        </Link>
        <Link to="/admin/users" className="block h-full">
          <InterviewStatCard
            label="Active"
            value={metrics.activeStaff}
            icon={CheckCircle2}
            accent="green"
          />
        </Link>
        <Link to="/admin/departments" className="block h-full">
          <InterviewStatCard
            label="Catalog items"
            value={metrics.departments + metrics.clients + metrics.skills}
            icon={Building2}
            accent="amber"
          />
        </Link>
        <Link to="/admin/interview-panels" className="block h-full">
          <InterviewStatCard
            label="Panel interviewers"
            value={metrics.panelInterviewers}
            icon={UsersRound}
            accent="slate"
          />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <section className="app-card flex flex-col min-h-0">
          <div className="px-5 py-4 border-b border-outline-variant/50 flex items-center justify-between gap-4 shrink-0">
            <h2 className="text-base font-bold text-foreground">Configuration health</h2>
            <Link
              to="/admin/role-access"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              <Shield size={14} />
              Role access
            </Link>
          </div>
          <div className="p-5 flex flex-col flex-1 gap-4">
            {allClear ? (
              <>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-tertiary-container/40 border border-tertiary/25">
                  <CheckCircle2 className="text-tertiary shrink-0 mt-0.5" size={22} />
                  <div>
                    <p className="font-bold text-on-tertiary-container">Setup looks good</p>
                    <p className="text-sm text-on-tertiary-container/80 mt-1">
                      Catalogs are populated and interview panels have defaults.
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Catalog snapshot
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <CatalogPill to="/admin/departments" label="Departments" count={metrics.departments} />
                    <CatalogPill to="/admin/clients" label="Clients" count={metrics.clients} />
                    <CatalogPill to="/admin/skills" label="Skills" count={metrics.skills} />
                  </div>
                </div>
              </>
            ) : (
              <ul className="space-y-2 flex-1">
                {tasks.map((task) => (
                  <li key={task.id}>
                    <Link
                      to={task.to}
                      className={clsx(
                        'flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-m3-1',
                        task.tone === 'warning'
                          ? 'border-tertiary/30 bg-tertiary-container/30'
                          : 'border-outline-variant/50 bg-surface-container-low'
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm">{task.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                      </div>
                      <ArrowRight size={16} className="text-muted-foreground shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="app-card flex flex-col min-h-0">
          <div className="px-5 py-4 border-b border-outline-variant/50 shrink-0">
            <h2 className="text-base font-bold text-foreground">Roles on the team</h2>
          </div>
          {roles.length === 0 ? (
            <div className="p-4 flex-1 flex items-center justify-center">
              <EmptyState
                icon="groups"
                title="No staff yet"
                description="Invite users to assign hiring roles."
              />
            </div>
          ) : (
            <ul className="p-5 space-y-3 flex-1">
              {roles.map(({ role, count, label }) => {
                const max = Math.max(...roles.map((r) => r.count), 1)
                return (
                  <li key={role} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-foreground capitalize">{label}</span>
                      <span className="font-bold tabular-nums text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-container-high overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-tertiary transition-all duration-500"
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      <section className="app-card overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant/50 flex items-center justify-between gap-4">
          <h2 className="text-base font-bold text-foreground">Recently added team</h2>
          <Link to="/admin/users" className="text-xs font-semibold text-primary hover:underline">
            All users
          </Link>
        </div>
        {recentTeam.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon="person_add"
              title="No team members"
              description="Invite recruiters, HR, and interviewers from User management."
            />
          </div>
        ) : (
          <ul className="divide-y divide-outline-variant/40">
            {recentTeam.map((member) => (
              <li key={member.uid}>
                <Link
                  to={`/admin/users/${member.uid}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface-container-low transition-colors"
                >
                  <UserAvatar name={member.name} avatar={member.avatar} size="sm" className="rounded-xl" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{member.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {member.email} · {member.role.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-muted-foreground shrink-0">
                    {new Date(member.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <ChevronRight size={16} className="text-muted-foreground/50 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap gap-2 pt-1">
        <Link
          to="/dashboard"
          className="app-card-interactive inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-foreground"
        >
          Hiring dashboard
          <ChevronRight size={14} className="opacity-40" />
        </Link>
        <Link
          to="/requirements"
          className="app-card-interactive inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-foreground"
        >
          Requirements
          <ChevronRight size={14} className="opacity-40" />
        </Link>
        <Link
          to="/admin/skills"
          className="app-card-interactive inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-foreground"
        >
          <Sparkles size={16} className="text-tertiary" />
          Skill catalog
          <ChevronRight size={14} className="opacity-40" />
        </Link>
      </div>
    </div>
  )
}

export default AdminOverview
