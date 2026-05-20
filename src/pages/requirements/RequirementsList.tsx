import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import { RequirementStatus } from '../../types'
import clsx from 'clsx'
import { motion } from 'framer-motion'

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

const RequirementsList = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<RequirementStatus | 'ALL'>('ALL')

    const { data: requirements = [], isLoading } = useQuery({
        queryKey: ['requirements'],
        queryFn: api.requirements.list
    })

    const { data: candidates = [] } = useQuery({
        queryKey: ['candidates'],
        queryFn: api.candidates.list
    })

    const filteredRequirements = requirements.filter(req => {
        const matchesSearch = req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.department.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const canCreate = ['ADMIN', 'HR_HEAD', 'HR_MANAGER'].includes(user?.role || '')

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'LIVE': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            case 'PENDING_APPROVAL': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            case 'DRAFT': return 'bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-white/60'
            case 'CLOSED': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            default: return 'bg-primary/10 text-primary dark:text-white/60'
        }
    }

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'CRITICAL': return { icon: 'arrow_upward', color: 'text-red-600 dark:text-red-400', label: 'Critical' }
            case 'HIGH': return { icon: 'arrow_upward', color: 'text-orange-600 dark:text-orange-400', label: 'High' }
            case 'MEDIUM': return { icon: 'horizontal_rule', color: 'text-amber-600 dark:text-amber-400', label: 'Medium' }
            case 'LOW': return { icon: 'arrow_downward', color: 'text-primary/40 dark:text-white/40', label: 'Low' }
            default: return { icon: 'horizontal_rule', color: 'text-primary/40', label: 'Normal' }
        }
    }

    if (isLoading) return <div className="p-8 text-center text-primary/60 animate-pulse">Loading requirement vault...</div>

    const counts = {
        ALL: requirements.length,
        LIVE: requirements.filter(r => r.status === 'LIVE').length,
        PENDING_APPROVAL: requirements.filter(r => r.status === 'PENDING_APPROVAL').length,
        DRAFT: requirements.filter(r => r.status === 'DRAFT').length
    }

    const TABS = [
        { id: 'ALL', label: 'All Jobs' },
        { id: 'LIVE', label: 'Active' },
        { id: 'PENDING_APPROVAL', label: 'Pending Approval' },
        { id: 'DRAFT', label: 'Drafts' }
    ] as const

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-primary dark:text-white text-3xl font-black leading-tight tracking-tight">Job Requirements</h1>
                    <p className="text-primary/60 dark:text-white/60 text-base font-medium">Manage and track your active hiring pipelines and requirements.</p>
                </div>
                {canCreate && (
                    <Link to="/requirements/new">
                        <button className="flex items-center gap-2 px-6 py-3 bg-primary dark:bg-white text-white dark:text-primary rounded-lg font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-sm">
                            <span className="material-symbols-outlined !text-xl">add_circle</span>
                            <span>Post New Job</span>
                        </button>
                    </Link>
                )}
            </div>

            <div className="bg-white dark:bg-white/5 border border-primary/10 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
                <div className="flex border-b border-primary/10 dark:border-white/10 bg-primary/5 dark:bg-white/5 overflow-x-auto scrollbar-hide">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setStatusFilter(tab.id as RequirementStatus | 'ALL')}
                            className={clsx(
                                "px-6 py-4 text-sm font-bold transition-all whitespace-nowrap border-b-2",
                                statusFilter === tab.id
                                    ? "text-primary dark:text-white border-primary dark:border-white"
                                    : "text-primary/50 dark:text-white/40 border-transparent hover:text-primary dark:hover:text-white"
                            )}
                        >
                            {tab.label}
                            <span className={clsx(
                                "ml-2 px-1.5 py-0.5 rounded-full text-[10px]",
                                statusFilter === tab.id ? "bg-primary/10 dark:bg-white/10 text-primary dark:text-white" : "bg-primary/5 dark:bg-white/5"
                            )}>
                                {counts[tab.id as keyof typeof counts] || 0}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="p-4 flex flex-wrap gap-4 items-center">
                    <div className="relative flex-1 min-w-[300px]">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/40">search</span>
                        <input
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-primary/10 focus:border-primary focus:ring-0 text-sm bg-primary/5 dark:bg-white/5 text-primary dark:text-white placeholder:text-primary/30"
                            placeholder="Search by job title, department, or recruiter..."
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/10 text-sm font-semibold text-primary/70 dark:text-white/60 hover:bg-primary/5 transition-colors">
                            <span className="material-symbols-outlined !text-lg">filter_list</span>
                            <span>Filters</span>
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-primary/5 dark:bg-white/5 border-b border-primary/10 dark:border-white/10">
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-primary/60 dark:text-white/40">Job Title</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-primary/60 dark:text-white/40">Department</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-primary/60 dark:text-white/40 text-center">Status</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-primary/60 dark:text-white/40">Priority</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-primary/60 dark:text-white/40">Openings</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-primary/60 dark:text-white/40">Recruiters</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-primary/60 dark:text-white/40 text-right">Actions</th>
                            </tr>
                        </thead>
                        <motion.tbody
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="divide-y divide-primary/5 dark:divide-white/5"
                        >
                            {filteredRequirements.map((req) => {
                                const priority = getPriorityIcon(req.priority || 'MEDIUM')
                                const fillPercentage = Math.round((req.filled / req.openings) * 100)
                                return (
                                    <motion.tr
                                        variants={itemVariants}
                                        key={req.id}
                                        className="hover:bg-primary/5 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                                        onClick={() => navigate(`/requirements/${req.id}`)}
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-primary dark:text-white group-hover:text-primary transition-colors">{req.title}</span>
                                                <span className="text-xs text-primary/40 dark:text-white/40 font-medium">Posted {new Date(req.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-sm font-medium text-primary/80 dark:text-white/80">{req.department}</td>
                                        <td className="px-6 py-5">
                                            <div className="flex justify-center">
                                                <span className={clsx("px-3 py-1 rounded-full text-[10px] font-black tracking-widest", getStatusStyles(req.status))}>
                                                    {req.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className={clsx("flex items-center gap-1.5 font-bold text-sm", priority.color)}>
                                                <span className="material-symbols-outlined !text-lg">{priority.icon}</span>
                                                {priority.label}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="w-full max-w-[100px] flex flex-col gap-1.5">
                                                <div className="flex justify-between text-[10px] font-bold text-primary/60 dark:text-white/40">
                                                    <span>{req.filled} of {req.openings}</span>
                                                    <span>{fillPercentage}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-primary/10 dark:bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className={clsx("h-full transition-all duration-1000", fillPercentage === 100 ? "bg-green-500" : "bg-primary dark:bg-primary-light")}
                                                        style={{ width: `${fillPercentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex -space-x-2">
                                                {(req.recruiters || []).slice(0, 3).map((recId: string, idx: number) => (
                                                    <div key={idx} className="size-8 rounded-full border-2 border-white dark:border-background-dark overflow-hidden bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary dark:text-white/60">
                                                        {recId.charAt(0).toUpperCase()}
                                                    </div>
                                                ))}
                                                {(req.recruiters || []).length > 3 && (
                                                    <div className="size-8 rounded-full border-2 border-white dark:border-background-dark flex items-center justify-center bg-primary/5 dark:bg-white/5 text-[10px] font-bold text-primary/60 dark:text-white/40">
                                                        +{(req.recruiters || []).length - 3}
                                                    </div>
                                                )}
                                                {(req.recruiters || []).length === 0 && (
                                                    <div className="size-8 rounded-full border-2 border-dashed border-primary/20 flex items-center justify-center text-[10px] text-primary/40 font-bold">?</div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                                            <Link to={`/pipeline/${req.id}`} className="inline-flex items-center px-3 py-1 bg-primary/5 dark:bg-white/5 text-[10px] font-bold text-primary dark:text-white/60 rounded uppercase tracking-wider hover:bg-primary hover:text-white transition-all mr-2">Pipeline</Link>
                                            <button className="text-primary/40 hover:text-primary dark:hover:text-white transition-colors align-middle">
                                                <span className="material-symbols-outlined">more_vert</span>
                                            </button>
                                        </td>
                                    </motion.tr>
                                )
                            })}
                        </motion.tbody>
                    </table>
                </div>

                {filteredRequirements.length === 0 && (
                    <div className="text-center py-20 bg-primary/[0.01] dark:bg-white/[0.01]">
                        <span className="material-symbols-outlined !text-6xl text-primary/10 dark:text-white/10 mb-4">folder_off</span>
                        <h3 className="text-lg font-bold text-primary/60 dark:text-white/40">No requirements found</h3>
                        <p className="text-sm text-primary/40 dark:text-white/20">Try adjusting your filters or search terms.</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                <div className="p-6 bg-white dark:bg-white/5 border border-primary/10 dark:border-white/10 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-primary/60 dark:text-white/40">Average Fill Time</span>
                        <span className="material-symbols-outlined text-primary/30 dark:text-white/20">timer</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-primary dark:text-white">—</span>
                        <span className="text-xs font-bold text-primary/40 dark:text-white/40">Not enough data</span>
                    </div>
                </div>
                <div className="p-6 bg-white dark:bg-white/5 border border-primary/10 dark:border-white/10 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-primary/60 dark:text-white/40">Total Candidates</span>
                        <span className="material-symbols-outlined text-primary/30 dark:text-white/20">groups</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-primary dark:text-white">{candidates.length}</span>
                        <span className="text-xs font-bold text-primary/40 dark:text-white/40">In pipeline</span>
                    </div>
                </div>
                <div className="p-6 bg-white dark:bg-white/5 border border-primary/10 dark:border-white/10 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-primary/60 dark:text-white/40">Live Postings</span>
                        <span className="material-symbols-outlined text-primary/30 dark:text-white/20">bolt</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-primary dark:text-white">{counts.LIVE}</span>
                        <span className="text-xs font-bold text-primary/40 dark:text-white/40">Real-time status</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RequirementsList
