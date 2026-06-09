import React, { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import {
  Users,
  Plus,
  Sparkles,
  GitBranch,
  UserPlus,
  Briefcase,
  CheckCircle2,
} from 'lucide-react'
import { api } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import { Candidate } from '@/types'
import clsx from 'clsx'
import { useToastStore } from '@/store/toastStore'
import { useConfirm } from '@/hooks/useConfirm'
import { ApiError } from '@/lib/apiClient'
import { ListSearchBar } from '@/components/ui/ListSearchBar'
import { PageHeader } from '@/components/layout/PageHeader'
import { heroBtnPrimary, heroBtnSecondary } from '@/components/layout/PageHero'
import { EmptyState } from '@/components/ui/EmptyState'
import { matchesAnySearch } from '@/lib/textSearch'
import { InterviewStatCard } from '@/components/interviews/InterviewStatCard'
import { CandidateListItem } from '@/components/candidates/CandidateListItem'
import { AnimatedTabNav } from '@/components/motion/AnimatedTabNav'
import {
  CANDIDATE_FILTERS,
  candidateSearchFields,
  candidateStats,
  filterCandidates,
  groupCandidatesByStatus,
  isActiveCandidate,
  isHighMatch,
  sortCandidates,
  type CandidateFilter,
} from '@/pages/candidates/_shared/candidate.utils'
import { canCreateCandidate, isAdminRole, isInterviewerCandidateView } from '@/permissions'
import './list.css'

const CandidatesList = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { addToast } = useToastStore()
  const confirm = useConfirm()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<CandidateFilter>('ALL')
  const isAdmin = isAdminRole(user?.role)
  const canCreate = canCreateCandidate(user?.role)
  const isInterviewerView = isInterviewerCandidateView(user?.role)

  const {
    data: candidates = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['candidates'],
    queryFn: api.candidates.list,
  })

  const searched = useMemo(
    () => candidates.filter((c) => matchesAnySearch(candidateSearchFields(c), searchTerm)),
    [candidates, searchTerm]
  )

  const stats = useMemo(() => candidateStats(searched), [searched])
  const filtered = useMemo(
    () => sortCandidates(filterCandidates(searched, statusFilter)),
    [searched, statusFilter]
  )

  const highMatchQueue = useMemo(
    () =>
      searched
        .filter((c) => isHighMatch(c) && isActiveCandidate(c))
        .sort((a, b) => b.matchScore - a.matchScore),
    [searched]
  )

  const showHighMatchSpotlight =
    !isInterviewerView &&
    statusFilter === 'ALL' &&
    !searchTerm.trim() &&
    highMatchQueue.length > 0

  const groupedWhenAll = useMemo(() => {
    if (isInterviewerView || statusFilter !== 'ALL' || searchTerm.trim()) return null
    const groups = groupCandidatesByStatus(filtered)
    if (showHighMatchSpotlight) {
      const spotlightIds = new Set(highMatchQueue.slice(0, 3).map((c) => c.id))
      return groups
        .map((g) => ({
          ...g,
          items: g.items.filter((c) => !spotlightIds.has(c.id)),
        }))
        .filter((g) => g.items.length > 0)
    }
    return groups
  }, [isInterviewerView, statusFilter, searchTerm, filtered, showHighMatchSpotlight, highMatchQueue])

  const handleDeleteCandidate = async (candidate: Candidate) => {
    const ok = await confirm({
      title: 'Delete candidate',
      message: `Permanently delete ${candidate.name}? All interviews, offers, and feedback will be removed.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    })
    if (!ok) return
    try {
      await api.candidates.delete(candidate.id)
      addToast('Candidate deleted', 'success')
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Failed to delete candidate'
      addToast(msg, 'error')
    }
  }

  const candidateMenuItems = (candidate: Candidate) => [
    {
      id: 'view',
      label: 'View profile',
      onClick: () => navigate(`/candidates/${candidate.id}`),
    },
    {
      id: 'pipeline',
      label: 'Open pipeline',
      hidden: isInterviewerView,
      onClick: () =>
        navigate(
          candidate.requirementId ? `/pipeline/${candidate.requirementId}` : '/pipeline'
        ),
    },
    {
      id: 'interview',
      label: 'Schedule interview',
      hidden: isInterviewerView,
      onClick: () => navigate('/interviews/new'),
    },
    {
      id: 'delete',
      label: 'Delete profile',
      variant: 'danger' as const,
      hidden: !isAdmin,
      onClick: () => handleDeleteCandidate(candidate),
    },
  ]

  const setFilter = (id: CandidateFilter) => setStatusFilter(id)

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <PageHeader
        highlighted
        icon={Users}
        eyebrow="Talent pool"
        title="Candidates"
        description={
          isInterviewerView
            ? 'Search and open profiles for candidates assigned to your interviews.'
            : 'Search applicants, track pipeline stages, and jump to job pipelines or interview scheduling from one place.'
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {!isInterviewerView && (
              <Link to="/pipeline" className={heroBtnSecondary}>
                <GitBranch size={18} />
                Pipeline view
              </Link>
            )}
            {canCreate && (
              <Link to="/candidates/new" className={heroBtnPrimary}>
                <UserPlus size={18} />
                Add candidate
              </Link>
            )}
          </div>
        }
      />

      {!isInterviewerView && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
            <InterviewStatCard
              label="All candidates"
              value={stats.total}
              icon={Users}
              accent="slate"
              active={statusFilter === 'ALL'}
              onClick={() => setFilter('ALL')}
            />
            <InterviewStatCard
              label="In pipeline"
              value={stats.active}
              icon={Briefcase}
              accent="blue"
              active={statusFilter === 'ACTIVE'}
              onClick={() => setFilter(statusFilter === 'ACTIVE' ? 'ALL' : 'ACTIVE')}
            />
            <InterviewStatCard
              label="Interview"
              value={stats.interview}
              icon={Users}
              accent="amber"
              active={statusFilter === 'INTERVIEW'}
              onClick={() => setFilter(statusFilter === 'INTERVIEW' ? 'ALL' : 'INTERVIEW')}
            />
            <InterviewStatCard
              label="Offer"
              value={stats.offer}
              icon={Sparkles}
              accent="slate"
              active={statusFilter === 'OFFER'}
              onClick={() => setFilter(statusFilter === 'OFFER' ? 'ALL' : 'OFFER')}
            />
            <InterviewStatCard
              label="Hired"
              value={stats.hired}
              icon={CheckCircle2}
              accent="green"
              active={statusFilter === 'HIRED'}
              onClick={() => setFilter(statusFilter === 'HIRED' ? 'ALL' : 'HIRED')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="stat-spotlight border-emerald-200/60 dark:border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10">
              <div className="p-2.5 rounded-xl bg-card shadow-sm text-emerald-700 dark:text-emerald-300">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="text-2xl font-black tabular-nums text-primary dark:text-white">
                  {stats.highMatch}
                </p>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-800/70 dark:text-emerald-300/80">
                  Strong matches (80%+)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 app-card">
              <div className="p-2.5 rounded-xl bg-primary/10 dark:bg-white/10 text-primary dark:text-white">
                <UserPlus size={20} />
              </div>
              <div>
                <p className="text-2xl font-black tabular-nums text-primary dark:text-white">
                  {stats.selfApplied}
                </p>
                <p className="text-xs font-bold uppercase tracking-wider text-primary/50 dark:text-white/50">
                  Portal applications
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      <div className={clsx('list-toolbar', isInterviewerView && 'sm:flex-col')}>
        <ListSearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder={
            isInterviewerView
              ? 'Search name, email, job title...'
              : 'Search name, email, req ID, client, job title, recruiter...'
          }
          className="w-full min-w-0 max-w-none flex-1"
        />
        {!isInterviewerView && (
          <AnimatedTabNav
            layoutId="candidates-list-filters"
            variant="pill"
            uppercase
            className="list-toolbar-filters shrink-0"
            aria-label="Filter candidates"
            tabs={CANDIDATE_FILTERS.map((tab) => ({ id: tab.id, label: tab.label }))}
            activeId={statusFilter}
            onChange={(id) => setStatusFilter(id as typeof statusFilter)}
          />
        )}
      </div>

      {isLoading ? (
        <div className="py-24 text-center text-muted-foreground font-medium">
          Loading candidates...
        </div>
      ) : isError ? (
        <div className="app-card border-red-200/60 dark:border-red-500/35 p-8 text-center space-y-4">
          <p className="text-sm font-bold text-red-700 dark:text-red-300">
            {error instanceof ApiError ? error.message : 'Could not load candidates.'}
          </p>
          <p className="text-xs text-primary/50 dark:text-white/50">
            If you recently updated the app, restart the API server so the database schema can sync.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold"
          >
            Try again
          </button>
        </div>
      ) : searched.length === 0 ? (
        <div className="app-card border-dashed border-border shadow-inner">
          <EmptyState
            icon="person_off"
            title={searchTerm.trim() ? 'No matches' : 'No candidates yet'}
            description={
              searchTerm.trim()
                ? 'Try a different search or clear filters.'
                : canCreate
                  ? 'Add your first candidate or link applicants from a job requirement.'
                  : 'Candidates assigned to your jobs will appear here.'
            }
          />
          {canCreate && !searchTerm.trim() && (
            <div className="pb-10 flex justify-center gap-3">
              <Link
                to="/candidates/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold"
              >
                <Plus size={16} /> Add candidate
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
          {showHighMatchSpotlight && (
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-primary dark:text-white">
                      Strong matches
                    </h2>
                    <p className="text-xs font-medium text-primary/50 dark:text-white/50">
                      {highMatchQueue.length} candidate
                      {highMatchQueue.length === 1 ? '' : 's'} at 80%+ job fit
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {highMatchQueue.slice(0, 3).map((candidate) => (
                  <CandidateListItem
                    key={candidate.id}
                    candidate={candidate}
                    menuItems={candidateMenuItems(candidate)}
                    variant="highlight"
                    isInterviewerView={isInterviewerView}
                  />
                ))}
              </div>
            </section>
          )}

          {groupedWhenAll && groupedWhenAll.length > 0 ? (
            groupedWhenAll.map((group) => (
              <section key={group.key} className="space-y-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-primary dark:text-white">{group.title}</h2>
                  <span className="text-xs font-bold text-muted-foreground tabular-nums">
                    {group.items.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {group.items.map((candidate) => (
                    <CandidateListItem
                      key={candidate.id}
                      candidate={candidate}
                      menuItems={candidateMenuItems(candidate)}
                      isInterviewerView={isInterviewerView}
                      variant={
                        !isInterviewerView && isHighMatch(candidate) ? 'highlight' : 'default'
                      }
                    />
                  ))}
                </div>
              </section>
            ))
          ) : (
            <section className="space-y-3">
              {filtered.map((candidate) => (
                <CandidateListItem
                  key={candidate.id}
                  candidate={candidate}
                  menuItems={candidateMenuItems(candidate)}
                  isInterviewerView={isInterviewerView}
                  variant={
                    !isInterviewerView &&
                    isHighMatch(candidate) &&
                    isActiveCandidate(candidate)
                      ? 'highlight'
                      : 'default'
                  }
                />
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  )
}

export default CandidatesList
