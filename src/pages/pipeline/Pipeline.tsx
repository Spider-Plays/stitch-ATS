import React, { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { api } from '../../services/api'
import { Candidate } from '../../types'
import { MoreHorizontal, Calendar, Phone, Search, Filter, Plus, UserPlus, CheckCircle2, XCircle, Clock } from 'lucide-react'
import clsx from 'clsx'
import { useToastStore } from '../../store/toastStore'

// Columns to display in the Kanban board
const COLUMNS = ['SOURCED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'] as const

// Helper to map status to display color/label
const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    if (score >= 80) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
}

const CandidateCard = ({ candidate }: { candidate: Candidate }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: candidate.id, data: { candidate } })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={clsx(
                "group relative flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm hover:border-primary/30 hover:shadow-md dark:border-white/10 dark:bg-white/5 transition-all cursor-grab active:cursor-grabbing",
                isDragging ? "ring-2 ring-primary rotate-2 scale-105" : "border-primary/10"
            )}
        >
            <div className="flex items-start justify-between">
                <div className="flex gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg dark:text-white">
                        {candidate.avatar ? (
                            <img src={candidate.avatar} alt={candidate.name} className="h-full w-full object-cover" />
                        ) : (
                            candidate.name.charAt(0)
                        )}
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-primary dark:text-white group-hover:text-primary transition-colors">{candidate.name}</h4>
                        <div className="flex items-center gap-1 text-[11px] font-medium text-primary/50 dark:text-white/40">
                            {candidate.source}
                        </div>
                    </div>
                </div>
                <div className={clsx("rounded px-1.5 py-0.5 text-[10px] font-bold", getMatchScoreColor(candidate.matchScore))}>
                    {candidate.matchScore}% Match
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <div className="text-[12px] text-primary/70 dark:text-white/60 font-medium">
                    {candidate.role}
                </div>
                {candidate.status === 'INTERVIEW' && (
                    <div className="flex items-center gap-2 rounded bg-primary/5 p-2 dark:bg-white/5">
                        <Phone size={14} className="text-primary dark:text-white" />
                        <p className="text-[11px] font-medium text-primary dark:text-white">Interview Scheduled</p>
                    </div>
                )}
                {candidate.status === 'OFFER' && (
                    <div className="flex items-center gap-2 rounded bg-green-50 p-2 dark:bg-green-900/10">
                        <CheckCircle2 size={14} className="text-green-600 dark:text-green-400" />
                        <p className="text-[11px] font-medium text-green-700 dark:text-green-400">Offer Sent</p>
                    </div>
                )}
            </div>

            <Link
                to={`/candidates/${candidate.id}`}
                onClick={(e) => e.stopPropagation()}
                className="mt-1 w-full rounded border border-primary/10 bg-white py-1.5 text-center text-[12px] font-bold text-primary hover:bg-primary/5 dark:bg-white/5 dark:text-white dark:border-white/10 transition-colors"
            >
                Review Profile
            </Link>
        </div>
    )
}

