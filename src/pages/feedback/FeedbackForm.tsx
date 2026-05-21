import React, { useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm, useFieldArray, useFormState, Controller, type Control } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Download, Printer, ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { api } from '../../services/api'
import clsx from 'clsx'
import { useAuth } from '../../hooks/useAuth'
import { useToastStore } from '../../store/toastStore'
import { StarRatingDisplay, StarRatingInput } from '../../components/ui/StarRating'
import {
  PROFICIENCY_LEVELS,
  RECOMMENDATION_OPTIONS,
  COMPETENCY_TOPICS,
  createDefaultFormData,
  parseFormData,
  recommendationLabel,
  type InterviewFeedbackFormData,
} from '../../config/interviewFeedbackForm'
import { downloadFeedbackHtml, printFeedbackReport } from '../../lib/feedbackReport'
import type { Feedback } from '../../types'

const schema = z.object({
  recommendation: z.enum(['STRONG_HIRE', 'HIRE', 'ON_HOLD', 'NO_HIRE', 'STRONG_NO_HIRE']),
  comments: z.string().min(5, 'Please provide overall comments'),
  formData: z.object({
    skillAssessment: z.array(
      z.object({
        skillAssessed: z.string(),
        expectedProficiency: z.string(),
        possessProficiency: z.string(),
        rating: z.number().min(0).max(5),
        remarks: z.string(),
      })
    ),
    competencies: z.array(
      z.object({
        topic: z.string(),
        rating: z.number().min(0).max(5),
        remarks: z.string(),
      })
    ),
  }),
})

type FormValues = z.infer<typeof schema>

function computeScores(formData: InterviewFeedbackFormData) {
  const skillRatings = formData.skillAssessment.map((s) => s.rating).filter((r) => r > 0)
  const compRatings = formData.competencies.map((c) => c.rating).filter((r) => r > 0)
  const technicalRating = skillRatings.length
    ? Math.round(skillRatings.reduce((a, b) => a + b, 0) / skillRatings.length)
    : 0
  const comm = formData.competencies.find((c) =>
    c.topic.toLowerCase().includes('communication')
  )
  const communicationRating = comm?.rating ?? 0
  const all = [...skillRatings, ...compRatings]
  const rating = all.length ? Math.round(all.reduce((a, b) => a + b, 0) / all.length) : 0
  return { rating, technicalRating, communicationRating }
}

const tableInput =
  'w-full min-w-0 px-2 py-1.5 text-sm border border-slate-300 rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white'
const tableSelect = tableInput

/** Subscribes only to one field — avoids re-rendering the whole form on every keystroke. */
function FieldError({
  control,
  name,
}: {
  control: Control<FormValues>
  name: 'recommendation' | 'comments'
}) {
  const { errors } = useFormState({ control, name, exact: true })
  const message = errors[name]?.message
  if (!message) return null
  return <p className="text-xs text-red-500 mt-1">{message}</p>
}

