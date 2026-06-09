import React, { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { RefreshCw, Sparkles } from 'lucide-react'
import { PageHero, heroBtnSecondary } from '@/components/layout/PageHero'
import clsx from 'clsx'
import { api } from '@/services/api'
import { ListSearchBar } from '@/components/ui/ListSearchBar'
import { matchesAnySearch } from '@/lib/textSearch'
import { useToastStore } from '@/store/toastStore'
import './matching-profiles.css'

const RequirementMatchingProfiles = () => {
    const { id } = useParams<{ id: string }>()
    const queryClient = useQueryClient()
    const { addToast } = useToastStore()
    const [search, setSearch] = useState('')

    const { data: requirement, isLoading: reqLoading } = useQuery({
        queryKey: ['requirement', id],
        queryFn: () => api.requirements.getById(id || ''),
        enabled: !!id,
    })

    const { data: matchingData, isLoading: matchingLoading, refetch, isFetching } = useQuery({
        queryKey: ['requirement-matches', id],
        queryFn: () => api.requirements.getMatchingProfiles(id!),
        enabled: !!id,
    })

    const linkMutation = useMutation({
        mutationFn: (candidateId: string) => api.requirements.linkCandidate(id!, candidateId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['candidates', 'requirement', id] })
            queryClient.invalidateQueries({ queryKey: ['requirement-matches', id] })
            queryClient.invalidateQueries({ queryKey: ['requirement', id] })
            addToast('Candidate linked to this requirement', 'success')
        },
        onError: () => addToast('Failed to link candidate', 'error'),
    })

    const matches = matchingData?.matches ?? []
    const suggestedMatches = matches.filter((m) => !m.alreadyLinked)

    const filtered = useMemo(
        () =>
            suggestedMatches.filter((m) =>
                matchesAnySearch(
                    [m.candidate.name, m.candidate.email, m.candidate.role, m.candidate.status],
                    search
                )
            ),
        [suggestedMatches, search]
    )

    if (reqLoading) {
        return (
            <div className="p-8 max-w-6xl mx-auto">
                <p className="text-slate-500">Loading…</p>
            </div>
        )
    }

    return (
        <div className="p-8 max-w-6xl mx-auto w-full animate-in fade-in duration-500">
            <PageHero
                icon={Sparkles}
                eyebrow="AI matching"
                title="Matching profiles"
                description={
                    [requirement?.title, requirement?.jobCode].filter(Boolean).join(' · ') ||
                    'Ranked candidates for this requirement'
                }
                className="mb-3"
                actions={
                    <button
                        type="button"
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className={clsx(heroBtnSecondary, isFetching && 'opacity-60')}
                    >
                        <RefreshCw size={16} className={clsx(isFetching && 'animate-spin')} />
                        Refresh
                    </button>
                }
            />
            <p className="text-xs font-semibold text-muted-foreground mb-6 px-1">
                {matchingData?.totalCandidates ?? 0} candidates scored · {filtered.length} shown
            </p>

            <ListSearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search by name, email, role…"
                className="mb-6 max-w-xl"
            />

            {matchingLoading ? (
                <p className="text-slate-500 italic">Finding matches…</p>
            ) : filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 dark:border-white/10 p-12 text-center text-slate-500">
                    {search.trim()
                        ? 'No matches for your search.'
                        : 'No strong matches yet. Add primary skills and a job description, or upload candidate resumes.'}
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((m) => (
                        <div
                            key={m.candidateId}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm"
                        >
                            <div className="min-w-0 flex-1">
                                <Link
                                    to={`/candidates/${m.candidateId}`}
                                    className="text-base font-bold text-primary dark:text-white hover:underline"
                                >
                                    {m.candidate.name}
                                </Link>
                                <p className="text-sm text-slate-500 mt-0.5">
                                    {m.candidate.role} · {m.candidate.email}
                                </p>
                                {m.linkedToOther && (
                                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 font-medium">
                                        Linked to another job
                                    </p>
                                )}
                                {m.breakdown.matchedPrimary.length > 0 && (
                                    <p className="text-[11px] text-slate-500 mt-2">
                                        Skills: {m.breakdown.matchedPrimary.slice(0, 5).join(', ')}
                                        {m.breakdown.matchedPrimary.length > 5 ? '…' : ''}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <span
                                    className={clsx(
                                        'px-3 py-1 rounded-lg text-sm font-black',
                                        m.matchScore >= 70
                                            ? 'bg-green-100 text-green-800'
                                            : m.matchScore >= 40
                                              ? 'bg-amber-100 text-amber-800'
                                              : 'bg-slate-200 text-slate-600'
                                    )}
                                >
                                    {m.matchScore}%
                                </span>
                                <button
                                    type="button"
                                    disabled={linkMutation.isPending || m.alreadyLinked}
                                    onClick={() => linkMutation.mutate(m.candidateId)}
                                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 disabled:opacity-50"
                                >
                                    {m.alreadyLinked ? 'Linked' : 'Link to requirement'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default RequirementMatchingProfiles
