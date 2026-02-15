import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DollarSign, FileText, CheckCircle, User, Briefcase } from 'lucide-react'
import { api } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'

const schema = z.object({
    candidateId: z.string().min(1, "Candidate is required"),
    requirementId: z.string().min(1, "Job Requirement is required"),
    baseSalary: z.number().min(1000, "Base salary must be at least 1000"),
    equity: z.number().optional(),
    bonus: z.number().optional(),
    letterContent: z.string().optional()
})

type OfferFormValues = z.infer<typeof schema>

const NewOffer = () => {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { user } = useAuth()

    const { register, handleSubmit, control, watch, formState: { errors } } = useForm<OfferFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            baseSalary: 0,
            equity: 0,
            bonus: 0
        }
    })

    const { data: candidates = [] } = useQuery({ queryKey: ['candidates'], queryFn: api.candidates.list })
    const { data: requirements = [] } = useQuery({ queryKey: ['requirements'], queryFn: api.requirements.list })

    const createMutation = useMutation({
        mutationFn: (data: OfferFormValues) => api.offers.create({
            ...data,
            createdBy: user?.uid!,
            status: 'DRAFT',
            history: [] // Handled by service now, but type requires it in Omit? No, service handles it if I updated service signature properly.
            // Wait, service implementation ADDS history. But the type Omit<Offer, 'id' | 'createdAt'> assumes history is passed?
            // Actually service implementation: create: async (data: Omit<Offer, 'id' | 'createdAt'>)
            // But 'history' IS in Offer. So I must pass it or conform to type.
            // I'll update service to Omit 'history' too or just pass empty array.
            // Service overwrites it anyway.
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['offers'] })
            navigate('/offers')
        }
    })

    const onSubmit = (data: OfferFormValues) => {
        // @ts-ignore - Service handles history overwrite
        createMutation.mutate({ ...data, history: [] })
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/offers')} className="p-2 hover:bg-primary/5 dark:hover:bg-white/5 rounded-full text-primary/60 dark:text-white/40 hover:text-primary dark:hover:text-white transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div>
                    <h1 className="text-2xl font-black text-primary dark:text-white tracking-tight">Create New Offer</h1>
                    <p className="text-sm font-medium text-primary/60 dark:text-white/60">Draft a compensation package for a candidate.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <section className="bg-white dark:bg-white/5 p-8 rounded-2xl border border-primary/10 dark:border-white/10 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/20 dark:bg-white/20"></div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex items-center justify-center size-8 rounded-full bg-primary/10 dark:bg-white/10 text-primary dark:text-white font-bold text-sm">1</div>
                        <h2 className="text-xl font-bold text-primary dark:text-white">Candidate Details</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider block">Candidate</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/30" size={18} />
                                <select
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-bold text-primary dark:text-white appearance-none"
                                    {...register('candidateId')}
                                >
                                    <option value="">Select Candidate</option>
                                    {candidates.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            {errors.candidateId && <p className="text-xs font-bold text-red-500">{errors.candidateId.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider block">Job Requirement</label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/30" size={18} />
                                <select
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-bold text-primary dark:text-white appearance-none"
                                    {...register('requirementId')}
                                >
                                    <option value="">Select Job</option>
                                    {requirements.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                                </select>
                            </div>
                            {errors.requirementId && <p className="text-xs font-bold text-red-500">{errors.requirementId.message}</p>}
                        </div>
                    </div>
                </section>

                <section className="bg-white dark:bg-white/5 p-8 rounded-2xl border border-primary/10 dark:border-white/10 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/20 dark:bg-white/20"></div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex items-center justify-center size-8 rounded-full bg-primary/10 dark:bg-white/10 text-primary dark:text-white font-bold text-sm">2</div>
                        <h2 className="text-xl font-bold text-primary dark:text-white">Compensation</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider block">Base Salary (Annual)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/30" size={18} />
                                <input
                                    type="number"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-bold text-primary dark:text-white"
                                    placeholder="e.g. 120000"
                                    {...register('baseSalary', { valueAsNumber: true })}
                                />
                            </div>
                            {errors.baseSalary && <p className="text-xs font-bold text-red-500">{errors.baseSalary.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider block">Equity (RSUs)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    className="w-full pl-4 pr-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-bold text-primary dark:text-white"
                                    placeholder="e.g. 5000"
                                    {...register('equity', { valueAsNumber: true })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider block">Target Bonus (%)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    className="w-full pl-4 pr-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-bold text-primary dark:text-white"
                                    placeholder="e.g. 15"
                                    {...register('bonus', { valueAsNumber: true })}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={createMutation.isPending}
                        className="flex items-center gap-2 px-8 py-4 bg-primary dark:bg-white text-white dark:text-primary rounded-xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 dark:shadow-none"
                    >
                        {createMutation.isPending ? 'Drafting...' : 'Create Draft Offer'}
                        {!createMutation.isPending && <CheckCircle size={18} />}
                    </button>
                </div>
            </form>
        </div>
    )
}

export default NewOffer
