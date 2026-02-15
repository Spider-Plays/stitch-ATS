import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar, Clock, Video, MapPin, User, Link as LinkIcon, Users, CheckCircle } from 'lucide-react'
import { api } from '../../services/api'
import clsx from 'clsx'
import { useAuth } from '../../hooks/useAuth'

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

const ScheduleInterview = () => {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { user } = useAuth()

    const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<InterviewFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            duration: 60,
            type: 'TECHNICAL',
            interviewerIds: []
        }
    })

    // Fetch Data for Dropdowns
    const { data: candidates = [] } = useQuery({ queryKey: ['candidates'], queryFn: api.candidates.list })
    const { data: requirements = [] } = useQuery({ queryKey: ['requirements'], queryFn: api.requirements.list })
    const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: api.users.list })

    const interviewers = users.filter(u => ['INTERVIEWER', 'HIRING_MANAGER', 'TEAM_LEAD', 'RECRUITER', 'ADMIN'].includes(u.role))

    const createMutation = useMutation({
        mutationFn: (data: InterviewFormValues) => api.interviews.create({
            ...data,
            status: 'SCHEDULED'
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['interviews'] })
            navigate('/interviews')
        }
    })

    const onSubmit = (data: InterviewFormValues) => {
        createMutation.mutate(data)
    }

    const selectedType = watch('type')

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/interviews')} className="p-2 hover:bg-primary/5 dark:hover:bg-white/5 rounded-full text-primary/60 dark:text-white/40 hover:text-primary dark:hover:text-white transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div>
                    <h1 className="text-2xl font-black text-primary dark:text-white tracking-tight">Schedule Interview</h1>
                    <p className="text-sm font-medium text-primary/60 dark:text-white/60">Coordinate with candidates and your internal panel.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Participants */}
                <section className="bg-white dark:bg-white/5 p-8 rounded-2xl border border-primary/10 dark:border-white/10 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/20 dark:bg-white/20"></div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex items-center justify-center size-8 rounded-full bg-primary/10 dark:bg-white/10 text-primary dark:text-white font-bold text-sm">1</div>
                        <h2 className="text-xl font-bold text-primary dark:text-white">Participants</h2>
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
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/30 !text-lg">work</span>
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

                        <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider block">Interviewers</label>
                            <Controller
                                control={control}
                                name="interviewerIds"
                                render={({ field }) => (
                                    <div className="flex flex-wrap gap-2 p-4 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] min-h-[60px]">
                                        {users.filter(u => field.value.includes(u.uid)).map(u => (
                                            <div key={u.uid} className="flex items-center gap-2 bg-white dark:bg-white/10 border border-primary/10 dark:border-white/10 rounded-full pl-1 pr-3 py-1">
                                                <div className="size-6 rounded-full bg-primary/10 dark:bg-white/20 flex items-center justify-center text-[10px] font-bold text-primary dark:text-white">
                                                    {u.name.charAt(0)}
                                                </div>
                                                <span className="text-xs font-bold text-primary dark:text-white">{u.name}</span>
                                                <button type="button" onClick={() => field.onChange(field.value.filter(id => id !== u.uid))} className="text-primary/40 hover:text-red-500 transition-colors">
                                                    <span className="material-symbols-outlined !text-sm">close</span>
                                                </button>
                                            </div>
                                        ))}
                                        {/* Simple multiselect dropdown trigger could be here, strict implementation might need a custom component */}
                                        <select
                                            className="bg-transparent border-none text-sm font-medium text-primary/60 focus:ring-0 w-40"
                                            onChange={(e) => {
                                                if (e.target.value && !field.value.includes(e.target.value)) {
                                                    field.onChange([...field.value, e.target.value])
                                                }
                                                e.target.value = ''
                                            }}
                                        >
                                            <option value="">Add Interviewer...</option>
                                            {interviewers.filter(u => !field.value.includes(u.uid)).map(u => (
                                                <option key={u.uid} value={u.uid}>{u.name} ({u.role})</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            />
                            {errors.interviewerIds && <p className="text-xs font-bold text-red-500">{errors.interviewerIds.message}</p>}
                        </div>
                    </div>
                </section>

                {/* Logistics */}
                <section className="bg-white dark:bg-white/5 p-8 rounded-2xl border border-primary/10 dark:border-white/10 shadow-sm relative overflow-hidden">
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
                        disabled={createMutation.isPending}
                        className="flex items-center gap-2 px-8 py-4 bg-primary dark:bg-white text-white dark:text-primary rounded-xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 dark:shadow-none"
                    >
                        {createMutation.isPending ? 'Scheduling...' : 'Send Invitations'}
                        {!createMutation.isPending && <CheckCircle size={18} />}
                    </button>
                </div>
            </form>
        </div>
    )
}

export default ScheduleInterview
