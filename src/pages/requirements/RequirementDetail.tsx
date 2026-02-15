import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { RequirementStatus, User } from '../../types'
import { useAuth } from '../../hooks/useAuth'
import clsx from 'clsx'
import { format } from 'date-fns'
import { Check, X, Edit, Clock, MapPin, Users, AlertCircle, Lock, Monitor, Briefcase, FileText, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const TABS = [
    { id: 'details', label: 'Requirement Details' },
    { id: 'recruiters', label: 'Recruiter Assignment' },
    { id: 'history', label: 'Approval History' },
    { id: 'versions', label: 'Version History' }
]

const RequirementDetail = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState('details')
    const [selectedRecruiter, setSelectedRecruiter] = useState('')

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

    // Derived Data
    const recruiters = users.filter(u => ['RECRUITER', 'HR_MANAGER', 'Admin'].includes(u.role))
    const hiringManager = users.find(u => u.uid === requirement?.hiringManager)
    const isHr = ['ADMIN', 'HR_MANAGER', 'HR_HEAD'].includes(user?.role || '')

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

    const assignRecruiterMutation = useMutation({
        mutationFn: (recruiterId: string) =>
            api.requirements.assignRecruiter(id!, recruiterId, requirement?.recruiters || []),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requirement', id] })
            setSelectedRecruiter('')
        }
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
    const isClosed = requirement.status === 'CLOSED'
    const isRejected = requirement.status === 'REJECTED'

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

                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm flex items-center gap-2">
                        {requirement.department} Department <span className="opacity-30">•</span> ID: {requirement.id}
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

                    {isHr && isLive && (
                        <button
                            onClick={() => handleApproval('CLOSE')}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white text-sm font-bold shadow-sm transition-all active:scale-95"
                        >
                            <Lock size={16} /> Close
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
                                    {/* Job Description Card */}
                                    <section className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-sm">
                                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-primary dark:text-white">
                                            <FileText size={20} className="text-primary/60 dark:text-white/60" /> Job Description
                                        </h3>
                                        <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed">
                                            <p className="whitespace-pre-wrap">{requirement.description || "No description provided."}</p>
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
                                                <p className={clsx("text-sm font-bold", isLive ? "text-white" : "text-white/60")}>
                                                    {isClosed ? 'Closed' : isRejected ? 'Rejected' : 'Live on Job Board'}
                                                </p>
                                                {isLive ? <p className="text-[10px] text-white/50">Active</p> : <p className="text-[10px] text-white/30">Upcoming</p>}
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
                                        <div className="flex gap-2">
                                            <select
                                                value={selectedRecruiter}
                                                onChange={(e) => setSelectedRecruiter(e.target.value)}
                                                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-transparent text-sm"
                                            >
                                                <option value="">Select Recruiter...</option>
                                                {recruiters.map(r => (
                                                    <option key={r.uid} value={r.uid}>{r.name}</option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={() => selectedRecruiter && assignRecruiterMutation.mutate(selectedRecruiter)}
                                                disabled={!selectedRecruiter}
                                                className="px-4 py-2 bg-primary dark:bg-white text-white dark:text-primary rounded-lg text-sm font-bold disabled:opacity-50"
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

                        {/* Version History Tab */}
                        {activeTab === 'versions' && (
                            <div className="space-y-4 max-w-3xl">
                                {requirement.versions?.map((ver, idx) => (
                                    <div key={idx} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="font-bold text-primary dark:text-white">Version {ver.version}</h4>
                                                <p className="text-xs text-slate-500">
                                                    Changed by {users.find(u => u.uid === ver.changedBy)?.name || ver.changedBy} on {format(new Date(ver.changedAt), 'PPP p')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-black/20 rounded-lg p-4 text-xs font-mono overflow-x-auto">
                                            {Object.keys(ver.changes).map(key => (
                                                <div key={key} className="flex gap-2">
                                                    <span className="text-slate-500">{key}:</span>
                                                    <span className="text-primary dark:text-white truncate max-w-md">
                                                        {JSON.stringify(ver.changes[key])}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {!requirement.versions?.length && (
                                    <div className="text-center p-12 text-slate-500">No version history available.</div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

        </div>
    )
}

export default RequirementDetail
