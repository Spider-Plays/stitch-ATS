import React, { useMemo, useState } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { RequirementStatus, RequirementVersion, User } from '../../types'
import { useAuth } from '../../hooks/useAuth'
import clsx from 'clsx'
import { format } from 'date-fns'
import {
    Check, X, Edit, Clock, MapPin, Users, AlertCircle, Lock, Monitor, Briefcase, FileText,
    ChevronRight, PauseCircle, PlayCircle, Eye, EyeOff, Trash2,
} from 'lucide-react'
import { useToastStore } from '../../store/toastStore'
import { motion, AnimatePresence } from 'framer-motion'
import { SearchableSelect } from '../../components/ui/SearchableSelect'
import { ListSearchBar } from '../../components/ui/ListSearchBar'
import { matchesAnySearch } from '../../lib/textSearch'

const TABS = [
    { id: 'details', label: 'Requirement Details' },
    { id: 'recruiters', label: 'Recruiter Assignment' },
    { id: 'history', label: 'Approval History' },
    { id: 'versions', label: 'Version History' },
    { id: 'candidates', label: 'Candidates' },
]

const CANDIDATES_PREVIEW_LIMIT = 5

const RequirementDetail = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const queryClient = useQueryClient()
    const { user } = useAuth()
    const { addToast } = useToastStore()
    const tabFromUrl = searchParams.get('tab')
    const [activeTab, setActiveTab] = useState(
        () => (TABS.some((t) => t.id === tabFromUrl) ? tabFromUrl! : 'details')
    )
    const [selectedRecruiter, setSelectedRecruiter] = useState('')
    const [candidateSearch, setCandidateSearch] = useState('')

    React.useEffect(() => {
        if (tabFromUrl && TABS.some((t) => t.id === tabFromUrl)) {
            setActiveTab(tabFromUrl)
        }
    }, [tabFromUrl])

    const { data: requirement, isLoading } = useQuery({
        queryKey: ['requirement', id],
        queryFn: () => api.requirements.getById(id || ''),
        enabled: !!id
    })

    // Always fetch users to get HM details
    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: () => api.users.list()
    })

    const { data: candidates = [] } = useQuery({
        queryKey: ['candidates', 'requirement', id],
        queryFn: () => api.candidates.getByRequirementId(id || ''),
        enabled: !!id
    })

    const { data: matchingData, isLoading: matchingLoading, refetch: refetchMatches } = useQuery({
        queryKey: ['requirement-matches', id],
        queryFn: () => api.requirements.getMatchingProfiles(id!),
        enabled: !!id,
    })

    const matchingProfiles = matchingData?.matches ?? []
    const suggestedMatches = matchingProfiles.filter((m) => !m.alreadyLinked)

    // Derived Data
    const recruiters = users.filter(u => ['RECRUITER', 'HR_MANAGER', 'HR_HEAD', 'ADMIN'].includes(u.role))
    const hiringManager = users.find(u => u.uid === requirement?.hiringManager)
    const isHr = ['ADMIN', 'HR_MANAGER', 'HR_HEAD'].includes(user?.role || '')
    const isAdmin = user?.role === 'ADMIN'
    const canManagePortal = isAdmin || isHr

    const recruiterOptions = useMemo(
        () =>
            recruiters
                .filter((r) => !requirement?.recruiters?.includes(r.uid))
                .map((r) => ({
                    value: r.uid,
                    label: r.name,
                    sublabel: `${r.role.replace('_', ' ')} · ${r.email}`,
                })),
        [recruiters, requirement?.recruiters]
    )

    const filteredCandidates = useMemo(
        () =>
            candidates.filter((c) =>
                matchesAnySearch([c.name, c.email, c.role, c.status, c.source], candidateSearch)
            ),
        [candidates, candidateSearch]
    )

    const previewMatches = suggestedMatches.slice(0, CANDIDATES_PREVIEW_LIMIT)
    const previewLinked = filteredCandidates.slice(0, CANDIDATES_PREVIEW_LIMIT)

    const versionTimeline = useMemo(() => {
        const list = [...(requirement?.versions ?? [])] as RequirementVersion[]
        return list.sort(
            (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
        )
    }, [requirement?.versions])

    const versionKind = (ver: RequirementVersion): RequirementVersion['kind'] =>
        ver.kind ??
        (typeof ver.changes?.candidateId === 'string' ? 'CANDIDATE_LINKED' : 'UPDATE')

    // Mutations
    const approveMutation = useMutation({
        mutationFn: () => api.requirements.approve(id!, { uid: user!.uid, role: user!.role }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['requirement', id] })
    })

    const rejectMutation = useMutation({
        mutationFn: () => api.requirements.reject(id!, { uid: user!.uid, role: user!.role }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['requirement', id] })
    })

    const closeMutation = useMutation({
        mutationFn: () => api.requirements.updateStatus(id!, 'CLOSED'),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['requirement', id] })
    })

    const linkCandidateMutation = useMutation({
        mutationFn: (candidateId: string) => api.requirements.linkCandidate(id!, candidateId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['candidates', 'requirement', id] })
            queryClient.invalidateQueries({ queryKey: ['requirement-matches', id] })
            queryClient.invalidateQueries({ queryKey: ['requirement', id] })
            addToast('Candidate linked to this requirement', 'success')
        },
        onError: () => addToast('Failed to link candidate', 'error'),
    })

    const assignRecruiterMutation = useMutation({
        mutationFn: (recruiterId: string) =>
            api.requirements.assignRecruiter(id!, recruiterId, requirement?.recruiters || []),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requirement', id] })
            setSelectedRecruiter('')
        }
    })

    const holdMutation = useMutation({
        mutationFn: () => api.requirements.updateStatus(id!, 'ON_HOLD'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requirement', id] })
            queryClient.invalidateQueries({ queryKey: ['requirements'] })
            addToast('Requirement placed on hold', 'success')
        },
        onError: () => addToast('Failed to update status', 'error'),
    })

    const releaseMutation = useMutation({
        mutationFn: () => api.requirements.updateStatus(id!, 'LIVE'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requirement', id] })
            queryClient.invalidateQueries({ queryKey: ['requirements'] })
            addToast('Requirement is live again', 'success')
        },
        onError: () => addToast('Failed to update status', 'error'),
    })

    const visibilityMutation = useMutation({
        mutationFn: (visible: boolean) => api.requirements.setVisibility(id!, visible),
        onSuccess: (_data, visible) => {
            queryClient.invalidateQueries({ queryKey: ['requirement', id] })
            addToast(visible ? 'Visible on candidate portal' : 'Hidden from candidate portal', 'success')
        },
        onError: () => addToast('Failed to update visibility', 'error'),
    })

    const deleteMutation = useMutation({
        mutationFn: () => api.requirements.delete(id!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requirements'] })
            addToast('Requirement deleted', 'success')
            navigate('/requirements')
        },
        onError: () => addToast('Failed to delete requirement', 'error'),
    })

    const handleApproval = (action: 'APPROVE' | 'REJECT' | 'CLOSE') => {
        if (!confirm(`Are you sure you want to ${action.toLowerCase()} this requirement?`)) return
        if (action === 'APPROVE') approveMutation.mutate()
        else if (action === 'REJECT') rejectMutation.mutate()
        else if (action === 'CLOSE') closeMutation.mutate()
    }

    if (isLoading) return <div className="p-12 text-center animate-pulse">Loading requirement...</div>
    if (!requirement) return <div className="p-12 text-center">Requirement not found</div>

    const isPending = requirement.status === 'PENDING_APPROVAL'
    const isLive = requirement.status === 'LIVE'
    const isOnHold = requirement.status === 'ON_HOLD'
    const isClosed = requirement.status === 'CLOSED'
    const isRejected = requirement.status === 'REJECTED'
    const portalVisible = requirement.visibleToCandidates ?? true

    const canEdit = isHr || user?.uid === requirement.createdBy

    return (
        <div className="p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
            {/* 2.0 Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        {requirement.priority === 'CRITICAL' && (
                            <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                                <AlertCircle size={12} fill="currentColor" className="text-red-700 dark:text-red-400" /> Urgent
                            </span>
                        )}
                        <span className={clsx(
                            "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1",
                            isPending ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                isLive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                    isOnHold ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                                    isClosed ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400" :
                                        isRejected ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                            "bg-slate-100 text-slate-700"
                        )}>
                            <Clock size={12} />
                            {requirement.status.replace('_', ' ')}
                        </span>
                    </div>

                    <h1 className="text-4xl font-black text-primary dark:text-white tracking-tight leading-tight">
                        {requirement.title}
                    </h1>

                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm flex flex-wrap items-center gap-2">
                        {requirement.jobCode && (
                            <>
                                <span className="font-mono text-primary dark:text-white">Req: {requirement.jobCode}</span>
                                <span className="opacity-30">•</span>
                            </>
                        )}
                        {requirement.client && (
                            <>
                                <span>{requirement.client}</span>
                                <span className="opacity-30">•</span>
                            </>
                        )}
                        {requirement.department} Department
                    </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                    {/* Role-Based Actions */}
                    {isHr && isPending && (
                        <>
                            <button
                                onClick={() => handleApproval('REJECT')}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-lg shadow-red-600/20 transition-all active:scale-95"
                            >
                                <X size={18} /> Reject
                            </button>
                            <button
                                onClick={() => handleApproval('APPROVE')}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                            >
                                <Check size={18} /> Approve
                            </button>
                        </>
                    )}

                    {canEdit && (
                        <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-primary dark:text-white text-sm font-bold hover:bg-slate-50 dark:hover:bg-white/10 transition-all">
                            <Edit size={16} /> Edit
                        </button>
                    )}

                    {isHr && (isLive || isOnHold) && (
                        <button
                            onClick={() => handleApproval('CLOSE')}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white text-sm font-bold shadow-sm transition-all active:scale-95"
                        >
                            <Lock size={16} /> Close
                        </button>
                    )}

                    {isAdmin && (
                        <button
                            type="button"
                            onClick={() => {
                                if (!confirm(`Delete "${requirement.title}"? Linked candidates will be unassigned. This cannot be undone.`)) return
                                deleteMutation.mutate()
                            }}
                            disabled={deleteMutation.isPending}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold disabled:opacity-50"
                        >
                            <Trash2 size={16} /> Delete
                        </button>
                    )}
                </div>
            </div>

            {/* 3.0 Tabs */}
            <div className="border-b border-slate-200 dark:border-white/10 flex gap-8 mb-8 overflow-x-auto">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={clsx(
                            "pb-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap",
                            activeTab === tab.id
                                ? "border-primary dark:border-white text-primary dark:text-white"
                                : "border-transparent text-slate-400 hover:text-primary dark:hover:text-white"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area with Animations */}
            <div className="relative min-h-[400px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                        {activeTab === 'details' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Left Column (2/3) */}
                                <div className="lg:col-span-2 space-y-6">
                                    {canManagePortal && (isLive || isOnHold) && (
                                        <section className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
                                            <h3 className="text-lg font-bold mb-4 text-primary dark:text-white">Portal &amp; posting controls</h3>
                                            <div className="flex flex-wrap gap-3">
                                                {isLive && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (!confirm('Put this requirement on hold? It will be hidden from the candidate portal.')) return
                                                            holdMutation.mutate()
                                                        }}
                                                        disabled={holdMutation.isPending}
                                                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-orange-200 bg-orange-50 text-orange-800 text-sm font-bold hover:bg-orange-100 disabled:opacity-50"
                                                    >
                                                        <PauseCircle size={16} /> Put on hold
                                                    </button>
                                                )}
                                                {isOnHold && (
                                                    <button
                                                        type="button"
                                                        onClick={() => releaseMutation.mutate()}
                                                        disabled={releaseMutation.isPending}
                                                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm font-bold hover:bg-emerald-100 disabled:opacity-50"
                                                    >
                                                        <PlayCircle size={16} /> Resume (go live)
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => visibilityMutation.mutate(!portalVisible)}
                                                    disabled={visibilityMutation.isPending || isOnHold}
                                                    title={isOnHold ? 'Resume the job before changing portal visibility' : undefined}
                                                    className={clsx(
                                                        'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-bold disabled:opacity-50',
                                                        portalVisible
                                                            ? 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                                                            : 'border-primary/20 bg-primary/5 text-primary hover:bg-primary/10'
                                                    )}
                                                >
                                                    {portalVisible ? (
                                                        <>
                                                            <EyeOff size={16} /> Hide from candidate portal
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Eye size={16} /> Show on candidate portal
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-3">
                                                {isOnHold
                                                    ? 'On hold: hidden from open positions and linked candidates see a hold message.'
                                                    : portalVisible
                                                      ? 'Visible: live jobs appear on the candidate dashboard open positions list.'
                                                      : 'Hidden: candidates linked to this job will not see job details on their portal.'}
                                            </p>
                                        </section>
                                    )}

                                    {/* Job Description & Skills */}
                                    <section className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-sm">
                                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-primary dark:text-white">
                                            <FileText size={20} className="text-primary/60 dark:text-white/60" /> Job description & skills
                                        </h3>
                                        {(requirement.primarySkills?.length ?? 0) > 0 && (
                                            <div className="mb-4">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Primary skills</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {requirement.primarySkills!.map((s) => (
                                                        <span key={s} className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary dark:text-white text-xs font-bold">{s}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {(requirement.secondarySkills?.length ?? 0) > 0 && (
                                            <div className="mb-6">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Secondary skills</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {requirement.secondarySkills!.map((s) => (
                                                        <span key={s} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white/80 text-xs font-bold">{s}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed">
                                            <p className="whitespace-pre-wrap">{requirement.jobDescription || requirement.description || 'No job description provided.'}</p>
                                        </div>
                                    </section>

                                    {/* Hiring Manager Details Card */}
                                    <section className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-sm">
                                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-primary dark:text-white">
                                            <Monitor size={20} className="text-primary/60 dark:text-white/60" /> Hiring Manager Details
                                        </h3>
                                        <div className="relative pl-6 border-l-4 border-slate-100 dark:border-white/10 italic text-slate-500">
                                            "This role is critical for the {requirement.department} team's expansion. We are looking for a candidate who can hit the ground running."
                                        </div>
                                    </section>
                                </div>

                                {/* Right Column (1/3) */}
                                <div className="space-y-6">
                                    {/* Position Details Card */}
                                    <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Position Details</h3>

                                        <div className="space-y-6">
                                            <div>
                                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Total Openings</p>
                                                <p className="text-xl font-black text-primary dark:text-white flex items-center gap-2">
                                                    {requirement.openings} <span className="text-slate-400 text-sm font-medium">Positions</span>
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Priority</p>
                                                    <p className={clsx("text-sm font-bold", requirement.priority === 'CRITICAL' ? "text-red-600" : "text-primary dark:text-white")}>
                                                        {requirement.priority || 'Normal'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Location</p>
                                                    <p className="text-sm font-bold text-primary dark:text-white">{requirement.location || 'Remote'}</p>
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-2">Hiring Manager</p>
                                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-xl">
                                                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                        {hiringManager?.avatar ? <img src={hiringManager.avatar} className="size-full rounded-full" /> : (hiringManager?.name?.[0] || '?')}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-primary dark:text-white">{hiringManager?.name || 'Unknown'}</p>
                                                        <p className="text-[10px] text-slate-500">{hiringManager?.role || 'Hiring Manager'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Approval Progress Card */}
                                    <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 size-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                                        <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-6 relative z-10">Approval Progress</h3>

                                        <div className="relative z-10 space-y-6">
                                            {/* Step 1: Requested */}
                                            <div className="relative pl-8">
                                                <div className="absolute left-0 top-1 size-4 rounded-full bg-emerald-500 flex items-center justify-center">
                                                    <Check size={10} className="text-white" />
                                                </div>
                                                <div className="absolute left-2 top-6 w-0.5 h-10 bg-emerald-500/30"></div>
                                                <p className="text-sm font-bold text-white">Requested</p>
                                                <p className="text-[10px] text-white/50">{format(new Date(requirement.createdAt), 'MM/dd/yyyy')}</p>
                                            </div>

                                            {/* Step 2: Pending HR Decision */}
                                            <div className="relative pl-8">
                                                <div className={clsx(
                                                    "absolute left-0 top-1 size-4 rounded-full border-2 flex items-center justify-center",
                                                    isPending ? "border-white bg-white" :
                                                        !isPending ? "border-emerald-500 bg-emerald-500" : "border-white/20"
                                                )}>
                                                    {!isPending && !isRejected && <Check size={10} className="text-white" />}
                                                    {isPending && <div className="size-1.5 rounded-full bg-slate-900"></div>}
                                                </div>
                                                <div className="absolute left-2 top-6 w-0.5 h-10 bg-white/10"></div>
                                                <p className={clsx("text-sm font-bold", isPending ? "text-white" : "text-white/60")}>Pending HR Decision</p>
                                                {isPending && <p className="text-[10px] text-white/50">Current Step</p>}
                                            </div>

                                            {/* Step 3: Live */}
                                            <div className="relative pl-8">
                                                <div className={clsx(
                                                    "absolute left-0 top-1 size-4 rounded-full border-2 flex items-center justify-center",
                                                    isLive ? "border-white bg-white" :
                                                        isClosed ? "border-slate-500 bg-slate-500" : "border-white/20"
                                                )}>
                                                    {isLive && <div className="size-1.5 rounded-full bg-slate-900"></div>}
                                                </div>
                                                <p className={clsx("text-sm font-bold", (isLive || isOnHold) ? "text-white" : "text-white/60")}>
                                                    {isClosed ? 'Closed' : isRejected ? 'Rejected' : isOnHold ? 'On hold' : 'Live on Job Board'}
                                                </p>
                                                {isLive ? <p className="text-[10px] text-white/50">Active</p> : isOnHold ? <p className="text-[10px] text-white/50">Paused</p> : <p className="text-[10px] text-white/30">Upcoming</p>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Recruiter Assignment Tab */}
                        {activeTab === 'recruiters' && (
                            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-sm max-w-3xl">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-primary dark:text-white">Assigned Recruiters</h3>
                                    {isHr && (
                                        <div className="flex flex-col sm:flex-row gap-2 flex-1 max-w-md">
                                            <SearchableSelect
                                                value={selectedRecruiter}
                                                onChange={setSelectedRecruiter}
                                                options={recruiterOptions}
                                                placeholder="Select recruiter..."
                                                searchPlaceholder="Search recruiters..."
                                                className="flex-1"
                                            />
                                            <button
                                                onClick={() => selectedRecruiter && assignRecruiterMutation.mutate(selectedRecruiter)}
                                                disabled={!selectedRecruiter}
                                                className="px-4 py-2 bg-primary dark:bg-white text-white dark:text-primary rounded-lg text-sm font-bold disabled:opacity-50 shrink-0"
                                            >
                                                Assign
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {requirement.recruiters?.length === 0 ? (
                                    <p className="text-slate-500 italic">No recruiters assigned yet.</p>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {requirement.recruiters?.map(rid => {
                                            const recruiter = users.find(u => u.uid === rid)
                                            return (
                                                <div key={rid} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                                                    <div className="size-10 rounded-full bg-primary/10 dark:bg-white/10 flex items-center justify-center text-primary dark:text-white font-bold">
                                                        {recruiter?.name?.[0] || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-primary dark:text-white">{recruiter?.name || 'Unknown User'}</p>
                                                        <p className="text-xs text-slate-500">{recruiter?.email}</p>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Approval History Tab */}
                        {activeTab === 'history' && (
                            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-sm max-w-3xl">
                                <h3 className="text-lg font-bold mb-6 text-primary dark:text-white">Approval Timeline</h3>
                                <div className="relative border-l-2 border-slate-200 dark:border-white/10 ml-3 space-y-8">
                                    {requirement.approvalHistory?.map((event, idx) => (
                                        <div key={idx} className="relative pl-8">
                                            <div className={clsx(
                                                "absolute -left-[9px] top-0 size-4 rounded-full border-2 border-white dark:border-black",
                                                event.action === 'APPROVED' ? "bg-emerald-500" :
                                                    event.action === 'REJECTED' ? "bg-red-500" : "bg-blue-500"
                                            )}></div>
                                            <div>
                                                <p className="text-sm font-bold text-primary dark:text-white">
                                                    {event.action} by {users.find(u => u.uid === event.by)?.name || event.by}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    {format(new Date(event.at), 'PPP p')} • {event.role}
                                                </p>
                                                {event.comments && (
                                                    <p className="mt-2 text-sm bg-slate-50 dark:bg-white/5 p-3 rounded-lg italic text-slate-600">
                                                        "{event.comments}"
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {!requirement.approvalHistory?.length && (
                                        <p className="pl-8 text-slate-500 italic">No history recorded.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Candidates Tab */}
                        {activeTab === 'candidates' && (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start max-w-6xl">
                                <section className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <h3 className="text-lg font-bold text-primary dark:text-white">
                                            Matching profiles
                                        </h3>
                                        <div className="flex items-center gap-3">
                                            {suggestedMatches.length > CANDIDATES_PREVIEW_LIMIT && (
                                                <Link
                                                    to={`/requirements/${id}/matching-profiles`}
                                                    className="text-xs font-bold text-primary dark:text-white hover:underline"
                                                >
                                                    View all ({suggestedMatches.length})
                                                </Link>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => refetchMatches()}
                                                className="text-xs font-bold text-primary/70 dark:text-white/70 hover:underline"
                                            >
                                                Refresh
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-500 mb-4">
                                        Scores compare candidate skills and resumes to this job description. Link a match to add them to this requirement.
                                    </p>
                                    <div className="space-y-2 max-h-[min(60vh,480px)] overflow-y-auto custom-scrollbar">
                                        {matchingLoading ? (
                                            <p className="text-sm text-slate-500 italic py-2">Finding matches…</p>
                                        ) : suggestedMatches.length === 0 ? (
                                            <p className="text-sm text-slate-500 italic py-2">
                                                No strong matches yet. Add primary skills and a job description, or upload candidate resumes.
                                            </p>
                                        ) : (
                                            previewMatches.map((m) => (
                                                <div
                                                    key={m.candidateId}
                                                    className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10"
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <Link
                                                                to={`/candidates/${m.candidateId}`}
                                                                className="text-sm font-bold text-primary dark:text-white truncate block hover:underline"
                                                            >
                                                                {m.candidate.name}
                                                            </Link>
                                                            <p className="text-[10px] text-slate-500 truncate">{m.candidate.role}</p>
                                                        </div>
                                                        <span
                                                            className={clsx(
                                                                'shrink-0 px-2 py-0.5 rounded-md text-[10px] font-black',
                                                                m.matchScore >= 70
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : m.matchScore >= 40
                                                                      ? 'bg-amber-100 text-amber-800'
                                                                      : 'bg-slate-200 text-slate-600'
                                                            )}
                                                        >
                                                            {m.matchScore}%
                                                        </span>
                                                    </div>
                                                    {m.linkedToOther && (
                                                        <p className="text-[10px] text-amber-700 mt-1">Linked to another job</p>
                                                    )}
                                                    <button
                                                        type="button"
                                                        disabled={linkCandidateMutation.isPending}
                                                        onClick={() => linkCandidateMutation.mutate(m.candidateId)}
                                                        className="mt-2 text-[10px] font-bold text-primary dark:text-white hover:underline disabled:opacity-50"
                                                    >
                                                        Link to requirement
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </section>

                                <section className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <h3 className="text-lg font-bold text-primary dark:text-white">
                                            Linked candidates ({candidates.length})
                                        </h3>
                                        <div className="flex items-center gap-3 flex-wrap justify-end">
                                            {candidates.length > CANDIDATES_PREVIEW_LIMIT && (
                                                <Link
                                                    to={`/requirements/${id}/linked-candidates`}
                                                    className="text-xs font-bold text-primary dark:text-white hover:underline"
                                                >
                                                    View all ({candidates.length})
                                                </Link>
                                            )}
                                            <Link
                                                to={`/candidates/new?requirementId=${id}`}
                                                className="text-xs font-bold text-primary dark:text-white hover:underline"
                                            >
                                                Add
                                            </Link>
                                            <Link
                                                to={`/pipeline/${id}`}
                                                className="text-xs font-bold text-primary/60 dark:text-white/60 hover:underline"
                                            >
                                                Pipeline
                                            </Link>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-500 mb-4">
                                        Candidates currently assigned to this requirement.
                                    </p>
                                    <ListSearchBar
                                        value={candidateSearch}
                                        onChange={setCandidateSearch}
                                        placeholder="Search linked candidates..."
                                        className="max-w-none mb-4"
                                    />
                                    <div className="space-y-2 max-h-[min(60vh,480px)] overflow-y-auto custom-scrollbar">
                                        {filteredCandidates.length === 0 ? (
                                            <p className="text-sm text-slate-500 italic py-2">
                                                {candidateSearch.trim()
                                                    ? 'No candidates match your search.'
                                                    : 'No candidates linked to this requirement yet.'}
                                            </p>
                                        ) : (
                                            previewLinked.map((c) => (
                                                <Link
                                                    key={c.id}
                                                    to={`/candidates/${c.id}`}
                                                    className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-primary/5 dark:hover:bg-white/10 transition-colors"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-primary dark:text-white truncate">
                                                            {c.name}
                                                        </p>
                                                        <p className="text-[10px] text-slate-500 truncate">{c.role}</p>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                                        {c.matchScore > 0 && (
                                                            <span
                                                                className={clsx(
                                                                    'px-2 py-0.5 rounded-md text-[10px] font-black',
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
                                            ))
                                        )}
                                    </div>
                                </section>
                            </div>
                        )}

                        {/* Version History Tab */}
                        {activeTab === 'versions' && (
                            <div className="max-w-4xl">
                                    <h3 className="text-lg font-bold text-primary dark:text-white mb-2">
                                        Version history
                                    </h3>
                                    <p className="text-sm text-slate-500 mb-6">
                                        Requirement edits and candidate links, with snapshots of linked candidates and
                                        matching profiles at each point in time.
                                    </p>
                                    <div className="space-y-4">
                                        {versionTimeline.map((ver, idx) => {
                                            const kind = versionKind(ver)
                                            const changer =
                                                users.find((u) => u.uid === ver.changedBy)?.name || ver.changedBy
                                            return (
                                                <div
                                                    key={`${ver.changedAt}-${idx}`}
                                                    className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6"
                                                >
                                                    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                                                        <div>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <h4 className="font-bold text-primary dark:text-white">
                                                                    Version {ver.version}
                                                                </h4>
                                                                <span
                                                                    className={clsx(
                                                                        'px-2 py-0.5 rounded-md text-[10px] font-black uppercase',
                                                                        kind === 'CANDIDATE_LINKED'
                                                                            ? 'bg-emerald-100 text-emerald-800'
                                                                            : 'bg-blue-100 text-blue-800'
                                                                    )}
                                                                >
                                                                    {kind === 'CANDIDATE_LINKED'
                                                                        ? 'Candidate linked'
                                                                        : 'Requirement updated'}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-slate-500 mt-1">
                                                                {changer} · {format(new Date(ver.changedAt), 'PPP p')}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {kind === 'CANDIDATE_LINKED' && (
                                                        <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30">
                                                            <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                                                                Linked:{' '}
                                                                {String(
                                                                    ver.changes.candidateName ??
                                                                        ver.linkedCandidates?.find(
                                                                            (lc) => lc.id === ver.changes.candidateId
                                                                        )?.name ??
                                                                        'Candidate'
                                                                )}
                                                            </p>
                                                            {typeof ver.changes.matchScore === 'number' && (
                                                                <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">
                                                                    Match score: {ver.changes.matchScore}%
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}

                                                    {kind === 'UPDATE' && Object.keys(ver.changes).length > 0 && (
                                                        <div className="mb-4 bg-slate-50 dark:bg-black/20 rounded-lg p-4 text-xs font-mono overflow-x-auto">
                                                            {Object.entries(ver.changes).map(([key, val]) => (
                                                                <div key={key} className="flex gap-2 py-0.5">
                                                                    <span className="text-slate-500 shrink-0">{key}:</span>
                                                                    <span className="text-primary dark:text-white break-all">
                                                                        {typeof val === 'string'
                                                                            ? val
                                                                            : JSON.stringify(val)}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-white/10">
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                                                Linked at this point ({ver.linkedCandidates?.length ?? 0})
                                                            </p>
                                                            {ver.linkedCandidates?.length ? (
                                                                <ul className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                                                                    {ver.linkedCandidates.map((lc) => (
                                                                        <li key={lc.id}>
                                                                            <Link
                                                                                to={`/candidates/${lc.id}`}
                                                                                className="text-xs font-bold text-primary dark:text-white hover:underline"
                                                                            >
                                                                                {lc.name}
                                                                            </Link>
                                                                            <span className="text-[10px] text-slate-500 ml-2">
                                                                                {lc.matchScore}% · {lc.status}
                                                                            </span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            ) : (
                                                                <p className="text-xs text-slate-500 italic">None linked</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                                                Top matches at this point ({ver.matchingProfiles?.length ?? 0})
                                                            </p>
                                                            {ver.matchingProfiles?.length ? (
                                                                <ul className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                                                                    {ver.matchingProfiles.map((mp) => (
                                                                        <li
                                                                            key={mp.candidateId}
                                                                            className="flex justify-between gap-2 text-xs"
                                                                        >
                                                                            <Link
                                                                                to={`/candidates/${mp.candidateId}`}
                                                                                className="font-bold text-primary dark:text-white hover:underline truncate"
                                                                            >
                                                                                {mp.name}
                                                                                {mp.alreadyLinked && (
                                                                                    <span className="text-emerald-600 ml-1">
                                                                                        (linked)
                                                                                    </span>
                                                                                )}
                                                                            </Link>
                                                                            <span className="font-black text-slate-500 shrink-0">
                                                                                {mp.matchScore}%
                                                                            </span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            ) : (
                                                                <p className="text-xs text-slate-500 italic">
                                                                    No snapshot recorded
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                        {versionTimeline.length === 0 && (
                                            <div className="text-center p-12 text-slate-500 rounded-2xl border border-dashed border-slate-200">
                                                No version history yet. Edit the requirement or link a candidate to
                                                create entries.
                                            </div>
                                        )}
                                    </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

        </div>
    )
}

export default RequirementDetail
