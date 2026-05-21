import React, { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Briefcase, MapPin, Building2, Hash, Loader2 } from 'lucide-react'
import { api } from '../../services/api'
import { ApiError } from '../../lib/apiClient'
import { useToastStore } from '../../store/toastStore'
import { Button } from '../../components/ui/Button'
import clsx from 'clsx'

const PortalJobDetail = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { addToast } = useToastStore()
    const [applied, setApplied] = useState(false)

    const { data: job, isLoading, isError, error } = useQuery({
        queryKey: ['portal-position', id],
        queryFn: () => api.portal.getPosition(id!),
        enabled: !!id,
    })

    const { data: portalMe } = useQuery({
        queryKey: ['portal-me'],
        queryFn: api.portal.getMe,
    })

    const alreadyOnThisJob =
        portalMe?.linked &&
        portalMe.candidate.requirementId === id

    const alreadyRegistered = portalMe?.linked === true

    const applyMutation = useMutation({
        mutationFn: () => api.portal.applyToPosition(id!),
        onSuccess: (result) => {
            setApplied(true)
            queryClient.invalidateQueries({ queryKey: ['portal-me'] })
            queryClient.invalidateQueries({ queryKey: ['portal-positions'] })
            if (result.alreadyApplied) {
                addToast('You have already applied for this position', 'info')
            } else {
                addToast('Application submitted successfully', 'success')
            }
            navigate('/portal/dashboard')
        },
        onError: (err: unknown) => {
            addToast(err instanceof ApiError ? err.message : 'Failed to apply', 'error')
        },
    })

    if (isLoading) {
        return (
            <div className="p-12 flex justify-center text-slate-500">
                <Loader2 className="animate-spin" size={28} />
            </div>
        )
    }

    if (isError || !job) {
        return (
            <div className="max-w-2xl mx-auto p-8 text-center space-y-4">
                <p className="text-red-600 font-medium">
                    {error instanceof ApiError ? error.message : 'Job not found'}
                </p>
                <Link to="/portal/dashboard" className="text-primary font-bold text-sm hover:underline inline-flex items-center gap-1">
                    <ArrowLeft size={16} /> Back to portal
                </Link>
            </div>
        )
    }

    const spotsLeft = Math.max(0, job.openings - job.filled)

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
            <Link
                to="/portal/dashboard"
                className="inline-flex items-center gap-2 text-sm font-bold text-primary/60 dark:text-white/60 hover:text-primary dark:hover:text-white"
            >
                <ArrowLeft size={16} /> Back to open positions
            </Link>

            <article className="bg-white dark:bg-white/5 rounded-2xl border border-primary/10 dark:border-white/10 p-6 md:p-8 shadow-sm space-y-6">
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-primary/50 dark:text-white/50 flex items-center gap-1.5">
                        <Hash size={14} /> Req ID: {job.jobCode}
                    </p>
                    <h1 className="text-2xl font-black text-primary dark:text-white mt-2">{job.title}</h1>
                    <div className="flex flex-wrap gap-3 mt-3 text-sm text-slate-600 dark:text-white/70">
                        {job.client && (
                            <span className="inline-flex items-center gap-1 font-medium">
                                <Building2 size={14} /> {job.client}
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                            <Briefcase size={14} /> {job.department}
                        </span>
                        {job.location && (
                            <span className="inline-flex items-center gap-1">
                                <MapPin size={14} /> {job.location}
                            </span>
                        )}
                    </div>
                </div>

                {job.description && (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                        <h2 className="text-sm font-bold uppercase text-primary/50 dark:text-white/50 mb-2">About the role</h2>
                        <p className="text-sm text-slate-700 dark:text-white/80 whitespace-pre-wrap leading-relaxed">
                            {job.description}
                        </p>
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-primary/10 dark:border-white/10">
                    <p className="text-sm font-medium text-slate-600 dark:text-white/70">
                        {spotsLeft > 0 ? (
                            <span>
                                <strong>{spotsLeft}</strong> opening{spotsLeft !== 1 ? 's' : ''} remaining
                            </span>
                        ) : (
                            <span className="text-amber-700">No openings listed — you may still apply</span>
                        )}
                    </p>
                    {job.priority && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary/10 text-primary">
                            {job.priority}
                        </span>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                        onClick={() => applyMutation.mutate()}
                        disabled={
                            applyMutation.isPending ||
                            applied ||
                            alreadyOnThisJob ||
                            (alreadyRegistered && !alreadyOnThisJob)
                        }
                        className={clsx(
                            (alreadyOnThisJob || alreadyRegistered) && 'opacity-70'
                        )}
                    >
                        {applyMutation.isPending
                            ? 'Submitting…'
                            : alreadyOnThisJob
                              ? 'Already applied'
                              : alreadyRegistered
                                ? 'Profile already registered'
                                : 'Apply for this position'}
                    </Button>
                </div>
                {alreadyOnThisJob && (
                    <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                        Your profile is linked to this requisition ({job.jobCode}).
                    </p>
                )}
                {alreadyRegistered && !alreadyOnThisJob && (
                    <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                        You already have a candidate profile in the system. View your dashboard for
                        application status.
                    </p>
                )}
            </article>
        </div>
    )
}

export default PortalJobDetail
