import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Star, ThumbsUp, ThumbsDown, User, FileText, Code, MessagesSquare } from 'lucide-react'
import { api } from '../../services/api'
import clsx from 'clsx'
import { useAuth } from '../../hooks/useAuth'

const schema = z.object({
    technicalRating: z.number().min(1, "Rating is required"),
    communicationRating: z.number().min(1, "Rating is required"),
    rating: z.number().min(1, "Overall rating is required"),
    comments: z.string().min(10, "Please provide detailed comments (min 10 chars)"),
    recommendation: z.enum(['STRONG_HIRE', 'HIRE', 'NO_HIRE'], { errorMap: () => ({ message: "Please select a recommendation" }) })
})

type FeedbackFormValues = z.infer<typeof schema>

const StarRating = ({ value, onChange, max = 5 }: { value: number, onChange: (val: number) => void, max?: number }) => {
    return (
        <div className="flex gap-1">
            {[...Array(max)].map((_, i) => {
                const ratingValue = i + 1
                return (
                    <button
                        key={i}
                        type="button"
                        onClick={() => onChange(ratingValue)}
                        className={clsx(
                            "transition-colors",
                            ratingValue <= value ? "text-primary dark:text-white fill-current" : "text-primary/20 dark:text-white/20"
                        )}
                    >
                        <Star size={24} className={clsx(ratingValue <= value && "fill-current")} />
                    </button>
                )
            })}
        </div>
    )
}

