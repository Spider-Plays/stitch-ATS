import React, { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, Users } from 'lucide-react'
import { PageHero, heroBtnPrimary, heroBtnSecondary } from '../../components/layout/PageHero'
import clsx from 'clsx'
import { api } from '../../services/api'
import { ListSearchBar } from '../../components/ui/ListSearchBar'
import { matchesAnySearch } from '../../lib/textSearch'

const RequirementLinkedCandidates = () => {
    const { id } = useParams<{ id: string }>()
    const [search, setSearch] = useState('')

    const { data: requirement, isLoading: reqLoading } = useQuery({
        queryKey: ['requirement', id],
        queryFn: () => api.requirements.getById(id || ''),
        enabled: !!id,
    })

    const { data: candidates = [], isLoading } = useQuery({
        queryKey: ['candidates', 'requirement', id],
        queryFn: () => api.candidates.getByRequirementId(id || ''),
        enabled: !!id,
    })

    const filtered = useMemo(
        () =>
            candidates.filter((c) =>
                matchesAnySearch([c.name, c.email, c.role, c.status, c.source], search)
            ),
        [candidates, search]
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
                icon={Users}
                eyebrow="Requirement"
                title="Linked candidates"
                description={
                    [requirement?.title, requirement?.jobCode].filter(Boolean).join(' · ') ||
                    'Candidates submitted for this job'
                }
                className="mb-3"
                actions={
                    <div className="flex flex-wrap gap-2">
                        <Link to={`/pipeline/${id}`} className={heroBtnSecondary}>
                            Pipeline
                        </Link>
                        <Link
                            to={`/candidates/new?requirementId=${id}`}
                            className={heroBtnPrimary}
                        >
                            <Plus size={16} />
                            Add candidate
                        </Link>
                    </div>
                }
            />
            <p className="text-xs font-semibold text-muted-foreground mb-6 px-1">
                {candidates.length} linked
                {search.trim() ? ` · ${filtered.length} matching search` : ''}
            </p>

            <ListSearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search linked candidates…"
                className="mb-6 max-w-xl"
            />

            {isLoading ? (
                <p className="text-slate-500 italic">Loading…</p>
            ) : filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 dark:border-white/10 p-12 text-center text-slate-500">
                    {search.trim()
                        ? 'No candidates match your search.'
                        : 'No candidates linked to this requirement yet.'}
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((c) => (
                        <Link
                            key={c.id}
                            to={`/candidates/${c.id}`}
                            className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm hover:border-primary/30 dark:hover:border-white/20 transition-colors"
                        >
                            <div className="min-w-0">
                                <p className="text-base font-bold text-primary dark:text-white">{c.name}</p>
                                <p className="text-sm text-slate-500 mt-0.5">
                                    {c.role} · {c.email}
                                </p>
                                {c.source && (
                                    <p className="text-[11px] text-slate-400 mt-1">Source: {c.source}</p>
                                )}
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                                {c.matchScore > 0 && (
                                    <span
                                        className={clsx(
                                            'px-3 py-1 rounded-lg text-sm font-black',
                                            c.matchScore >= 70
                                                ? 'bg-green-100 text-green-800'
                                                : c.matchScore >= 40
                                                  ? 'bg-amber-100 text-amber-800'
                                                  : 'bg-slate-200 text-slate-600'
                                        )}
                                    >
                                        {Math.round(c.matchScore)}%
                                    </span>
                                )}
                                <span className="text-[10px] font-bold uppercase text-slate-400">
                                    {c.status}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}

export default RequirementLinkedCandidates
