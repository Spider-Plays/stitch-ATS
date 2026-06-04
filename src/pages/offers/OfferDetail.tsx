import React from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FileText, Check, RotateCw, Lock, DollarSign, Send, Edit, Download, History, MessageSquare, AlertTriangle, Clock, X } from 'lucide-react'
import { api } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import clsx from 'clsx'

const OfferDetail = () => {
    const { id } = useParams<{ id: string }>()
    const { user } = useAuth()
    const queryClient = useQueryClient()

    const { data: offer, isLoading } = useQuery({
        queryKey: ['offer', id],
        queryFn: () => api.offers.get(id!)
    })

    const { data: candidate } = useQuery({
        queryKey: ['candidate', offer?.candidateId],
        queryFn: () => api.candidates.get(offer!.candidateId),
        enabled: !!offer?.candidateId
    })

    const isRestricted = !['ADMIN', 'HR_HEAD', 'HR_MANAGER'].includes(user?.role || '')

    const updateStatusMutation = useMutation({
        mutationFn: (status: any) => api.offers.update(id!, { status }, user?.uid!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['offer', id] })
        }
    })

    if (isLoading) return <div className="p-8 text-center">Loading offer details...</div>
    if (!offer) return <div className="p-8 text-center">Offer not found.</div>

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {isRestricted && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3 text-amber-800 dark:text-amber-200">
                    <Lock size={20} />
                    <div className="text-sm">
                        <p className="font-bold">Restricted View (Non-HR Role)</p>
                        <p className="opacity-80">Sensitive compensation and equity data is masked.</p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Confidential</span>
                        <span className="text-muted-foreground text-xs font-medium">OFFER-{offer.id.slice(0, 8)}</span>
                    </div>
                    <h1 className="text-page-title">{candidate?.name || 'Loading...'}</h1>
                    <p className="text-page-desc">{candidate?.role} • {candidate?.email}</p>
                </div>
                <div className="flex gap-3">
                    {offer.status === 'DRAFT' && (
                        <button
                            onClick={() => updateStatusMutation.mutate('APPROVAL_PENDING')}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-sm"
                        >
                            <Send size={18} /> Submit for Approval
                        </button>
                    )}

                    {offer.status === 'APPROVAL_PENDING' && (
                        ['ADMIN', 'HR_HEAD'].includes(user?.role || '') ? (
                            <>
                                <button
                                    onClick={() => updateStatusMutation.mutate('DRAFT')}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors"
                                >
                                    <X size={18} /> Reject
                                </button>
                                <button
                                    onClick={() => updateStatusMutation.mutate('APPROVED')}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-all shadow-sm"
                                >
                                    <Check size={18} /> Approve Offer
                                </button>
                            </>
                        ) : (
                            <span className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-xl font-bold text-xs uppercase tracking-wider">
                                <Clock size={16} /> Pending Approval
                            </span>
                        )
                    )}

                    {offer.status === 'APPROVED' && (
                        <button
                            onClick={() => updateStatusMutation.mutate('SENT')}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-sm"
                        >
                            <Send size={18} /> Send Offer
                        </button>
                    )}

                    {offer.status === 'SENT' && !isRestricted && (
                        <>
                            <button
                                onClick={() => updateStatusMutation.mutate('ACCEPTED')}
                                className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 border border-green-200 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-green-200"
                            >
                                <Check size={16} /> Mark Accepted
                            </button>
                            <button className="flex items-center gap-2 px-6 py-2.5 app-card text-primary dark:text-white rounded-xl font-bold text-sm hover:bg-primary/5 dark:hover:bg-white/10 transition-colors">
                                <RotateCw size={18} /> Negotiate
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Progress Stepper */}
            <div className="app-card rounded-xl p-8 shadow-sm overflow-hidden">
                <div className="relative flex justify-between">
                    <div className="absolute top-5 left-0 w-full h-0.5 bg-primary/10 dark:bg-white/10 -z-0"></div>
                    {/* Simplified Stepper for brevity, can be expanded */}
                    {['DRAFT', 'SENT', 'NEGOTIATION', 'ACCEPTED'].map((step, idx) => {
                        const stepIndex = ['DRAFT', 'SENT', 'NEGOTIATION', 'ACCEPTED'].indexOf(offer.status)
                        const isCompleted = idx <= stepIndex
                        return (
                            <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                                <div className={clsx(
                                    "size-10 rounded-full flex items-center justify-center border-4 border-white dark:border-black font-bold text-sm transition-colors",
                                    isCompleted ? "bg-primary text-primary-foreground" : "bg-primary/10 dark:bg-white/10 text-muted-foreground"
                                )}>
                                    {idx + 1}
                                </div>
                                <span className={clsx("text-xs font-bold uppercase tracking-widest", isCompleted ? "text-primary dark:text-white" : "text-muted-foreground")}>{step}</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Details */}
                <div className="lg:col-span-8 space-y-8">
                    <section>
                        <h3 className="text-primary dark:text-white text-lg font-bold mb-4 flex items-center gap-2">
                            <DollarSign className="text-primary/60 dark:text-white/60" /> Compensation Details
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="app-card p-5 rounded-xl shadow-sm">
                                <p className="text-primary/50 dark:text-white/50 text-xs font-bold uppercase tracking-wider mb-1">Base Salary</p>
                                <p className="text-primary dark:text-white text-2xl font-black">
                                    {isRestricted ? (
                                        <span className="flex items-center gap-2">•••••• <Lock size={14} className="opacity-40" /></span>
                                    ) : (
                                        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumSignificantDigits: 3 }).format(offer.baseSalary)
                                    )}
                                </p>
                                <p className="text-muted-foreground text-xs mt-2">Annual • Paid Monthly</p>
                            </div>
                            <div className="app-card p-5 rounded-xl shadow-sm">
                                <p className="text-primary/50 dark:text-white/50 text-xs font-bold uppercase tracking-wider mb-1">Equity (RSUs)</p>
                                <p className="text-primary dark:text-white text-2xl font-black">
                                    {isRestricted ? (
                                        <span className="flex items-center gap-2">•••••• <Lock size={14} className="opacity-40" /></span>
                                    ) : (
                                        offer.equity?.toLocaleString() || '-'
                                    )}
                                </p>
                                <p className="text-muted-foreground text-xs mt-2">4-year Vesting • 1yr Cliff</p>
                            </div>
                            <div className="app-card p-5 rounded-xl shadow-sm">
                                <p className="text-primary/50 dark:text-white/50 text-xs font-bold uppercase tracking-wider mb-1">Target Bonus</p>
                                <p className="text-primary dark:text-white text-2xl font-black">
                                    {isRestricted ? (
                                        <span className="flex items-center gap-2">••% <Lock size={14} className="opacity-40" /></span>
                                    ) : (
                                        (offer.bonus || 0) + '%'
                                    )}
                                </p>
                                <p className="text-muted-foreground text-xs mt-2">Performance-based</p>
                            </div>
                        </div>
                    </section>

                    {/* Preview */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-primary dark:text-white text-lg font-bold flex items-center gap-2">
                                <FileText className="text-primary/60 dark:text-white/60" /> Offer Letter Preview
                            </h3>
                            <button
                                onClick={() => window.print()}
                                className="flex items-center gap-2 px-4 py-2 app-card text-primary dark:text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-primary/5 dark:hover:bg-white/10 transition-colors"
                            >
                                <Download size={16} /> Download
                            </button>
                        </div>
                        <div className="bg-white dark:bg-white/5 border-2 border-dashed border-primary/10 dark:border-white/10 rounded-xl p-10 min-h-[400px]">
                            {/* Simple preview */}
                            <div className="prose dark:prose-invert max-w-none">
                                <h1 className="text-center">OFFER OF EMPLOYMENT</h1>
                                <p>Dear {candidate?.name || 'Candidate'},</p>
                                <p>We are pleased to offer you the position of {candidate?.role}...</p>
                                {isRestricted ? (
                                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-center text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 rounded font-bold">
                                        Content hidden due to restriction
                                    </div>
                                ) : (
                                    <>
                                        <p><strong>Base Salary:</strong> ${offer.baseSalary}</p>
                                        <p><strong>Equity:</strong> {offer.equity} RSUs</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </section>
                </div>

                {/* Audit Log */}
                <div className="lg:col-span-4 space-y-6">
                    <section className="app-card rounded-xl overflow-hidden shadow-sm flex flex-col h-[600px]">
                        <div className="p-4 border-b border-primary/10 dark:border-white/10 bg-primary/5 dark:bg-white/5">
                            <h3 className="text-primary dark:text-white text-sm font-bold flex items-center gap-2">
                                <History size={18} /> History & Audit Log
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {(offer.history || []).map(item => (
                                <div key={item.id} className="relative pl-6 border-l-2 border-primary/10 dark:border-white/10 pb-1">
                                    <div className="absolute -left-[9px] top-0 size-4 rounded-full bg-primary dark:bg-white border-4 border-white dark:border-black"></div>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">{new Date(item.date).toLocaleString()}</p>
                                    <p className="text-sm font-bold text-primary dark:text-white">{item.action}</p>
                                    <p className="text-xs text-primary/60 dark:text-white/60">{item.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}

export default OfferDetail
