import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Clock, Link as LinkIcon, User, CheckCircle, Lock } from 'lucide-react'
import { WizardStepFooter } from '../../components/ui/WizardStepFooter'
import { api } from '../../services/api'
import clsx from 'clsx'
import { SearchableSelect } from '../../components/ui/SearchableSelect'
import { SearchableMultiSelect } from '../../components/ui/SearchableMultiSelect'
import { AppSelect } from '../../components/ui/AppSelect'
import { SCHEDULE_DURATION_OPTIONS } from '../../lib/selectOptions'
import { useToastStore } from '../../store/toastStore'
import { canEditInterview } from '../../lib/interviewDisplayStatus'
import { useAuth } from '../../hooks/useAuth'
import { ApiError } from '../../lib/apiClient'
import { InterviewStageProgressStatus } from '../../types'
import {
  allowedInterviewerIdsForStageOrder,
  interviewerPanelHint,
} from '../../lib/interviewPanelLevels'

const schema = z.object({
    candidateId: z.string().min(1, 'Candidate is required'),
    requirementId: z.string().min(1, 'Job Requirement is required'),
    planStageId: z.string().min(1, 'Interview stage is required'),
    interviewerIds: z.array(z.string()).min(1, 'Select at least one interviewer'),
    scheduledAt: z.string().min(1, 'Date and Time is required'),
    duration: z.number().min(15, 'Duration must be at least 15 mins'),
    type: z.enum(['SCREENING', 'TECHNICAL', 'CULTURAL', 'SYSTEM_DESIGN', 'BEHAVIORAL']),
    meetingLink: z.string().url('Invalid URL').optional().or(z.literal('')),
    location: z.string().optional(),
    description: z.string().optional(),
})

type InterviewFormValues = z.infer<typeof schema>

