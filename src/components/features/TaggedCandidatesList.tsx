import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Users, ListFilter } from 'lucide-react'
import clsx from 'clsx'
import { api } from '../../services/api'
import type { Candidate } from '../../types'
import { ListSearchBar } from '../ui/ListSearchBar'
import { EmptyState } from '../ui/EmptyState'
import { CandidateListItem } from '../candidates/CandidateListItem'
import { InterviewStatCard } from '../interviews/InterviewStatCard'
import {
  CANDIDATE_FILTERS,
  candidateSearchFields,
  filterCandidates,
  sortCandidates,
  type CandidateFilter,
} from '../../lib/candidatePage'
import { matchesAnySearch } from '../../lib/textSearch'
import { ApiError } from '../../lib/apiClient'
import { employeeReferralSourceLabel } from '../../lib/featureCandidates'
import { PageHero } from '../layout/PageHero'

type TaggedCandidatesListProps = {
  title: string
  description: string
  eyebrow: string
  filter: (candidate: Candidate) => boolean
  stats: (candidates: Candidate[]) => { total: number; active: number; hired: number }
  channelBadge?: { label: string; title?: string }
  emptyTitle: string
  emptyDescription: string
}

export function TaggedCandidatesList({
  title,
  description,
  eyebrow,
  filter,
  stats: statsFn,
  channelBadge,
  emptyTitle,
  emptyDescription,
}: TaggedCandidatesListProps) {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<CandidateFilter>('ALL')

  const { data: allCandidates = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['candidates'],
    queryFn: api.candidates.list,
  })

  const pool = useMemo(() => allCandidates.filter(filter), [allCandidates, filter])

  const searched = useMemo(
    () => pool.filter((c) => matchesAnySearch(candidateSearchFields(c), searchTerm)),
    [pool, searchTerm]
  )

  const stats = useMemo(() => statsFn(pool), [pool, statsFn])
  const filtered = useMemo(
    () => sortCandidates(filterCandidates(searched, statusFilter)),
    [searched, statusFilter]
  )

  const candidateMenuItems = (candidate: Candidate) => [
    {
      id: 'view',
      label: 'View profile',
      onClick: () => navigate(`/candidates/${candidate.id}`),
    },
    {
      id: 'pipeline',
      label: 'Open pipeline',
      onClick: () =>
        navigate(candidate.requirementId ? `/pipeline/${candidate.requirementId}` : '/pipeline'),
    },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <PageHero icon={Users} eyebrow={eyebrow} title={title} description={description} />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <InterviewStatCard
          label="Profiles"
          value={stats.total}
          icon={Users}
          accent="slate"
          active={statusFilter === 'ALL'}
          onClick={() => setStatusFilter('ALL')}
        />
        <InterviewStatCard
          label="In pipeline"
          value={stats.active}
          icon={Users}
          accent="blue"
          active={statusFilter === 'ACTIVE'}
          onClick={() => setStatusFilter(statusFilter === 'ACTIVE' ? 'ALL' : 'ACTIVE')}
        />
        <InterviewStatCard
          label="Hired"
          value={stats.hired}
          icon={Users}
          accent="green"
          active={statusFilter === 'HIRED'}
          onClick={() => setStatusFilter(statusFilter === 'HIRED' ? 'ALL' : 'HIRED')}
        />
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="app-card flex-1 p-3">
          <ListSearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search name, email, job title, client..."
            className="max-w-none"
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <ListFilter size={16} className="text-muted-foreground hidden sm:block" />
          {CANDIDATE_FILTERS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={clsx(
                'px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all',
                statusFilter === tab.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'app-card text-primary/70 dark:text-muted-foreground border-primary/10 hover:bg-primary/5'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 text-center text-muted-foreground font-medium">Loading profiles…</div>
      ) : isError ? (
        <div className="app-card border-red-200/60 p-8 text-center space-y-4">
          <p className="text-sm font-bold text-red-700 dark:text-red-300">
            {error instanceof ApiError ? error.message : 'Could not load profiles.'}
          </p>
          <button type="button" onClick={() => refetch()} className="text-sm font-bold underline">
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="group" title={emptyTitle} description={emptyDescription} />
      ) : (
        <ul className="space-y-3">
          {filtered.map((candidate) => (
            <li key={candidate.id}>
              <CandidateListItem
                candidate={candidate}
                menuItems={candidateMenuItems(candidate)}
                channelBadge={channelBadge}
                sourceOverride={
                  channelBadge?.label === 'ERP'
                    ? employeeReferralSourceLabel(candidate)
                    : undefined
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