function FeedbackReadOnly({ feedback, meta, onDownload, onPrint }: {
  feedback: Feedback
  meta: { candidateName: string; candidateRole?: string; interviewType: string; interviewDate: string; interviewerName: string }
  onDownload: () => void
  onPrint: () => void
}) {
  const formData = parseFormData(feedback.formData)

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3 justify-end">
        <button type="button" onClick={onPrint} className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-bold hover:bg-slate-50">
          <Printer size={16} /> Print
        </button>
        <button type="button" onClick={onDownload} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:opacity-90">
          <Download size={16} /> Download
        </button>
      </div>

      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-3 bg-slate-100 dark:bg-slate-800 border-b font-bold text-sm">Overall Feedback</div>
        <div className="p-6 space-y-3">
          <p><span className="font-bold text-slate-600">Recommendation:</span> {recommendationLabel(feedback.recommendation)}</p>
          <p className="font-bold text-slate-600">Comments:</p>
          <p className="text-sm whitespace-pre-wrap">{feedback.comments}</p>
        </div>
      </section>

      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-3 bg-slate-100 dark:bg-slate-800 border-b font-bold text-sm">Skill Assessment</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-left text-xs font-bold uppercase text-slate-600">
                <th className="p-3 border-b">Skill Assessed</th>
                <th className="p-3 border-b">Expected Proficiency</th>
                <th className="p-3 border-b">Possess Proficiency</th>
                <th className="p-3 border-b">Rating</th>
                <th className="p-3 border-b">Remarks / Comments</th>
              </tr>
            </thead>
            <tbody>
              {formData.skillAssessment.map((row, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="p-3">{row.skillAssessed || '—'}</td>
                  <td className="p-3">{row.expectedProficiency}</td>
                  <td className="p-3">{row.possessProficiency}</td>
                  <td className="p-3">
                    <StarRatingDisplay value={row.rating} />
                  </td>
                  <td className="p-3">{row.remarks || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-3 bg-slate-100 dark:bg-slate-800 border-b font-bold text-sm">Standard Competency Description</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-left text-xs font-bold uppercase text-slate-600">
                <th className="p-3 border-b w-[40%]">Topic</th>
                <th className="p-3 border-b w-[20%]">Rating</th>
                <th className="p-3 border-b">Remarks / Comments</th>
              </tr>
            </thead>
            <tbody>
              {formData.competencies.map((row, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="p-3 font-medium">{row.topic}</td>
                  <td className="p-3">
                    <StarRatingDisplay value={row.rating} />
                  </td>
                  <td className="p-3">{row.remarks || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-xs text-slate-500">
        Submitted {new Date(feedback.createdAt).toLocaleString()}
        {feedback.interviewerName ? ` by ${feedback.interviewerName}` : ''}
      </p>
    </div>
  )
}

const FeedbackForm = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { addToast } = useToastStore()

  const { data: interview, isLoading } = useQuery({
    queryKey: ['interview', id],
    queryFn: () => api.interviews.get(id!),
  })

  const { data: candidate } = useQuery({
    queryKey: ['candidate', interview?.candidateId],
    queryFn: () => api.candidates.get(interview!.candidateId),
    enabled: !!interview?.candidateId,
  })

  const { data: existingList = [] } = useQuery({
    queryKey: ['feedback', id],
    queryFn: () => api.feedback.getByInterviewId(id!),
    enabled: !!id,
  })

  const myFeedback = existingList.find((f) => f.interviewerId === user?.uid)
  const [viewId, setViewId] = React.useState<string | null>(null)
  const viewingFeedback = viewId
    ? existingList.find((f) => f.id === viewId)
    : myFeedback

  const defaultForm = useMemo(() => createDefaultFormData(), [])

  const { register, handleSubmit, control } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      recommendation: 'HIRE',
      comments: '',
      formData: defaultForm,
    },
  })

  const { fields: skillFields, append: appendSkill, remove: removeSkill } = useFieldArray({
    control,
    name: 'formData.skillAssessment',
  })

  const reportMeta = useMemo(
    () => ({
      candidateName: candidate?.name ?? 'Candidate',
      candidateRole: candidate?.role,
      interviewType: interview?.type ?? 'Interview',
      interviewDate: interview
        ? new Date(interview.scheduledAt).toLocaleString()
        : '',
      interviewerName: user?.name ?? 'Interviewer',
      jobTitle: candidate?.jobTitle ?? candidate?.role,
    }),
    [candidate, interview, user]
  )

  const createMutation = useMutation({
    mutationFn: (data: FormValues) => {
      const formData: InterviewFeedbackFormData = {
        skillAssessment: data.formData.skillAssessment,
        competencies: COMPETENCY_TOPICS.map((topic, i) => ({
          topic,
          rating: data.formData.competencies[i]?.rating ?? 0,
          remarks: data.formData.competencies[i]?.remarks ?? '',
        })),
      }
      const scores = computeScores(formData)
      return api.feedback.create({
        interviewId: id!,
        interviewerId: user!.uid,
        candidateId: interview!.candidateId,
        recommendation: data.recommendation,
        comments: data.comments,
        formData,
        ...scores,
      })
    },
    onSuccess: async (created) => {
      addToast('Feedback submitted', 'success')
      await api.interviews.updateStatus(id!, 'COMPLETED')
      queryClient.invalidateQueries({ queryKey: ['feedback', id] })
      setViewId(created.id)
    },
    onError: () => addToast('Failed to submit feedback', 'error'),
  })

  const handleDownload = (fb: Feedback) => {
    const name = `Interview_Feedback_${reportMeta.candidateName.replace(/\s+/g, '_')}.html`
    api.feedback.downloadHtml(fb.id, name).catch(() => {
      downloadFeedbackHtml(fb, reportMeta)
    })
  }

  if (isLoading) return <div className="p-8 text-center">Loading interview...</div>
  if (!interview) return <div className="p-8 text-center">Interview not found.</div>

  const showForm = !myFeedback && !viewId

  return (
    <div className="min-h-full -m-6 bg-slate-100 dark:bg-black">
      <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link to="/interviews" className="inline-flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-primary mb-2">
              <ArrowLeft size={16} /> Back to interviews
            </Link>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Interview Feedback Form</h1>
            <p className="text-sm text-slate-600 mt-1">
              {candidate?.name} · {interview.type} · {new Date(interview.scheduledAt).toLocaleString()}
            </p>
          </div>
        </div>

        {existingList.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {existingList.map((fb) => (
              <button
                key={fb.id}
                type="button"
                onClick={() => setViewId(fb.id)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-bold border',
                  (viewId === fb.id || (!viewId && fb.id === myFeedback?.id))
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white border-slate-200 text-slate-700'
                )}
              >
                {fb.interviewerName || 'Feedback'} · {new Date(fb.createdAt).toLocaleDateString()}
              </button>
            ))}
            {!myFeedback && (
              <button
                type="button"
                onClick={() => setViewId(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-dashed border-primary text-primary"
              >
                + Add your feedback
              </button>
            )}
          </div>
        )}

        {viewingFeedback && !showForm ? (
          <FeedbackReadOnly
            feedback={viewingFeedback}
            meta={reportMeta}
            onDownload={() => handleDownload(viewingFeedback)}
            onPrint={() => printFeedbackReport(viewingFeedback, reportMeta)}
          />
        ) : (
          <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-8">
            {/* Overall Feedback */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-6 py-3 bg-slate-800 text-white font-bold text-sm">Overall Feedback</div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                    Recommendation
                  </label>
                  <select className={tableSelect} {...register('recommendation')}>
                    {RECOMMENDATION_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <FieldError control={control} name="recommendation" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                    Recommendation / Comments
                  </label>
                  <textarea
                    className={clsx(tableInput, 'min-h-[100px]')}
                    placeholder="Overall feedback and recommendation comments..."
                    {...register('comments')}
                  />
                  <FieldError control={control} name="comments" />
                </div>
              </div>
            </section>

            {/* Skill Assessment */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-6 py-3 bg-slate-800 text-white font-bold text-sm flex justify-between items-center">
                <span>Skill Assessment</span>
                <button
                  type="button"
                  onClick={() =>
                    appendSkill({
                      skillAssessed: '',
                      expectedProficiency: 'Not Assessed',
                      possessProficiency: 'Not Assessed',
                      rating: 0,
                      remarks: '',
                    })
                  }
                  className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded flex items-center gap-1"
                >
                  <Plus size={14} /> Add row
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm table-fixed">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold uppercase text-slate-600">
                      <th className="p-3 border-b text-left w-[18%]">Skill Assessed</th>
                      <th className="p-3 border-b text-left w-[16%]">Expected Proficiency</th>
                      <th className="p-3 border-b text-left w-[16%]">Possess Proficiency</th>
                      <th className="p-3 border-b text-left w-[20%]">Rating</th>
                      <th className="p-3 border-b text-left">Remarks / Comments</th>
                      <th className="p-3 border-b w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {skillFields.map((field, index) => (
                      <tr key={field.id} className="border-b border-slate-100">
                        <td className="p-2 min-w-0">
                          <input
                            className={tableInput}
                            placeholder="e.g. React, SQL..."
                            {...register(`formData.skillAssessment.${index}.skillAssessed`)}
                          />
                        </td>
                        <td className="p-2 min-w-0">
                          <select
                            className={tableSelect}
                            {...register(`formData.skillAssessment.${index}.expectedProficiency`)}
                          >
                            {PROFICIENCY_LEVELS.map((l) => (
                              <option key={l} value={l}>
                                {l}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2 min-w-0">
                          <select
                            className={tableSelect}
                            {...register(`formData.skillAssessment.${index}.possessProficiency`)}
                          >
                            {PROFICIENCY_LEVELS.map((l) => (
                              <option key={l} value={l}>
                                {l}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2 min-w-0">
                          <Controller
                            control={control}
                            name={`formData.skillAssessment.${index}.rating`}
                            render={({ field }) => (
                              <StarRatingInput
                                value={field.value}
                                onChange={field.onChange}
                                aria-label={`Skill rating row ${index + 1}`}
                              />
                            )}
                          />
                        </td>
                        <td className="p-2 min-w-0">
                          <input
                            className={tableInput}
                            {...register(`formData.skillAssessment.${index}.remarks`)}
                          />
                        </td>
                        <td className="p-2">
                          {skillFields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSkill(index)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                              aria-label="Remove row"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Standard Competency */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-6 py-3 bg-slate-800 text-white font-bold text-sm">
                Standard Competency Description
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm table-fixed">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold uppercase text-slate-600">
                      <th className="p-3 border-b text-left w-[42%]">Topic</th>
                      <th className="p-3 border-b text-left w-[28%]">Rating</th>
                      <th className="p-3 border-b text-left">Remarks / Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPETENCY_TOPICS.map((topic, index) => (
                      <tr key={topic} className="border-b border-slate-100">
                        <td className="p-3 font-medium text-slate-800 dark:text-slate-200 align-top">
                          {topic}
                        </td>
                        <td className="p-2 align-top min-w-0">
                          <Controller
                            control={control}
                            name={`formData.competencies.${index}.rating`}
                            render={({ field }) => (
                              <StarRatingInput
                                value={field.value}
                                onChange={field.onChange}
                                aria-label={`Competency rating: ${topic}`}
                              />
                            )}
                          />
                        </td>
                        <td className="p-2 align-top min-w-0">
                          <input
                            className={tableInput}
                            {...register(`formData.competencies.${index}.remarks`)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/interviews')}
                className="px-6 py-3 font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-8 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default FeedbackForm