function toDatetimeLocal(iso: string): string {
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const STAGE_STATUS_LABEL: Record<InterviewStageProgressStatus, string> = {
    locked: 'Complete prior stage first',
    available: 'Ready to schedule',
    scheduled: 'Already scheduled',
    awaiting_feedback: 'Awaiting feedback',
    completed: 'Completed',
    failed: 'Did not pass',
}

const ScheduleInterview = () => {
    const navigate = useNavigate()
    const { id: interviewId } = useParams<{ id: string }>()
    const [searchParams] = useSearchParams()
    const isEditMode = Boolean(interviewId)
    const queryClient = useQueryClient()
    const { addToast } = useToastStore()
    const { user } = useAuth()

    const [currentStep, setCurrentStep] = useState(0)

    const { register, handleSubmit, control, watch, reset, setValue, trigger, formState: { errors } } =
        useForm<InterviewFormValues>({
            resolver: zodResolver(schema),
            defaultValues: {
                duration: 60,
                type: 'TECHNICAL',
                interviewerIds: [],
                planStageId: '',
            },
        })

    const candidateId = watch('candidateId')
    const requirementId = watch('requirementId')
    const planStageId = watch('planStageId')

    const { data: interview, isLoading: loadingInterview, isError: interviewLoadError } = useQuery({
        queryKey: ['interview', interviewId],
        queryFn: () => api.interviews.get(interviewId!),
        enabled: isEditMode && !!interviewId,
    })

    useEffect(() => {
        if (!interview) return
        reset({
            candidateId: interview.candidateId,
            requirementId: interview.requirementId,
            planStageId: interview.planStageId ?? '',
            interviewerIds: interview.interviewerIds,
            scheduledAt: toDatetimeLocal(interview.scheduledAt),
            duration: interview.duration ?? 60,
            type: interview.type,
            meetingLink: interview.meetingLink ?? '',
            location: interview.location ?? '',
            description: interview.description ?? '',
        })
    }, [interview, reset])

    const prefillCandidateId = searchParams.get('candidateId') ?? ''
    const prefillRequirementId = searchParams.get('requirementId') ?? ''
    const returnTo = searchParams.get('returnTo')

    const exitTo = useMemo(() => {
        if (returnTo) return returnTo
        const cid = interview?.candidateId ?? prefillCandidateId
        if (cid) return `/candidates/${cid}?tab=interviews`
        return '/interviews'
    }, [returnTo, interview?.candidateId, prefillCandidateId])

    useEffect(() => {
        if (isEditMode || interview) return
        if (!prefillCandidateId && !prefillRequirementId) return
        reset((prev) => ({
            ...prev,
            ...(prefillCandidateId && { candidateId: prefillCandidateId }),
            ...(prefillRequirementId && { requirementId: prefillRequirementId }),
        }))
    }, [isEditMode, interview, prefillCandidateId, prefillRequirementId, reset])

    const { data: candidates = [] } = useQuery({ queryKey: ['candidates'], queryFn: api.candidates.list })
    const { data: requirements = [] } = useQuery({ queryKey: ['requirements'], queryFn: api.requirements.list })
    const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: api.users.list })

    const { data: progress } = useQuery({
        queryKey: ['interview-progress', requirementId, candidateId],
        queryFn: () =>
            api.requirements.getCandidateInterviewProgress(requirementId, candidateId),
        enabled: !!requirementId && !!candidateId,
    })

    const { data: plan } = useQuery({
        queryKey: ['interview-plan', requirementId],
        queryFn: () => api.requirements.getInterviewPlan(requirementId),
        enabled: !!requirementId,
    })

    const { data: panelLevels = [] } = useQuery({
        queryKey: ['interview-panels'],
        queryFn: api.interviewPanels.list,
    })

    useEffect(() => {
        if (isEditMode || !progress?.nextSchedulableStageId) return
        if (!planStageId) {
            const stage = progress.stages.find((s) => s.id === progress.nextSchedulableStageId)
            if (stage) {
                const allowedSet = new Set(stage.allowedInterviewerIds)
                setValue('planStageId', stage.id)
                setValue('type', stage.interviewType)
                setValue('duration', stage.defaultDuration)
                const defaults = stage.defaultInterviewerIds.filter((id) => allowedSet.has(id))
                if (defaults.length > 0) {
                    setValue('interviewerIds', defaults)
                }
            }
        }
    }, [progress, isEditMode, planStageId, setValue])

    const onStageSelect = (stageId: string) => {
        const stage = progress?.stages.find((s) => s.id === stageId)
        const planStage = plan?.stages.find((s) => s.id === stageId)
        const meta = stage ?? planStage
        if (!meta) return
        const allowed = stage?.allowedInterviewerIds ?? allowedInterviewerIdsForStageOrder(meta.order, panelLevels)
        setValue('planStageId', stageId)
        setValue('type', meta.interviewType)
        setValue('duration', meta.defaultDuration)
        const allowedSet = new Set(allowed)
        const defaults = (stage?.defaultInterviewerIds ?? []).filter((id) => allowedSet.has(id))
        setValue('interviewerIds', defaults.length > 0 ? defaults : [])
    }

    const INTERVIEWER_ROLES = [
        'INTERVIEWER',
        'HIRING_MANAGER',
        'TEAM_LEAD',
        'RECRUITER',
        'ADMIN',
        'HR_HEAD',
        'HR_MANAGER',
    ] as const

    const interviewers = users.filter(
        (u) => u.status === 'ACTIVE' && INTERVIEWER_ROLES.includes(u.role as (typeof INTERVIEWER_ROLES)[number])
    )

    const schedulableCandidates = useMemo(() => {
        return candidates.filter((c) => {
            if (c.status !== 'INTERVIEW') return false
            if (requirementId && c.requirementId && c.requirementId !== requirementId) return false
            return true
        })
    }, [candidates, requirementId])

    const candidateOptions = useMemo(
        () =>
            schedulableCandidates.map((c) => ({
                value: c.id,
                label: c.name,
                sublabel: [c.role, c.email].filter(Boolean).join(' · '),
            })),
        [schedulableCandidates]
    )

    const selectedStageMeta = useMemo(() => {
        const fromProgress = progress?.stages.find((s) => s.id === planStageId)
        if (fromProgress) return fromProgress
        const fromPlan = plan?.stages.find((s) => s.id === planStageId)
        if (!fromPlan) return null
        const allowed = allowedInterviewerIdsForStageOrder(fromPlan.order, panelLevels)
        return {
            ...fromPlan,
            allowedInterviewerIds: allowed,
            usesCombinedPanel: fromPlan.order >= 3,
            panelRestrictionLabel: fromPlan.name,
        }
    }, [planStageId, progress, plan, panelLevels])

    const allowedInterviewerIds = selectedStageMeta?.allowedInterviewerIds ?? []

    const interviewerPanelHelp = selectedStageMeta
        ? interviewerPanelHint(
              selectedStageMeta.order,
              selectedStageMeta.panelRestrictionLabel,
              selectedStageMeta.usesCombinedPanel
          )
        : null

    const requirementOptions = useMemo(
        () =>
            requirements.map((r) => ({
                value: r.id,
                label: r.title,
                sublabel: `${r.department} · ${r.status.replace('_', ' ')}`,
            })),
        [requirements]
    )

    const interviewerOptions = useMemo(() => {
        const allowed = new Set(allowedInterviewerIds)
        return interviewers
            .filter((u) => allowed.has(u.uid))
            .map((u) => ({
                value: u.uid,
                label: u.name,
                sublabel: `${u.role.replace('_', ' ')} · ${u.email}`,
            }))
    }, [interviewers, allowedInterviewerIds])

    const watchInterviewerIds = watch('interviewerIds')

    useEffect(() => {
        if (!planStageId || allowedInterviewerIds.length === 0) return
        const allowed = new Set(allowedInterviewerIds)
        const current = watchInterviewerIds ?? []
        const pruned = current.filter((id) => allowed.has(id))
        if (pruned.length !== current.length) {
            setValue('interviewerIds', pruned)
        }
    }, [planStageId, allowedInterviewerIds, watchInterviewerIds, setValue])

    const createMutation = useMutation({
        mutationFn: (data: InterviewFormValues) =>
            api.interviews.create({
                ...data,
                status: 'SCHEDULED',
            }),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['interviews'] })
            if (variables.candidateId) {
                queryClient.invalidateQueries({
                    queryKey: ['candidate-activity', variables.candidateId],
                })
                queryClient.invalidateQueries({
                    queryKey: ['interview-progress', variables.requirementId, variables.candidateId],
                })
            }
            if (variables.candidateId) {
                queryClient.invalidateQueries({
                    queryKey: ['candidate-interviews', variables.candidateId],
                })
            }
            addToast('Interview scheduled', 'success')
            const dest =
                returnTo ??
                (variables.candidateId
                    ? `/candidates/${variables.candidateId}?tab=interviews`
                    : '/interviews')
            navigate(dest)
        },
        onError: (err: unknown) => {
            addToast(err instanceof ApiError ? err.message : 'Failed to schedule interview', 'error')
        },
    })

    const updateMutation = useMutation({
        mutationFn: (data: InterviewFormValues) => api.interviews.update(interviewId!, data),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['interviews'] })
            queryClient.invalidateQueries({ queryKey: ['interview', interviewId] })
            if (variables.candidateId) {
                queryClient.invalidateQueries({
                    queryKey: ['candidate-activity', variables.candidateId],
                })
                queryClient.invalidateQueries({
                    queryKey: ['candidate-interviews', variables.candidateId],
                })
            }
            addToast('Interview updated', 'success')
            const dest =
                returnTo ??
                (variables.candidateId
                    ? `/candidates/${variables.candidateId}?tab=interviews`
                    : '/interviews')
            navigate(dest)
        },
        onError: (err: unknown) => {
            addToast(err instanceof ApiError ? err.message : 'Failed to update interview', 'error')
        },
    })

    const onSubmit = (data: InterviewFormValues) => {
        if (isEditMode) updateMutation.mutate(data)
        else createMutation.mutate(data)
    }

    const nextStep = async () => {
        const ok = await trigger(['candidateId', 'requirementId', 'planStageId', 'interviewerIds'])
        if (!ok) return
        if (!isEditMode && (!planStageId || !progress?.nextSchedulableStageId)) return
        setCurrentStep(1)
    }

    const prevStep = () => setCurrentStep(0)

    const isPending = createMutation.isPending || updateMutation.isPending
    const showParticipants = isEditMode || currentStep === 0
    const showLogistics = isEditMode || currentStep === 1
    const stagesForPicker = progress?.stages ?? plan?.stages.map((s) => ({
        ...s,
        status: 'available' as const,
        canSchedule: true,
    })) ?? []

    if (isEditMode && loadingInterview) {
        return (
            <div className="max-w-4xl mx-auto py-16 text-center text-page-desc">
                Loading interview...
            </div>
        )
    }

    if (isEditMode && (interviewLoadError || !interview)) {
        return (
            <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
                <p className="text-page-desc">Interview not found.</p>
            </div>
        )
    }

    if (isEditMode && interview && !canEditInterview(interview, user?.role)) {
        return (
            <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
                <p className="text-page-desc">
                    This interview cannot be edited because feedback has already been submitted.
                </p>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="min-w-0">
                    <h1 className="text-2xl font-black text-primary dark:text-white tracking-tight">
                        {isEditMode ? 'Edit / Reschedule Interview' : 'Schedule Interview'}
                    </h1>
                    <p className="text-sm font-medium text-primary/60 dark:text-white/60">
                        {isEditMode
                            ? 'Update date, interviewers, or meeting details.'
                            : `Step ${currentStep + 1} of 2 — stages run in order; complete feedback before the next round.`}
                    </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <input type="hidden" {...register('planStageId')} />
                <input type="hidden" {...register('type')} />

                {showParticipants && (
                <section className="bg-white dark:bg-white/5 p-8 rounded-2xl border border-primary/10 dark:border-white/10 shadow-sm relative">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/20 dark:bg-white/20 rounded-l-2xl pointer-events-none" />
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex items-center justify-center size-8 rounded-full bg-primary/10 dark:bg-white/10 text-primary dark:text-white font-bold text-sm">
                            1
                        </div>
                        <h2 className="text-xl font-bold text-primary dark:text-white">Participants & stage</h2>
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
                                        onChange={(v) => {
                                            field.onChange(v)
                                            if (!isEditMode) setValue('planStageId', '')
                                        }}
                                        options={candidateOptions}
                                        placeholder="Select candidate"
                                        searchPlaceholder="Search candidates..."
                                        icon={<User size={18} />}
                                        disabled={isEditMode}
                                    />
                                )}
                            />
                            {errors.candidateId && (
                                <p className="text-xs font-bold text-red-500">{errors.candidateId.message}</p>
                            )}
                            {!isEditMode && requirementId && schedulableCandidates.length === 0 && (
                                <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                                    No candidates in Interview stage are linked to this job. Move them to Interview in the pipeline first.
                                </p>
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
                                        onChange={(v) => {
                                            field.onChange(v)
                                            if (!isEditMode) setValue('planStageId', '')
                                        }}
                                        options={requirementOptions}
                                        placeholder="Select job"
                                        searchPlaceholder="Search requirements..."
                                        icon={<span className="material-symbols-outlined !text-lg">work</span>}
                                        disabled={isEditMode}
                                    />
                                )}
                            />
                            {errors.requirementId && (
                                <p className="text-xs font-bold text-red-500">{errors.requirementId.message}</p>
                            )}
                        </div>

                        {candidateId && requirementId && (
                            <div className="md:col-span-2 space-y-3">
                                <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider block">
                                    Interview stage
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {stagesForPicker.map((stage, index) => {
                                        const selectable =
                                            isEditMode
                                                ? stage.id === interview?.planStageId
                                                : stage.canSchedule
                                        const selected = planStageId === stage.id
                                        return (
                                            <button
                                                key={stage.id}
                                                type="button"
                                                disabled={!selectable}
                                                onClick={() => onStageSelect(stage.id)}
                                                className={clsx(
                                                    'text-left p-4 rounded-xl border-2 transition-all',
                                                    selected
                                                        ? 'border-primary bg-primary/5 dark:border-white dark:bg-white/10'
                                                        : 'border-primary/10 dark:border-white/10',
                                                    !selectable && 'opacity-50 cursor-not-allowed'
                                                )}
                                            >
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <span className="text-xs font-bold text-muted-foreground">
                                                        {index + 1}
                                                    </span>
                                                    {!selectable && <Lock size={14} className="text-primary/30" />}
                                                </div>
                                                <p className="font-bold text-sm text-primary dark:text-white">{stage.name}</p>
                                                {'status' in stage && (
                                                    <p className="text-[10px] font-medium text-primary/50 dark:text-white/50 mt-1">
                                                        {STAGE_STATUS_LABEL[stage.status]}
                                                    </p>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                                {errors.planStageId && (
                                    <p className="text-xs font-bold text-red-500">{errors.planStageId.message}</p>
                                )}
                                {!isEditMode && progress && !progress.candidateInInterviewStage && candidateId && (
                                    <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                                        This candidate must be in Interview stage in the pipeline before you can schedule.
                                    </p>
                                )}
                                {!isEditMode && progress && progress.candidateInInterviewStage && !progress.nextSchedulableStageId && (
                                    <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                                        No stage is available to schedule. Submit pending feedback or complete earlier rounds.
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="md:col-span-2 space-y-2 relative z-20">
                            <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider block">
                                Interviewers
                            </label>
                            {interviewerPanelHelp && (
                                <p className="text-xs font-medium text-primary/60 dark:text-white/60">
                                    {interviewerPanelHelp}
                                </p>
                            )}
                            {planStageId && allowedInterviewerIds.length === 0 && (
                                <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                                    No panel members configured for this round. Ask an admin to set up interview panels.
                                </p>
                            )}
                            <Controller
                                control={control}
                                name="interviewerIds"
                                render={({ field }) => (
                                    <SearchableMultiSelect
                                        value={field.value}
                                        onChange={field.onChange}
                                        options={interviewerOptions}
                                        placeholder={
                                            allowedInterviewerIds.length === 0
                                                ? 'No panel members available'
                                                : 'Add interviewer...'
                                        }
                                        searchPlaceholder="Search panel members..."
                                    />
                                )}
                            />
                            {errors.interviewerIds && (
                                <p className="text-xs font-bold text-red-500">{errors.interviewerIds.message}</p>
                            )}
                        </div>
                    </div>
                </section>
                )}

                {showLogistics && (
                <section
                    id="logistics"
                    className="bg-white dark:bg-white/5 p-8 rounded-2xl border border-primary/10 dark:border-white/10 shadow-sm relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/20 dark:bg-white/20" />
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex items-center justify-center size-8 rounded-full bg-primary/10 dark:bg-white/10 text-primary dark:text-white font-bold text-sm">
                            2
                        </div>
                        <h2 className="text-xl font-bold text-primary dark:text-white">Logistics</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider block">
                                Date & Time
                            </label>
                            <input
                                type="datetime-local"
                                className="w-full px-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-bold text-primary dark:text-white"
                                {...register('scheduledAt')}
                            />
                            {errors.scheduledAt && (
                                <p className="text-xs font-bold text-red-500">{errors.scheduledAt.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider block">
                                Duration (Minutes)
                            </label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/30" size={18} />
                                <AppSelect
                                    className="[&_button]:pl-10"
                                    value={String(watch('duration') || 30)}
                                    onChange={(v) => setValue('duration', Number(v), { shouldValidate: true })}
                                    options={SCHEDULE_DURATION_OPTIONS}
                                    aria-label="Interview duration"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider block">
                                Meeting Link
                            </label>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/30" size={18} />
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-medium text-primary dark:text-white"
                                    placeholder="https://meet.google.com/..."
                                    {...register('meetingLink')}
                                />
                            </div>
                            {errors.meetingLink && (
                                <p className="text-xs font-bold text-red-500">{errors.meetingLink.message}</p>
                            )}
                        </div>
                    </div>
                </section>
                )}

                {isEditMode ? (
                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 dark:shadow-none disabled:opacity-50 w-full sm:w-auto"
                        >
                            {isPending ? 'Saving...' : 'Save changes'}
                            {!isPending && <CheckCircle size={18} />}
                        </button>
                    </div>
                ) : (
                    <WizardStepFooter
                        currentStep={currentStep}
                        onPreviousStep={prevStep}
                        exitTo={exitTo}
                        exitLabel="Cancel"
                    >
                        {currentStep === 0 ? (
                            <button
                                type="button"
                                onClick={nextStep}
                                disabled={!planStageId || !progress?.nextSchedulableStageId}
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 dark:shadow-none disabled:opacity-50 w-full sm:w-auto"
                            >
                                Continue
                                <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={
                                    isPending ||
                                    !planStageId ||
                                    !progress?.nextSchedulableStageId
                                }
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 dark:shadow-none disabled:opacity-50 w-full sm:w-auto"
                            >
                                {isPending ? 'Scheduling...' : 'Send invitations'}
                                {!isPending && <CheckCircle size={18} />}
                            </button>
                        )}
                    </WizardStepFooter>
                )}
            </form>
        </div>
    )
}

export default ScheduleInterview
