import React, { useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  GitBranch,
  UserPlus,
  Users,
  Briefcase,
  Sparkles,
  CheckCircle2,
  Ban,
  ListFilter,
  Building2,
  ExternalLink,
} from 'lucide-react'
import { api } from '../../services/api'
import { ApiError } from '../../lib/apiClient'
import { useAuth } from '../../hooks/useAuth'
import { useCandidateStageChange } from '../../hooks/useCandidateStageChange'
import { CandidateStageDetailsModal } from '../../components/candidates/CandidateStageDetailsModal'
import { ListSearchBar } from '../../components/ui/ListSearchBar'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHero, heroBtnPrimary } from '../../components/layout/PageHero'
import { AppSelect } from '../../components/ui/AppSelect'
import { InterviewStatCard } from '../../components/interviews/InterviewStatCard'
import { PipelineKanbanColumn } from '../../components/pipeline/PipelineKanbanColumn'
import { matchesAnySearch } from '../../lib/textSearch'
import { canCreateCandidate } from '../../lib/candidatePermissions'
import type { CandidateStatus } from '../../types'
import {
  canManageCandidateStage,
  groupCandidatesByKanbanStage,
  pipelineSearchFields,
  pipelineStats,
  sortKanbanCards,
  type PipelineStageFilter,
} from '../../lib/pipelinePage'