const FeedbackForm = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { user } = useAuth()

    const { data: interview, isLoading } = useQuery({
        queryKey: ['interview', id],
        queryFn: () => api.interviews.get(id!)
    })

    // We need to fetch candidate details to show in sidebar
    const { data: candidate } = useQuery({
        queryKey: ['candidate', interview?.candidateId],
        queryFn: () => api.candidates.get(interview!.candidateId),
        enabled: !!interview?.candidateId
    })

    const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FeedbackFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            technicalRating: 0,
            communicationRating: 0,
            rating: 0,
            comments: '',
            recommendation: undefined
        }
    })

    const createMutation = useMutation({
        mutationFn: (data: FeedbackFormValues) => api.feedback.create({
            ...data,
            interviewId: id!,
            interviewerId: user?.uid!,
            candidateId: interview?.candidateId!,
            createdAt: new Date().toISOString()
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feedback', id] })
            // Also update interview status to COMPLETED if not already?
            api.interviews.updateStatus(id!, 'COMPLETED')
            navigate('/interviews')
        }
    })

    const onSubmit = (data: FeedbackFormValues) => {
        createMutation.mutate(data)
    }

    if (isLoading) return <div className="p-8 text-center">Loading interview details...</div>
    if (!interview) return <div className="p-8 text-center">Interview not found.</div>

    return (
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)] -m-8 animate-in fade-in duration-500">
            {/* Sidebar: Candidate Summary */}
            <aside className="w-full lg:w-80 bg-white dark:bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 p-8 flex flex-col gap-8 shrink-0 relative z-10">
                <div className="flex flex-col items-center text-center lg:items-start lg:text-left gap-4">
                    <div className="size-24 rounded-2xl bg-primary/10 dark:bg-white/10 flex items-center justify-center text-4xl font-bold text-primary dark:text-white shadow-md border-2 border-white dark:border-slate-800">
                        {candidate?.avatar ? (
                            <img src={candidate.avatar} alt={candidate.name} className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                            candidate?.name.charAt(0)
                        )}
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-primary dark:text-white tracking-tight">{candidate?.name || 'Loading...'}</h2>
                        <p className="text-sm text-primary/60 dark:text-white/60 font-medium">{candidate?.role}</p>
                        <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 uppercase tracking-wide">
                            {interview.type}
                        </div>
                    </div>
                </div>

                <div className="lg:mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="bg-primary/5 dark:bg-white/5 rounded-xl p-4">
                        <p className="text-[10px] font-bold text-primary dark:text-white uppercase tracking-wider mb-2">Interview Details</p>
                        <p className="text-sm text-primary/80 dark:text-white/80 font-medium mb-1">{new Date(interview.scheduledAt).toLocaleDateString()}</p>
                        <p className="text-sm text-primary/80 dark:text-white/80 font-medium">{new Date(interview.scheduledAt).toLocaleTimeString()} ({interview.duration || 60} min)</p>
                    </div>
                </div>
            </aside>

            {/* Main Content: Evaluation Form */}
            <div className="flex-1 overflow-y-auto p-4 md:p-10 bg-slate-50 dark:bg-black">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div>
                        <h2 className="text-3xl font-black text-primary dark:text-white tracking-tight">Technical Assessment</h2>
                        <p className="text-primary/60 dark:text-white/60 font-medium mt-1">Provide detailed feedback across core competencies.</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                        {/* Technical Skills */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="px-8 py-4 bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                                <Code className="text-primary dark:text-white" size={20} />
                                <h3 className="font-bold text-primary dark:text-white">Technical Skills</h3>
                            </div>
                            <div className="p-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                    <div className="md:col-span-4">
                                        <label className="text-sm font-bold text-primary dark:text-white block">Technical Proficiency</label>
                                        <p className="text-xs text-primary/60 dark:text-white/60 mt-1 mb-3">Code quality, problem solving, stack knowledge.</p>
                                        <Controller
                                            control={control}
                                            name="technicalRating"
                                            render={({ field }) => <StarRating value={field.value} onChange={field.onChange} />}
                                        />
                                        {errors.technicalRating && <p className="text-xs font-bold text-red-500 mt-2">{errors.technicalRating.message}</p>}
                                    </div>
                                    <div className="md:col-span-8">
                                        {/* We could add specific comment fields per section but keeping it simple for now */}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Soft Skills */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="px-8 py-4 bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                                <MessagesSquare className="text-primary dark:text-white" size={20} />
                                <h3 className="font-bold text-primary dark:text-white">Communication & Culture</h3>
                            </div>
                            <div className="p-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                    <div className="md:col-span-4">
                                        <label className="text-sm font-bold text-primary dark:text-white block">Collaboration</label>
                                        <p className="text-xs text-primary/60 dark:text-white/60 mt-1 mb-3">Clarity of thought, cultural fit.</p>
                                        <Controller
                                            control={control}
                                            name="communicationRating"
                                            render={({ field }) => <StarRating value={field.value} onChange={field.onChange} />}
                                        />
                                        {errors.communicationRating && <p className="text-xs font-bold text-red-500 mt-2">{errors.communicationRating.message}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Final Verdict */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="px-8 py-4 bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                                <FileText className="text-primary dark:text-white" size={20} />
                                <h3 className="font-bold text-primary dark:text-white">Final Verdict</h3>
                            </div>
                            <div className="p-8 space-y-8">
                                <div>
                                    <label className="text-sm font-bold text-primary dark:text-white block mb-4">Overall Recommendation</label>
                                    <Controller
                                        control={control}
                                        name="recommendation"
                                        render={({ field }) => (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <label className={clsx(
                                                    "relative flex flex-col items-center justify-center p-6 border-2 rounded-xl cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-white/5",
                                                    field.value === 'STRONG_HIRE' ? "border-primary bg-primary/5 dark:bg-white/5 dark:border-white" : "border-slate-200 dark:border-slate-800"
                                                )}>
                                                    <input type="radio" value="STRONG_HIRE" checked={field.value === 'STRONG_HIRE'} onChange={() => field.onChange('STRONG_HIRE')} className="hidden" />
                                                    <ThumbsUp size={32} className={clsx("mb-2", field.value === 'STRONG_HIRE' ? "text-primary dark:text-white" : "text-slate-400")} />
                                                    <span className={clsx("text-sm font-bold", field.value === 'STRONG_HIRE' ? "text-primary dark:text-white" : "text-slate-500")}>Strong Hire</span>
                                                </label>

                                                <label className={clsx(
                                                    "relative flex flex-col items-center justify-center p-6 border-2 rounded-xl cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-white/5",
                                                    field.value === 'HIRE' ? "border-primary bg-primary/5 dark:bg-white/5 dark:border-white" : "border-slate-200 dark:border-slate-800"
                                                )}>
                                                    <input type="radio" value="HIRE" checked={field.value === 'HIRE'} onChange={() => field.onChange('HIRE')} className="hidden" />
                                                    <ThumbsUp size={32} className={clsx("mb-2", field.value === 'HIRE' ? "text-primary dark:text-white" : "text-slate-400")} />
                                                    <span className={clsx("text-sm font-bold", field.value === 'HIRE' ? "text-primary dark:text-white" : "text-slate-500")}>Hire</span>
                                                </label>

                                                <label className={clsx(
                                                    "relative flex flex-col items-center justify-center p-6 border-2 rounded-xl cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-white/5",
                                                    field.value === 'NO_HIRE' ? "border-red-500 bg-red-50 dark:bg-red-900/10 dark:border-red-500" : "border-slate-200 dark:border-slate-800"
                                                )}>
                                                    <input type="radio" value="NO_HIRE" checked={field.value === 'NO_HIRE'} onChange={() => field.onChange('NO_HIRE')} className="hidden" />
                                                    <ThumbsDown size={32} className={clsx("mb-2", field.value === 'NO_HIRE' ? "text-red-500" : "text-slate-400")} />
                                                    <span className={clsx("text-sm font-bold", field.value === 'NO_HIRE' ? "text-red-600" : "text-slate-500")}>No Hire</span>
                                                </label>
                                            </div>
                                        )}
                                    />
                                    {errors.recommendation && <p className="text-xs font-bold text-red-500 mt-2">{errors.recommendation.message}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                    <div className="md:col-span-4">
                                        <label className="text-sm font-bold text-primary dark:text-white block">Overall Rating</label>
                                        <Controller
                                            control={control}
                                            name="rating"
                                            render={({ field }) => <StarRating value={field.value} onChange={field.onChange} />}
                                        />
                                        {errors.rating && <p className="text-xs font-bold text-red-500 mt-2">{errors.rating.message}</p>}
                                    </div>
                                    <div className="md:col-span-12">
                                        <label className="text-sm font-bold text-primary dark:text-white block mb-2">Overall Feedback</label>
                                        <textarea
                                            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:border-primary focus:ring-0 min-h-[150px] text-primary dark:text-white"
                                            placeholder="Synthesize your feedback here. Mention strengths, weaknesses, and key observations..."
                                            {...register('comments')}
                                        />
                                        {errors.comments && <p className="text-xs font-bold text-red-500 mt-2">{errors.comments.message}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4">
                            <button type="button" onClick={() => navigate('/interviews')} className="px-6 py-3 font-bold text-primary/60 hover:text-primary dark:text-white/60 dark:hover:text-white transition-colors">Cancel</button>
                            <button
                                type="submit"
                                disabled={createMutation.isPending}
                                className="px-8 py-3 bg-primary dark:bg-white text-white dark:text-primary rounded-xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 dark:shadow-none"
                            >
                                {createMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default FeedbackForm
