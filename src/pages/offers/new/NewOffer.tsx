import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, DollarSign, CheckCircle, User, Briefcase } from 'lucide-react'
import { api } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { WizardStepFooter } from '@/components/ui/WizardStepFooter'
import { TabContent } from '@/components/motion/TabContent'
import './new.css'

const schema = z.object({
    candidateId: z.string().min(1, 'Candidate is required'),
    requirementId: z.string().min(1, 'Job Requirement is required'),
    baseSalary: z.number().min(1000, 'Base salary must be at least 1000'),
    equity: z.number().optional(),
    bonus: z.number().optional(),
    letterContent: z.string().optional(),
})

type OfferFormValues = z.infer<typeof schema>

const NewOffer = () => {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { user } = useAuth()
    const [currentStep, setCurrentStep] = useState(0)

    const { register, handleSubmit, control, trigger, formState: { errors } } = useForm<OfferFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            baseSalary: 0,
            equity: 0,
            bonus: 0,
        },
    })

    const { data: candidates = [] } = useQuery({ queryKey: ['candidates'], queryFn: api.candidates.list })
    const { data: requirements = [] } = useQuery({ queryKey: ['requirements'], queryFn: api.requirements.list })

    const candidateOptions = useMemo(
        () =>
            candidates.map((c) => ({
                value: c.id,
                label: c.name,
                sublabel: [c.role, c.email].filter(Boolean).join(' · '),
            })),
        [candidates]
    )

    const requirementOptions = useMemo(
        () =>
            requirements.map((r) => ({
                value: r.id,
                label: r.title,
                sublabel: `${r.department} · ${r.status.replace('_', ' ')}`,
            })),
        [requirements]
    )

    const createMutation = useMutation({
        mutationFn: (data: OfferFormValues) =>
            api.offers.create({
                ...data,
                createdBy: user?.uid!,
                status: 'DRAFT',
                history: [],
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['offers'] })
            navigate('/offers')
        },
    })

    const onSubmit = (data: OfferFormValues) => {
        // @ts-ignore - Service handles history overwrite
        createMutation.mutate({ ...data, history: [] })
    }

    const nextStep = async () => {
        const ok = await trigger(['candidateId', 'requirementId'])
        if (ok) setCurrentStep(1)
    }

    const prevStep = () => setCurrentStep(0)

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div>
                <h1 className="text-2xl font-black text-primary dark:text-white tracking-tight">
                    Create New Offer
                </h1>
                <p className="text-sm font-medium text-primary/60 dark:text-white/60">
                    Step {currentStep + 1} of 2 — draft a compensation package for a candidate.
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <TabContent activeKey={String(currentStep)}>
                {currentStep === 0 ? (
                    <section className="bg-white dark:bg-white/5 p-8 rounded-2xl border border-primary/10 dark:border-white/10 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/20 dark:bg-white/20" />
                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex items-center justify-center size-8 rounded-full bg-primary/10 dark:bg-white/10 text-primary dark:text-white font-bold text-sm">
                                1
                            </div>
                            <h2 className="text-xl font-bold text-primary dark:text-white">Candidate Details</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider block">
                                    Candidate
                                </label>
                                <Controller
                                    control={control}
                                    name="candidateId"
                                    render={({ field }) => (
                                        <SearchableSelect
                                            value={field.value}
                                            onChange={field.onChange}
                                            options={candidateOptions}
                                            placeholder="Select candidate"
                                            searchPlaceholder="Search candidates..."
                                            icon={<User size={18} />}
                                        />
                                    )}
                                />
                                {errors.candidateId && (
                                    <p className="text-xs font-bold text-red-500">{errors.candidateId.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider block">
                                    Job Requirement
                                </label>
                                <Controller
                                    control={control}
                                    name="requirementId"
                                    render={({ field }) => (
                                        <SearchableSelect
                                            value={field.value}
                                            onChange={field.onChange}
                                            options={requirementOptions}
                                            placeholder="Select job"
                                            searchPlaceholder="Search requirements..."
                                            icon={<Briefcase size={18} />}
                                        />
                                    )}
                                />
                                {errors.requirementId && (
                                    <p className="text-xs font-bold text-red-500">{errors.requirementId.message}</p>
                                )}
                            </div>
                        </div>
                    </section>
                ) : null}

                {currentStep === 1 ? (
                    <section className="bg-white dark:bg-white/5 p-8 rounded-2xl border border-primary/10 dark:border-white/10 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/20 dark:bg-white/20" />
                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex items-center justify-center size-8 rounded-full bg-primary/10 dark:bg-white/10 text-primary dark:text-white font-bold text-sm">
                                2
                            </div>
                            <h2 className="text-xl font-bold text-primary dark:text-white">Compensation</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider block">
                                    Base Salary (Annual)
                                </label>
                                <div className="app-input-wrap">
                                    <DollarSign
                                        className="app-field-icon-leading text-primary/30"
                                        size={18}
                                        aria-hidden
                                    />
                                    <input
                                        type="number"
                                        className="app-input field-input--leading-icon w-full !min-h-12 !py-3 !rounded-xl font-bold"
                                        placeholder="e.g. 120000"
                                        {...register('baseSalary', { valueAsNumber: true })}
                                    />
                                </div>
                                {errors.baseSalary && (
                                    <p className="text-xs font-bold text-red-500">{errors.baseSalary.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider block">
                                    Equity (RSUs)
                                </label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-bold text-primary dark:text-white"
                                    placeholder="e.g. 5000"
                                    {...register('equity', { valueAsNumber: true })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider block">
                                    Target Bonus (%)
                                </label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-bold text-primary dark:text-white"
                                    placeholder="e.g. 15"
                                    {...register('bonus', { valueAsNumber: true })}
                                />
                            </div>
                        </div>
                    </section>
                ) : null}
                </TabContent>

                <WizardStepFooter
                    currentStep={currentStep}
                    onPreviousStep={prevStep}
                    exitTo="/offers"
                    exitLabel="Cancel"
                >
                    {currentStep === 0 ? (
                        <button
                            type="button"
                            onClick={nextStep}
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 dark:shadow-none w-full sm:w-auto"
                        >
                            Continue
                            <ArrowRight size={18} />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 dark:shadow-none disabled:opacity-50 w-full sm:w-auto"
                        >
                            {createMutation.isPending ? 'Drafting...' : 'Create Draft Offer'}
                            {!createMutation.isPending && <CheckCircle size={18} />}
                        </button>
                    )}
                </WizardStepFooter>
            </form>
        </div>
    )
}

export default NewOffer
