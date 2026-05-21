import React, { useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Clock, Link as LinkIcon, User, CheckCircle } from 'lucide-react'
import { api } from '../../services/api'
import clsx from 'clsx'
import { SearchableSelect } from '../../components/ui/SearchableSelect'
import { SearchableMultiSelect } from '../../components/ui/SearchableMultiSelect'
import { useToastStore } from '../../store/toastStore'
import { canEditInterview } from '../../lib/interviewDisplayStatus'

const schema = z.object({
    candidateId: z.string().min(1, "Candidate is required"),
    requirementId: z.string().min(1, "Job Requirement is required"),
    interviewerIds: z.array(z.string()).min(1, "Select at least one interviewer"),
    scheduledAt: z.string().min(1, "Date and Time is required"),
    duration: z.number().min(15, "Duration must be at least 15 mins"),
    type: z.enum(['SCREENING', 'TECHNICAL', 'CULTURAL', 'SYSTEM_DESIGN', 'BEHAVIORAL']),
    meetingLink: z.string().url("Invalid URL").optional().or(z.literal('')),
    location: z.string().optional(),
    description: z.string().optional()
})

type InterviewFormValues = z.infer<typeof schema>

function toDatetimeLocal(iso: string): string {
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const ScheduleInterview = () => {
    const navigate = useNavigate()
    const { id: interviewId } = useParams<{ id: string }>()
    const isEditMode = Boolean(interviewId)
    const queryClient = useQueryClient()
    const { addToast } = useToastStore()

    const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm<InterviewFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            duration: 60,
            type: 'TECHNICAL',
            interviewerIds: []
        }
    })

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
            interviewerIds: interview.interviewerIds,
            scheduledAt: toDatetimeLocal(interview.scheduledAt),
            duration: interview.duration ?? 60,
            type: interview.type,
            meetingLink: interview.meetingLink ?? '',
            location: interview.location ?? '',
            description: interview.description ?? '',
        })
    }, [interview, reset])

    const { data: candidates = [] } = useQuery({ queryKey: ['candidates'], queryFn: api.candidates.list })
    const { data: requirements = [] } = useQuery({ queryKey: ['requirements'], queryFn: api.requirements.list })
    const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: api.users.list })

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

    const interviewerOptions = useMemo(
        () =>
            interviewers.map((u) => ({
                value: u.uid,
                label: u.name,
                sublabel: `${u.role.replace('_', ' ')} · ${u.email}`,
            })),
        [interviewers]
    )

    const createMutation = useMutation({
        mutationFn: (data: InterviewFormValues) => api.interviews.create({
            ...data,
            status: 'SCHEDULED'
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['interviews'] })
            addToast('Interview scheduled', 'success')
            navigate('/interviews')
        },
        onError: () => addToast('Failed to schedule interview', 'error'),
    })

    const updateMutation = useMutation({
        mutationFn: (data: InterviewFormValues) => api.interviews.update(interviewId!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['interviews'] })
            queryClient.invalidateQueries({ queryKey: ['interview', interviewId] })
            addToast('Interview updated', 'success')
            navigate('/interviews')
        },
        onError: () => addToast('Failed to update interview', 'error'),
    })

    const onSubmit = (data: InterviewFormValues) => {
        if (isEditMode) updateMutation.mutate(data)
        else createMutation.mutate(data)
    }

    const selectedType = watch('type')
    const isPending = createMutation.isPending || updateMutation.isPending

    if (isEditMode && loadingInterview) {
        return (
            <div className="max-w-4xl mx-auto py-16 text-center text-primary/60 dark:text-white/60 font-medium">
                Loading interview...
            </div>
        )
    }

    if (isEditMode && (interviewLoadError || !interview)) {
        return (
            <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
                <p className="text-primary/60 dark:text-white/60 font-medium">Interview not found.</p>
                <button
                    type="button"
                    onClick={() => navigate('/interviews')}
                    className="text-sm font-bold text-primary dark:text-white hover:underline"
                >
                    Back to interviews
                </button>
            </div>
        )
    }

    if (isEditMode && interview && !canEditInterview(interview)) {
        return (
            <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
                <p className="text-primary/60 dark:text-white/60 font-medium">
                    This interview cannot be edited because feedback has already been submitted.
                </p>
                <button
                    type="button"
                    onClick={() => navigate('/interviews')}
                    className="text-sm font-bold text-primary dark:text-white hover:underline"
                >
                    Back to interviews
                </button>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/interviews')} className="p-2 hover:bg-primary/5 dark:hover:bg-white/5 rounded-full text-primary/60 dark:text-white/40 hover:text-primary dark:hover:text-white transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div>
                    <h1 className="text-2xl font-black text-primary dark:text-white tracking-tight">
                        {isEditMode ? 'Edit / Reschedule Interview' : 'Schedule Interview'}
                    </h1>
                    <p className="text-sm font-medium text-primary/60 dark:text-white/60">
                        {isEditMode
                            ? 'Update date, interviewers, or meeting details. The candidate is notified when the time changes.'
                            : 'Coordinate with candidates and your internal panel.'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <section className="bg-white dark:bg-white/5 p-8 rounded-2xl border border-primary/10 dark:border-white/10 shadow-sm relative">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/20 dark:bg-white/20 rounded-l-2xl pointer-events-none"></div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex items-center justify-center size-8 rounded-full bg-primary/10 dark:bg-white/10 text-primary dark:text-white font-bold text-sm">1</div>
                        <h2 className="text-xl font-bold text-primary dark:text-white">Participants</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider block">Candidate</label>
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
                            {errors.candidateId && <p className="text-xs font-bold text-red-500">{errors.candidateId.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider block">Job Requirement</label>
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
                                        icon={
                                            <span className="material-symbols-outlined !text-lg">work</span>
                                        }
                                    />
                                )}
                            />
                            {errors.requirementId && <p className="text-xs font-bold text-red-500">{errors.requirementId.message}</p>}
                        </div>

                        <div className="md:col-span-2 space-y-2 relative z-20">
                            <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider block">Interviewers</label>
                            <Controller
                                control={control}
                                name="interviewerIds"
                                render={({ field }) => (
                                    <SearchableMultiSelect
                                        value={field.value}
                                        onChange={field.onChange}
                                        options={interviewerOptions}
                                        placeholder="Add interviewer..."
                                        searchPlaceholder="Search interviewers..."
                                    />
                                )}
                            />
                            {errors.interviewerIds && <p className="text-xs font-bold text-red-500">{errors.interviewerIds.message}</p>}
                        </div>
                    </div>
                </section>

                <section id="logistics" className="bg-white dark:bg-white/5 p-8 rounded-2xl border border-primary/10 dark:border-white/10 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/20 dark:bg-white/20"></div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex items-center justify-center size-8 rounded-full bg-primary/10 dark:bg-white/10 text-primary dark:text-white font-bold text-sm">2</div>
                        <h2 className="text-xl font-bold text-primary dark:text-white">Logistics</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider block">Date & Time</label>
                            <div className="relative">
                                <input
                                    type="datetime-local"
                                    className="w-full pl-4 pr-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-bold text-primary dark:text-white"
                                    {...register('scheduledAt')}
                                />
                            </div>
                            {errors.scheduledAt && <p className="text-xs font-bold text-red-500">{errors.scheduledAt.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider block">Duration (Minutes)</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/30" size={18} />
                                <select
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-bold text-primary dark:text-white appearance-none"
                                    {...register('duration', { valueAsNumber: true })}
                                >
                                    <option value={15}>15 Minutes</option>
                                    <option value={30}>30 Minutes</option>
                                    <option value={45}>45 Minutes</option>
                                    <option value={60}>60 Minutes</option>
                                    <option value={90}>90 Minutes</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider block">Interview Type</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['TECHNICAL', 'CULTURAL', 'SYSTEM_DESIGN', 'BEHAVIORAL', 'SCREENING'].slice(0, 4).map(type => (
                                    <label key={type} className={clsx(
                                        "flex items-center justify-center gap-2 p-3 rounded-lg border-2 font-bold text-xs uppercase cursor-pointer transition-all",
                                        selectedType === type
                                            ? "border-primary bg-primary/5 text-primary dark:border-white dark:bg-white/10 dark:text-white"
                                            : "border-primary/10 bg-primary/[0.02] text-primary/60 dark:border-white/10 dark:bg-white/[0.02] dark:text-white/60 hover:bg-primary/5 dark:hover:bg-white/5"
                                    )}>
                                        <input type="radio" value={type} {...register('type')} className="hidden" />
                                        {type.replace('_', ' ')}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider block">Meeting Link / Location</label>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/30" size={18} />
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-medium text-primary dark:text-white"
                                    placeholder="https://meet.google.com/..."
                                    {...register('meetingLink')}
                                />
                            </div>
                            {errors.meetingLink && <p className="text-xs font-bold text-red-500">{errors.meetingLink.message}</p>}
                        </div>
                    </div>
                </section>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={isPending}
                        className="flex items-center gap-2 px-8 py-4 bg-primary dark:bg-white text-white dark:text-primary rounded-xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 dark:shadow-none"
                    >
                        {isPending
                            ? (isEditMode ? 'Saving...' : 'Scheduling...')
                            : (isEditMode ? 'Save changes' : 'Send Invitations')}
                        {!isPending && <CheckCircle size={18} />}
                    </button>
                </div>
            </form>
        </div>
    )
}

export default ScheduleInterview