const Pipeline = () => {
  const { requirementId } = useParams<{ requirementId: string }>()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [stageFilter, setStageFilter] = useState<PipelineStageFilter>('ALL')
  const { user } = useAuth()
  const canManage = canManageCandidateStage(user?.role)
  const canCreate = canCreateCandidate(user?.role)

  const {
    pendingModal,
    isSubmitting,
    requestStageChange,
    confirmModal,
    closeModal,
  } = useCandidateStageChange({ requirementId })

  const {
    data: candidates = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['candidates', requirementId],
    queryFn: () =>
      requirementId ? api.candidates.getByRequirementId(requirementId) : api.candidates.list(),
  })

  const { data: requirement } = useQuery({
    queryKey: ['requirement', requirementId],
    queryFn: () => (requirementId ? api.requirements.getById(requirementId) : undefined),
    enabled: !!requirementId,
  })

  const { data: requirements = [] } = useQuery({
    queryKey: ['requirements'],
    queryFn: api.requirements.list,
    enabled: !requirementId,
  })

  const jobTitleById = useMemo(
    () => new Map(requirements.map((r) => [r.id, r.title])),
    [requirements]
  )

  const scopedCandidates = useMemo(() => {
    if (!requirementId) return candidates
    return candidates.filter((c) => c.requirementId === requirementId)
  }, [candidates, requirementId])

  const searched = useMemo(
    () =>
      scopedCandidates.filter((c) =>
        matchesAnySearch(
          pipelineSearchFields(c, c.requirementId ? jobTitleById.get(c.requirementId) : undefined),
          searchTerm
        )
      ),
    [scopedCandidates, searchTerm, jobTitleById]
  )

  const stats = useMemo(() => pipelineStats(searched), [searched])

  const columns = useMemo(() => {
    const groups = groupCandidatesByKanbanStage(searched).map((g) => ({
      ...g,
      items: sortKanbanCards(g.items),
    }))
    if (stageFilter === 'ALL') return groups
    return groups.filter((g) => g.stage === stageFilter)
  }, [searched, stageFilter])

  const scrollToStage = (stage: CandidateStatus) => {
    const next = stageFilter === stage ? 'ALL' : stage
    setStageFilter(next)
    if (next !== 'ALL') {
      requestAnimationFrame(() => {
        document.querySelector(`[data-stage="${stage}"]`)?.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        })
      })
    }
  }

  const liveRequirements = useMemo(
    () => requirements.filter((r) => r.status === 'LIVE' || r.status === 'ON_HOLD'),
    [requirements]
  )

  const pageTitle = requirement ? requirement.title : 'Hiring pipeline'
  const showJobOnCards = !requirementId

  return (
    <div className="max-w-[100rem] mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      {pendingModal && (
        <CandidateStageDetailsModal
          open
          targetStatus={pendingModal.status}
          candidateName={pendingModal.candidateName}
          onClose={closeModal}
          onConfirm={confirmModal}
          isSubmitting={isSubmitting}
        />
      )}

      <div className="flex flex-col gap-6">
        <div className="space-y-3 min-w-0">
          <PageHero
            icon={GitBranch}
            eyebrow={requirementId ? 'Job pipeline' : 'Pipeline view'}
            title={pageTitle}
            description={
              requirementId
                ? 'Pipeline by stage — update status on a card or from the candidate profile.'
                : 'All applicants by hiring stage. Open a job pipeline to focus on one requirement.'
            }
            actions={
              canCreate ? (
                <Link to="/candidates/new" className={heroBtnPrimary}>
                  <UserPlus size={18} />
                  Add candidate
                </Link>
              ) : undefined
            }
          />
          {requirement && (
            <div className="flex flex-wrap items-center gap-3 px-1 text-sm font-semibold text-muted-foreground">
              {requirement.jobCode && (
                <span className="font-mono text-xs font-bold text-primary/60 dark:text-white/50">
                  {requirement.jobCode}
                </span>
              )}
              {requirement.client && (
                <span className="inline-flex items-center gap-1">
                  <Building2 size={14} />
                  {requirement.client}
                </span>
              )}
              <Link
                to={`/requirements/${requirementId}`}
                className="inline-flex items-center gap-1 text-xs font-bold text-primary dark:text-blue-400 hover:underline"
              >
                Job details
                <ExternalLink size={12} />
              </Link>
            </div>
          )}
        </div>
      </div>

      {!requirementId && liveRequirements.length > 0 && (
        <div className="app-card p-4 shadow-sm">
          <label className="block text-xs font-bold uppercase tracking-wider text-primary/50 dark:text-white/50 mb-2">
            Focus on a job
          </label>
          <AppSelect
            className="w-full max-w-md"
            value=""
            onChange={(id) => {
              if (id) navigate(`/pipeline/${id}`)
            }}
            placeholder={`All jobs — ${scopedCandidates.length} candidates`}
            options={liveRequirements.map((r) => ({
              value: r.id,
              label: r.jobCode ? `${r.title} (${r.jobCode})` : r.title,
            }))}
            aria-label="Focus on a job"
          />
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        <InterviewStatCard
          label="In pipeline"
          value={stats.active}
          icon={Briefcase}
          accent="blue"
          active={stageFilter === 'ALL'}
          onClick={() => setStageFilter('ALL')}
        />
        <InterviewStatCard
          label="Interview"
          value={stats.interview}
          icon={Users}
          accent="slate"
          active={stageFilter === 'INTERVIEW'}
          onClick={() => scrollToStage('INTERVIEW')}
        />
        <InterviewStatCard
          label="Offer"
          value={stats.offer}
          icon={Sparkles}
          accent="amber"
          active={stageFilter === 'OFFER'}
          onClick={() => scrollToStage('OFFER')}
        />
        <InterviewStatCard
          label="Hired"
          value={stats.hired}
          icon={CheckCircle2}
          accent="green"
          active={stageFilter === 'HIRED'}
          onClick={() => scrollToStage('HIRED')}
        />
        <InterviewStatCard
          label="Rejected"
          value={stats.rejected}
          icon={Ban}
          accent="slate"
          active={stageFilter === 'REJECTED'}
          onClick={() => scrollToStage('REJECTED')}
        />
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="panel-toolbar flex-1">
          <ListSearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search name, email, job, client, recruiter..."
            className="max-w-none"
          />
        </div>
        {stageFilter !== 'ALL' && (
          <button
            type="button"
            onClick={() => setStageFilter('ALL')}
            className="filter-chip-active inline-flex items-center gap-2"
          >
            <ListFilter size={14} />
            Show all stages
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="py-24 text-center text-muted-foreground font-medium">
          Loading pipeline...
        </div>
      ) : isError ? (
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-red-200/60 dark:border-red-500/30 p-8 text-center space-y-4">
          <p className="text-sm font-bold text-red-700 dark:text-red-300">
            {error instanceof ApiError ? error.message : 'Could not load pipeline.'}
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
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-dashed border-primary/15 dark:border-white/15">
          <EmptyState
            icon="view_kanban"
            title={searchTerm.trim() ? 'No matches' : 'Pipeline is empty'}
            description={
              searchTerm.trim()
                ? 'Try a different search or clear filters.'
                : requirementId
                  ? 'Add candidates to this job or link applicants from matching profiles.'
                  : 'Add candidates or open a job pipeline from Requirements.'
            }
          />
          {canCreate && !searchTerm.trim() && (
            <div className="pb-10 flex justify-center">
              <Link
                to="/candidates/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold"
              >
                <UserPlus size={16} /> Add candidate
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="relative -mx-1">
          <div className="flex gap-4 overflow-x-auto pb-6 px-1 snap-x snap-mandatory custom-scrollbar">
            {columns.map((col) => (
              <div key={col.stage} className="snap-center">
                <PipelineKanbanColumn
                  stage={col.stage}
                  title={col.title}
                  candidates={col.items}
                  canManage={canManage}
                  userRole={user?.role}
                  showJob={showJobOnCards}
                  highlighted={stageFilter === col.stage}
                  dimmed={stageFilter !== 'ALL' && stageFilter !== col.stage}
                  onMoveStage={requestStageChange}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Pipeline
