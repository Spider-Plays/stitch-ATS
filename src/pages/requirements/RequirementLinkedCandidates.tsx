import React, { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Plus } from 'lucide-react'
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
            <Link
                to={`/requirements/${id}?tab=candidates`}
                className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary dark:hover:text-white mb-6"
            >
                <ArrowLeft size={16} />
                Back to requirement
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-primary dark:text-white tracking-tight">
                        Linked candidates
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">
                        {requirement?.title}
                        {requirement?.jobCode && (
                            <span className="font-mono ml-2">· {requirement.jobCode}</span>
                        )}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                        {candidates.length} linked
                        {search.trim() ? ` · ${filtered.length} matching search` : ''}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        to={`/pipeline/${id}`}
                        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-bold text-primary dark:text-white hover:bg-slate-50 dark:hover:bg-white/5"
                    >
                        Pipeline
                    </Link>
                    <Link
                        to={`/candidates/new?requirementId=${id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90"
                    >
                        <Plus size={16} />
                        Add candidate
                    </Link>
                </div>
            </div>

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
