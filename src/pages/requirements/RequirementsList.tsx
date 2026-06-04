import React, { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import {
  Briefcase,
  Plus,
  Zap,
  PauseCircle,
  FileEdit,
  Clock,
  Users,
} from 'lucide-react'
import { api } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import { Requirement } from '../../types'
import { useToastStore } from '../../store/toastStore'
import { useConfirm } from '../../hooks/useConfirm'
import { ListSearchBar } from '../../components/ui/ListSearchBar'
import { PageHeader } from '../../components/layout/PageHeader'
import { heroBtnPrimary } from '../../components/layout/PageHero'
import { EmptyState } from '../../components/ui/EmptyState'
import { matchesAnySearch } from '../../lib/textSearch'
import { InterviewStatCard } from '../../components/interviews/InterviewStatCard'
import { RequirementListItem } from '../../components/requirements/RequirementListItem'
import { AnimatedTabNav } from '../../components/motion/AnimatedTabNav'
import {
  REQUIREMENT_FILTERS,
  filterRequirements,
  groupRequirementsByStatus,
  requirementStats,
  sortRequirements,
  type RequirementFilter,
} from '../../lib/requirementPage'
import {
  canControlPortalVisibility,
  canCreateRequirement,
  canManageRequirementPosting,
} from '../../lib/requirementPermissions'

const RequirementsList = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { addToast } = useToastStore()
  const confirm = useConfirm()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<RequirementFilter>('ALL')
  const isAdmin = user?.role === 'ADMIN'
  const canManagePosting = (req: Requirement) =>
    canManageRequirementPosting(user?.role, req, user)
  const canVisibility = canControlPortalVisibility(user?.role)
  const canCreate = canCreateRequirement(user?.role)

  const { data: requirements = [], isLoading } = useQuery({
    queryKey: ['requirements'],
    queryFn: api.requirements.list,
  })

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: api.users.list,
  })

  const { data: candidates = [] } = useQuery({
    queryKey: ['candidates'],
    queryFn: api.candidates.list,
  })

  const recruiterNameById = useMemo(
    () => new Map(users.map((u) => [u.uid, u.name])),
    [users]
  )

  const searched = useMemo(
    () =>
      requirements.filter((req) =>
        matchesAnySearch(
          [
            req.title,
            req.department,
            req.jobCode,
            req.client,
            req.status,
            req.location,
            ...(req.recruiters?.map((id) => recruiterNameById.get(id)) ?? []),
          ],
          searchTerm
        )
      ),
    [requirements, searchTerm, recruiterNameById]
  )

  const stats = useMemo(() => requirementStats(searched), [searched])
  const filtered = useMemo(
    () => sortRequirements(filterRequirements(searched, statusFilter)),
    [searched, statusFilter]
  )

  const pendingQueue = useMemo(
    () => searched.filter((r) => r.status === 'PENDING_APPROVAL'),
    [searched]
  )

  const showPendingSpotlight =
    statusFilter === 'ALL' && !searchTerm.trim() && pendingQueue.length > 0

  const groupedWhenAll = useMemo(() => {
    if (statusFilter !== 'ALL' || searchTerm.trim()) return null
    const groups = groupRequirementsByStatus(filtered)
    if (showPendingSpotlight) {
      return groups.filter((g) => g.key !== 'PENDING_APPROVAL')
    }
    return groups
  }, [statusFilter, searchTerm, filtered, showPendingSpotlight])

  const invalidateRequirements = () => {
    queryClient.invalidateQueries({ queryKey: ['requirements'] })
    queryClient.invalidateQueries({ queryKey: ['pendingRequirements'] })
  }

  const handleDeleteRequirement = async (req: Requirement) => {
    const ok = await confirm({
      title: 'Delete requirement',
      message: `Delete "${req.title}"? Linked candidates will be unassigned.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    })
    if (!ok) return
    try {
      await api.requirements.delete(req.id)
      addToast('Requirement deleted', 'success')
      invalidateRequirements()
    } catch {
      addToast('Failed to delete requirement', 'error')
    }
  }

  const requirementMenuItems = (req: Requirement) => {
    const portalVisible = req.visibleToCandidates ?? true
    const referralVisible = req.visibleToReferrals ?? true
    return [
      {
        id: 'view',
        label: 'View details',
        onClick: () => navigate(`/requirements/${req.id}`),
      },
      {
        id: 'pipeline',
        label: 'Open pipeline',
        onClick: () => navigate(`/pipeline/${req.id}`),
      },
      {
        id: 'hold',
        label: 'Put on hold',
        hidden: !canManagePosting(req) || req.status !== 'LIVE',
        onClick: async () => {
          const ok = await confirm({
            title: 'Put on hold',
            message:
              'Put this requirement on hold? It will be hidden from the candidate portal until resumed.',
            confirmLabel: 'Put on hold',
          })
          if (!ok) return
          try {
            await api.requirements.updateStatus(req.id, 'ON_HOLD')
            addToast('Requirement placed on hold', 'success')
            invalidateRequirements()
          } catch {
            addToast('Failed to update status', 'error')
          }
        },
      },
      {
        id: 'resume',
        label: 'Resume (go live)',
        hidden: !canManagePosting(req) || req.status !== 'ON_HOLD',
        onClick: async () => {
          try {
            await api.requirements.updateStatus(req.id, 'LIVE')
            addToast('Requirement is live again', 'success')
            invalidateRequirements()
          } catch {
            addToast('Failed to update status', 'error')
          }
        },
      },
      {
        id: 'visibility',
        label: portalVisible ? 'Hide from candidate portal' : 'Post to candidate portal',
        hidden: !canVisibility || req.status === 'ON_HOLD' || req.status === 'CLOSED' || req.status === 'CANCELLED',
        onClick: async () => {
          try {
            await api.requirements.setVisibility(req.id, !portalVisible)
            addToast(
              portalVisible ? 'Hidden from candidate portal' : 'Posted to candidate portal',
              'success'
            )
            invalidateRequirements()
          } catch {
            addToast('Failed to update visibility', 'error')
          }
        },
      },
      {
        id: 'referral-visibility',
        label: referralVisible ? 'Remove from employee portal' : 'Post to employee portal',
        hidden: !canVisibility || req.status === 'ON_HOLD' || req.status === 'CLOSED' || req.status === 'CANCELLED',
        onClick: async () => {
          try {
            await api.requirements.setReferralVisibility(req.id, !referralVisible)
            addToast(
              referralVisible ? 'Removed from employee portal' : 'Posted to employee portal',
              'success'
            )
            invalidateRequirements()
          } catch {
            addToast('Failed to update employee portal', 'error')
          }
        },
      },
      {
        id: 'delete',
        label: 'Delete requirement',
        variant: 'danger' as const,
        hidden: !isAdmin,
        onClick: () => handleDeleteRequirement(req),
      },
    ]
  }

  const recruiterNames = (req: Requirement) =>
    (req.recruiters ?? [])
      .map((id) => recruiterNameById.get(id))
      .filter((n): n is string => Boolean(n))

  const setFilter = (id: RequirementFilter) => setStatusFilter(id)

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <PageHeader
        highlighted
        icon={Briefcase}
        eyebrow="Hiring hub"
        title="Job requirements"
        description="Open roles, approval workflow, and fill progress. Post jobs, assign recruiters, and open the pipeline from one place."
        actions={
          canCreate ? (
            <Link to="/requirements/new" className={heroBtnPrimary}>
              <Plus size={18} />
              Post new job
            </Link>
          ) : undefined
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        <InterviewStatCard
          label="All jobs"
          value={stats.total}
          icon={Briefcase}
          accent="slate"
          active={statusFilter === 'ALL'}
          onClick={() => setFilter('ALL')}
        />
        <InterviewStatCard
          label="Active"
          value={stats.live}
          icon={Zap}
          accent="green"
          active={statusFilter === 'LIVE'}
          onClick={() => setFilter(statusFilter === 'LIVE' ? 'ALL' : 'LIVE')}
        />
        <InterviewStatCard
          label="Pending"
          value={stats.pending}
          icon={Clock}
          accent="amber"
          active={statusFilter === 'PENDING_APPROVAL'}
          onClick={() =>
            setFilter(statusFilter === 'PENDING_APPROVAL' ? 'ALL' : 'PENDING_APPROVAL')
          }
        />
        <InterviewStatCard
          label="On hold"
          value={stats.onHold}
          icon={PauseCircle}
          accent="slate"
          active={statusFilter === 'ON_HOLD'}
          onClick={() => setFilter(statusFilter === 'ON_HOLD' ? 'ALL' : 'ON_HOLD')}
        />
        <InterviewStatCard
          label="Drafts"
          value={stats.draft}
          icon={FileEdit}
          accent="blue"
          active={statusFilter === 'DRAFT'}
          onClick={() => setFilter(statusFilter === 'DRAFT' ? 'ALL' : 'DRAFT')}
        />
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="app-card flex items-center gap-4 p-4">
          <div className="p-2.5 rounded-xl bg-primary/10 dark:bg-white/10 text-primary dark:text-white">
            <Users size={20} />
          </div>
          <div>
            <p className="text-2xl font-black tabular-nums text-primary dark:text-white">
              {candidates.length}
            </p>
            <p className="text-xs font-bold uppercase tracking-wider text-primary/50 dark:text-white/50">
              Candidates in pipeline
            </p>
          </div>
        </div>
        <div className="stat-spotlight border-emerald-200/60 dark:border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10">
          <div className="p-2.5 rounded-xl bg-card shadow-sm text-emerald-700 dark:text-emerald-300">
            <Zap size={20} />
          </div>
          <div>
            <p className="text-2xl font-black tabular-nums text-primary dark:text-white">
              {stats.live}
            </p>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-800/70 dark:text-emerald-300/80">
              Live on job board
            </p>
          </div>
        </div>
      </div>

      {/* Search + filter pills */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
        <div className="panel-toolbar flex-1">
          <ListSearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search title, department, job code, client, or recruiter..."
            className="max-w-none"
          />
        </div>
        <AnimatedTabNav
          layoutId="requirements-list-filters"
          variant="pill"
          uppercase
          aria-label="Filter requirements"
          tabs={REQUIREMENT_FILTERS.map((tab) => ({ id: tab.id, label: tab.label }))}
          activeId={statusFilter}
          onChange={(id) => setStatusFilter(id as RequirementFilter)}
        />
      </div>

      {isLoading ? (
        <div className="py-24 text-center text-muted-foreground font-medium">
          Loading requirements...
        </div>
      ) : searched.length === 0 ? (
        <div className="app-card border-dashed border-primary/15 dark:border-border/60">
          <EmptyState
            icon="work_off"
            title={searchTerm.trim() ? 'No matches' : 'No job requirements yet'}
            description={
              searchTerm.trim()
                ? 'Try a different search or clear filters.'
                : canCreate
                  ? 'Post your first role to start hiring.'
                  : 'Requirements assigned to you will appear here.'
            }
          />
          {canCreate && !searchTerm.trim() && (
            <div className="pb-10 flex justify-center">
              <Link
                to="/requirements/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold"
              >
                <Plus size={16} /> Post new job
              </Link>
            </div>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div className="app-card border-dashed border-primary/10 dark:border-border/70">
          <EmptyState
            icon="filter_list"
            title="Nothing in this view"
            description="Try another filter or search term."
          />
        </div>
      ) : (
        <div className="space-y-10">
          {/* Pending approval spotlight */}
          {showPendingSpotlight && (
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-primary dark:text-white">
                      Awaiting approval
                    </h2>
                    <p className="text-xs font-medium text-primary/50 dark:text-white/50">
                      {pendingQueue.length} job{pendingQueue.length === 1 ? '' : 's'} need HR review
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStatusFilter('PENDING_APPROVAL')}
                  className="text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline shrink-0"
                >
                  View all
                </button>
              </div>
              <div className="space-y-3">
                {pendingQueue.slice(0, 3).map((req) => (
                  <RequirementListItem
                    key={req.id}
                    requirement={req}
                    recruiterNames={recruiterNames(req)}
                    menuItems={requirementMenuItems(req)}
                    variant="highlight"
                  />
                ))}
              </div>
            </section>
          )}

          {/* Main list — grouped when viewing all */}
          {groupedWhenAll ? (
            groupedWhenAll.map((group) => (
              <section key={group.key} className="space-y-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-primary dark:text-white">{group.title}</h2>
                  <span className="text-xs font-bold text-muted-foreground tabular-nums">
                    {group.items.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {group.items.map((req) => (
                    <RequirementListItem
                      key={req.id}
                      requirement={req}
                      recruiterNames={recruiterNames(req)}
                      menuItems={requirementMenuItems(req)}
                      variant="default"
                    />
                  ))}
                </div>
              </section>
            ))
          ) : (
            <section className="space-y-3">
              {filtered.map((req) => (
                <RequirementListItem
                  key={req.id}
                  requirement={req}
                  recruiterNames={recruiterNames(req)}
                  menuItems={requirementMenuItems(req)}
                  variant={req.status === 'PENDING_APPROVAL' ? 'highlight' : 'default'}
                />
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  )
}

export default RequirementsList