const PipelineColumn = ({ id, candidates }: { id: string, candidates: Candidate[] }) => {
    const { setNodeRef } = useSortable({ id })

    return (
        <div ref={setNodeRef} className="flex-shrink-0 w-80 flex flex-col h-full">
            <div className="flex items-center justify-between px-1 mb-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary/60 dark:text-white/60">{id}</h3>
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary/10 px-1.5 text-[10px] font-bold text-primary dark:bg-white/10 dark:text-white">{candidates.length}</span>
                </div>
                <button className="text-primary/30 hover:text-primary dark:text-white/30 dark:hover:text-white transition-colors">
                    <MoreHorizontal size={18} />
                </button>
            </div>

            <div className="flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-2 pb-20">
                <SortableContext items={candidates.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    {candidates.map(c => (
                        <CandidateCard key={c.id} candidate={c} />
                    ))}
                </SortableContext>

                {candidates.length === 0 && (
                    <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-primary/5 dark:border-white/5 rounded-xl bg-primary/[0.02] dark:bg-white/[0.02] text-primary/30 dark:text-white/30">
                        <span className="text-xs font-bold uppercase tracking-wider">No Candidates</span>
                    </div>
                )}
            </div>
        </div>
    )
}

const Pipeline = () => {
    const { requirementId } = useParams<{ requirementId: string }>()
    const queryClient = useQueryClient()
    const [activeId, setActiveId] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const { addToast } = useToastStore()

    const { data: candidates = [] } = useQuery({
        queryKey: ['candidates', requirementId],
        queryFn: () => requirementId
            ? api.candidates.getByRequirementId(requirementId)
            : api.candidates.list()
    })

    const { data: requirement } = useQuery({
        queryKey: ['requirement', requirementId],
        queryFn: () => requirementId ? api.requirements.getById(requirementId) : undefined,
        enabled: !!requirementId
    })

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string, status: Candidate['status'] }) =>
            api.candidates.updateStatus(id, status),
        onMutate: async ({ id, status }) => {
            await queryClient.cancelQueries({ queryKey: ['candidates'] })
            const previousCandidates = queryClient.getQueryData<Candidate[]>(['candidates', requirementId]) || []

            queryClient.setQueryData<Candidate[]>(['candidates', requirementId], (old) => {
                if (!old) return []
                return old.map(c => c.id === id ? { ...c, status } : c)
            })

            return { previousCandidates }
        },
        onError: (err, newTodo, context) => {
            if (context?.previousCandidates) {
                queryClient.setQueryData(['candidates', requirementId], context.previousCandidates)
            }
            addToast('Failed to update stage', 'error')
        },
        onSuccess: () => {
            // success is silent for drag and drop usually, or maybe a small toast?
            // addToast('Stage updated', 'success') // Too noisy? 
            // Let's keep it silent on success but ensure data is fresh
            queryClient.invalidateQueries({ queryKey: ['candidates'] })
        }
    })

    const filteredCandidates = useMemo(() => {
        let filtered = candidates

        if (requirementId) {
            filtered = filtered.filter(c => c.requirementId === requirementId)
        }

        if (searchTerm) {
            const q = searchTerm.toLowerCase()
            filtered = filtered.filter(
                (c) =>
                    c.name.toLowerCase().includes(q) ||
                    c.role.toLowerCase().includes(q) ||
                    c.email?.toLowerCase().includes(q) ||
                    c.jobTitle?.toLowerCase().includes(q) ||
                    c.source?.toLowerCase().includes(q)
            )
        }

        return filtered
    }, [candidates, requirementId, searchTerm])

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string)
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (!over) return

        const activeId = active.id as string
        const activeContainer = active.data.current?.sortable?.containerId
        const overContainer = over.data.current?.sortable?.containerId || over.id

        let newStatus = ''

        if (COLUMNS.includes(overContainer as any)) {
            newStatus = overContainer as string
        } else {
            const overCandidate = candidates.find(c => c.id === over.id)
            if (overCandidate) newStatus = overCandidate.status
        }

        if (newStatus && newStatus !== active.data.current?.candidate?.status) {
            // Optimistic update could be handled here, but for now we rely on mutation
            updateStatusMutation.mutate({ id: activeId, status: newStatus as any })
        }

        setActiveId(null)
    }

    const activeCandidate = activeId ? candidates.find(c => c.id === activeId) : null

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex gap-4 items-center">
                    <div className="size-10 bg-primary dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-primary shadow-lg shadow-primary/20 dark:shadow-none">
                        <span className="material-symbols-outlined !text-xl">conversion_path</span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-primary dark:text-white tracking-tight">
                            {requirement ? requirement.title : 'Details'}
                        </h1>
                        <p className="text-sm font-medium text-primary/60 dark:text-white/60">Manage candidate pipeline</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40 dark:text-white/40" size={18} />
                        <input
                            type="text"
                            placeholder="Search candidates..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2.5 rounded-xl border border-primary/10 dark:border-white/10 bg-white dark:bg-white/5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary w-64"
                        />
                    </div>
                    <Link to="/candidates/new">
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary dark:bg-white text-white dark:text-primary rounded-xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 dark:shadow-none">
                            <UserPlus size={18} />
                            <span>Add Candidate</span>
                        </button>
                    </Link>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-3 overflow-x-auto pb-4 mb-2 no-scrollbar">
                <button
                    onClick={() => setSearchTerm('')}
                    className={clsx("flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors", !searchTerm ? "bg-primary/10 border-primary text-primary dark:bg-white/10 dark:border-white dark:text-white" : "border-primary/10 bg-white hover:bg-primary/5 dark:border-white/10 dark:bg-white/5 dark:text-white")}
                >
                    <Filter size={14} />
                    All Candidates
                </button>
            </div>

            {/* Kanban Board */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex-1 flex gap-6 overflow-x-auto pb-6">
                    {COLUMNS.map(columnId => (
                        <PipelineColumn
                            key={columnId}
                            id={columnId}
                            candidates={filteredCandidates.filter(c => c.status === columnId)}
                        />
                    ))}
                </div>

                <DragOverlay>
                    {activeCandidate ? <CandidateCard candidate={activeCandidate} /> : null}
                </DragOverlay>
            </DndContext>
        </div>
    )
}

export default Pipeline
