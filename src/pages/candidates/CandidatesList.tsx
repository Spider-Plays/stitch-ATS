import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Filter, Plus, UserPlus, Briefcase, Mail, Calendar, LayoutDashboard } from 'lucide-react'
import { api } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import { Candidate } from '../../types'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { ActionsMenu } from '../../components/ui/ActionsMenu'
import { useToastStore } from '../../store/toastStore'
import { ApiError } from '../../lib/apiClient'

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
}

const statusColors: Record<string, string> = {
    APPLIED: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
    SCREENING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    INTERVIEW: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    OFFER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    HIRED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
}



const CandidatesList = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { addToast } = useToastStore()
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('ALL')
    const isAdmin = user?.role === 'ADMIN'

    const { data: candidates = [], isLoading } = useQuery({
        queryKey: ['candidates'],
        queryFn: api.candidates.list
    })

    const filteredCandidates = candidates.filter(candidate => {
        const q = searchTerm.toLowerCase()
        const matchesSearch =
            candidate.name.toLowerCase().includes(q) ||
            candidate.email.toLowerCase().includes(q) ||
            candidate.role.toLowerCase().includes(q) ||
            (candidate.jobTitle?.toLowerCase().includes(q) ?? false) ||
            (candidate.reqId?.toLowerCase().includes(q) ?? false) ||
            (candidate.client?.toLowerCase().includes(q) ?? false) ||
            (candidate.recruiterName?.toLowerCase().includes(q) ?? false) ||
            (candidate.source?.toLowerCase().includes(q) ?? false)
        const matchesStatus = statusFilter === 'ALL' || candidate.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const canCreate = ['ADMIN', 'HR_HEAD', 'HR_MANAGER', 'RECRUITER'].includes(user?.role || '')

    const handleDeleteCandidate = async (candidate: Candidate) => {
        if (
            !confirm(
                `Permanently delete ${candidate.name}? All interviews, offers, and feedback will be removed.`
            )
        ) {
            return
        }
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
            onClick: () =>
                navigate(
                    candidate.requirementId
                        ? `/pipeline/${candidate.requirementId}`
                        : '/pipeline'
                ),
        },
        {
            id: 'interview',
            label: 'Schedule interview',
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

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-primary dark:text-white tracking-tight">Candidates</h1>
                    <p className="text-primary/60 dark:text-white/60 font-medium mt-1">Manage your talent pool and applications</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link to="/pipeline">
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-white/5 border border-primary/10 dark:border-white/10 text-primary dark:text-white rounded-xl font-bold text-sm hover:bg-primary/5 dark:hover:bg-white/10 transition-all">
                            <LayoutDashboard size={18} />
                            <span>Pipeline View</span>
                        </button>
                    </Link>
                    {canCreate && (
                        <Link to="/candidates/new">
                            <button className="flex items-center gap-2 px-4 py-2.5 bg-primary dark:bg-white text-white dark:text-primary rounded-xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 dark:shadow-none">
                                <UserPlus size={18} />
                                <span>Add Candidate</span>
                            </button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-white/5 p-4 rounded-2xl border border-primary/10 dark:border-white/10 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40 dark:text-white/40" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, email, req ID, client, job title..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-medium text-primary dark:text-white placeholder:text-primary/30"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <div className="icon-container bg-primary/5 dark:bg-white/5 p-2 rounded-lg text-primary dark:text-white">
                        <Filter size={18} />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2.5 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-bold text-sm text-primary dark:text-white cursor-pointer"
                    >
                        <option value="ALL">All Status</option>
                        <option value="APPLIED">Applied</option>
                        <option value="SCREENING">Screening</option>
                        <option value="INTERVIEW">Interview</option>
                        <option value="OFFER">Offer</option>
                        <option value="HIRED">Hired</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-white/5 rounded-2xl border border-primary/10 dark:border-white/10 shadow-sm overflow-visible">
                {isLoading ? (
                    <div className="p-12 text-center text-primary/50 dark:text-white/50">
                        Loading candidates...
                    </div>
                ) : filteredCandidates.length > 0 ? (
                    <div className="overflow-x-auto overflow-y-visible">
                        <table className="w-full">
                            <thead className="bg-primary/[0.02] dark:bg-white/[0.02] border-b border-primary/10 dark:border-white/10">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-primary/50 dark:text-white/50 uppercase tracking-wider">Candidate</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-primary/50 dark:text-white/50 uppercase tracking-wider">Req ID</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-primary/50 dark:text-white/50 uppercase tracking-wider">Client</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-primary/50 dark:text-white/50 uppercase tracking-wider">Job title</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-primary/50 dark:text-white/50 uppercase tracking-wider">Recruiter</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-primary/50 dark:text-white/50 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-primary/50 dark:text-white/50 uppercase tracking-wider">Match</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-primary/50 dark:text-white/50 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-primary/50 dark:text-white/50 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <motion.tbody
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="divide-y divide-primary/5 dark:divide-white/5"
                            >
                                {filteredCandidates.map(candidate => (
                                    <motion.tr
                                        variants={itemVariants}
                                        key={candidate.id}
                                        className="hover:bg-primary/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
                                        onClick={() => navigate(`/candidates/${candidate.id}`)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-xl bg-primary/10 dark:bg-white/10 flex items-center justify-center font-bold text-primary dark:text-white">
                                                    {candidate.avatar ? (
                                                        <img src={candidate.avatar} alt={candidate.name} className="size-full object-cover rounded-xl" />
                                                    ) : (
                                                        candidate.name.charAt(0)
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-primary dark:text-white">{candidate.name}</div>
                                                    <div className="text-xs font-medium text-primary/50 dark:text-white/50 flex items-center gap-1">
                                                        <Mail size={12} />
                                                        {candidate.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-mono font-bold text-primary/80 dark:text-white/80">
                                                {candidate.reqId ?? '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-primary/70 dark:text-white/70">
                                            {candidate.client ?? '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-medium text-primary/80 dark:text-white/80 max-w-[200px]">
                                                <Briefcase size={16} className="text-primary/40 dark:text-white/40 shrink-0" />
                                                <span className="truncate">{candidate.jobTitle ?? candidate.role}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-primary/70 dark:text-white/70">
                                            {candidate.recruiterName ?? (
                                                candidate.source === 'Candidate Portal' ? (
                                                    <span className="text-primary/40 italic">Self-applied</span>
                                                ) : (
                                                    '—'
                                                )
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={clsx(
                                                "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                                                statusColors[candidate.status]?.replace('bg-', 'bg-opacity-10 border-') || 'bg-slate-100 text-slate-700 border-slate-200'
                                            )}>
                                                {candidate.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5">
                                                <div className="relative size-8 rounded-full border-2 border-primary/10 dark:border-white/10 flex items-center justify-center">
                                                    <span className="text-[10px] font-bold text-primary dark:text-white">{candidate.matchScore}%</span>
                                                </div>
                                                <div className="h-1.5 w-12 bg-primary/10 dark:bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className={clsx("h-full rounded-full", candidate.matchScore >= 80 ? "bg-green-500" : "bg-primary")}
                                                        style={{ width: `${candidate.matchScore}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-primary/60 dark:text-white/60">
                                                <Calendar size={14} />
                                                {new Date(candidate.appliedDate).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                            <ActionsMenu
                                                items={candidateMenuItems(candidate)}
                                                aria-label={`Actions for ${candidate.name}`}
                                            />
                                        </td>
                                    </motion.tr>
                                ))}
                            </motion.tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-24">
                        <div className="size-20 bg-primary/[0.02] dark:bg-white/[0.02] rounded-full flex items-center justify-center mx-auto mb-6 text-primary/20 dark:text-white/20 border-2 border-dashed border-primary/10 dark:border-white/10">
                            <LayoutDashboard size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-primary dark:text-white">No candidates found</h3>
                        <p className="text-primary/50 dark:text-white/50 mt-1 max-w-xs mx-auto">Try adjusting your filters or add a new candidate to your pipeline.</p>
                        {canCreate && (
                            <Link to="/candidates/new" className="mt-6 inline-block">
                                <button className="px-6 py-2.5 bg-primary dark:bg-white text-white dark:text-primary rounded-xl font-bold text-sm hover:opacity-90 transition-all">
                                    Add First Candidate
                                </button>
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default CandidatesList
