import React, { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Briefcase, CalendarPlus, CheckCircle, Clock, Link as LinkIcon, User } from 'lucide-react'
import clsx from 'clsx'
import type { Candidate, Requirement } from '@/types'
import { api } from '@/services/api'
import { ApiError } from '@/lib/apiClient'
import { SearchableMultiSelect } from '@/components/ui/SearchableMultiSelect'
import { AppSelect } from '@/components/ui/AppSelect'
import { SCHEDULE_DURATION_OPTIONS } from '@/lib/selectOptions'
import { useToastStore } from '@/store/toastStore'
import { interviewerPanelHint } from '@/lib/interviewPanelLevels'

const schema = z.object({
  planStageId: z.string().min(1, 'Select an interview stage'),
  interviewerIds: z.array(z.string()).min(1, 'Select at least one interviewer'),
  scheduledAt: z.string().min(1, 'Date and time is required'),
  duration: z.number().min(15, 'Duration must be at least 15 minutes'),
  type: z.enum(['SCREENING', 'TECHNICAL', 'CULTURAL', 'SYSTEM_DESIGN', 'BEHAVIORAL']),
  meetingLink: z.string().url('Invalid URL').optional().or(z.literal('')),
  location: z.string().optional(),
  description: z.string().optional(),
})

type ScheduleFormValues = z.infer<typeof schema>

type CandidateInterviewScheduleFormProps = {
  candidate: Candidate
  requirement: Requirement
  selectedStageId: string | null
  onStageChange: (stageId: string) => void
  onScheduled?: () => void
}

const INTERVIEWER_ROLES = [
  'INTERVIEWER',
  'HIRING_MANAGER',
  'TEAM_LEAD',
  'RECRUITER',
  'SUPER_ADMIN',
  'ADMIN',
  'HR_HEAD',
  'HR_MANAGER',
] as const

export function CandidateInterviewScheduleForm({
  candidate,
  requirement,
  selectedStageId,
  onStageChange,
  onScheduled,
}: CandidateInterviewScheduleFormProps) {
  const { addToast } = useToastStore()
  const queryClient = useQueryClient()

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors } } =
    useForm<ScheduleFormValues>({
      resolver: zodResolver(schema),
      defaultValues: {
        duration: 60,
        type: 'TECHNICAL',
        interviewerIds: [],
        planStageId: '',
        scheduledAt: '',
        meetingLink: '',
        location: '',
        description: '',
      },
    })

  const planStageId = watch('planStageId')
  const watchInterviewerIds = watch('interviewerIds')

  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ['interview-progress', requirement.id, candidate.id],
    queryFn: () =>
      api.requirements.getCandidateInterviewProgress(requirement.id, candidate.id),
  })

  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: api.users.list })

  const interviewers = users.filter(
    (u) =>
      u.status === 'ACTIVE' &&
      INTERVIEWER_ROLES.includes(u.role as (typeof INTERVIEWER_ROLES)[number])
  )

  const selectedStageMeta = progress?.stages.find((s) => s.id === planStageId)
  const allowedInterviewerIds = selectedStageMeta?.allowedInterviewerIds ?? []

  const interviewerOptions = interviewers
    .filter((u) => allowedInterviewerIds.includes(u.uid))
    .map((u) => ({
      value: u.uid,
      label: u.name,
      sublabel: `${u.role.replace('_', ' ')} · ${u.email}`,
    }))

  const interviewerPanelHelp = selectedStageMeta
    ? interviewerPanelHint(
        selectedStageMeta.order,
        selectedStageMeta.panelRestrictionLabel,
        selectedStageMeta.usesCombinedPanel
      )
    : null

  const applyStageDefaults = (stageId: string) => {
    const stage = progress?.stages.find((s) => s.id === stageId)
    if (!stage) return
    const allowedSet = new Set(stage.allowedInterviewerIds)
    setValue('planStageId', stageId)
    setValue('type', stage.interviewType)
    setValue('duration', stage.defaultDuration)
    const defaults = stage.defaultInterviewerIds.filter((id) => allowedSet.has(id))
    if (defaults.length > 0) {
      setValue('interviewerIds', defaults)
    } else {
      setValue('interviewerIds', [])
    }
  }

  useEffect(() => {
    if (!progress) return
    const target =
      selectedStageId && progress.stages.find((s) => s.id === selectedStageId && s.canSchedule)
        ? selectedStageId
        : progress.nextSchedulableStageId
    if (target && target !== planStageId) {
      applyStageDefaults(target)
      if (!selectedStageId || selectedStageId !== target) {
        onStageChange(target)
      }
    }
  }, [progress, selectedStageId, planStageId])

  useEffect(() => {
    if (!selectedStageId || selectedStageId === planStageId) return
    const stage = progress?.stages.find((s) => s.id === selectedStageId && s.canSchedule)
    if (stage) applyStageDefaults(selectedStageId)
  }, [selectedStageId])

  useEffect(() => {
    if (!planStageId || allowedInterviewerIds.length === 0) return
    const allowed = new Set(allowedInterviewerIds)
    const current = watchInterviewerIds ?? []
    const pruned = current.filter((id) => allowed.has(id))
    if (pruned.length !== current.length) setValue('interviewerIds', pruned)
  }, [planStageId, allowedInterviewerIds, watchInterviewerIds, setValue])

  const canSubmit =
    candidate.status === 'INTERVIEW' &&
    !!planStageId &&
    !!selectedStageMeta?.canSchedule &&
    allowedInterviewerIds.length > 0

  if (candidate.status !== 'INTERVIEW') {
    return (
      <div className="rounded-2xl border border-amber-200/60 dark:border-amber-500/30 bg-amber-500/10 p-5 text-sm font-medium text-amber-900 dark:text-amber-200">
        Move {candidate.name} to <strong>Interview</strong> stage in the pipeline before scheduling a
        session.
      </div>
    )
  }

  const createMutation = useMutation({
    mutationFn: (data: ScheduleFormValues) =>
      api.interviews.create({
        candidateId: candidate.id,
        requirementId: requirement.id,
        planStageId: data.planStageId,
        interviewerIds: data.interviewerIds,
        scheduledAt: data.scheduledAt,
        duration: data.duration,
        type: data.type,
        meetingLink: data.meetingLink || undefined,
        location: data.location || undefined,
        description: data.description || undefined,
        status: 'SCHEDULED',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate-interviews', candidate.id] })
      queryClient.invalidateQueries({
        queryKey: ['interview-progress', requirement.id, candidate.id],
      })
      queryClient.invalidateQueries({ queryKey: ['interviews'] })
      queryClient.invalidateQueries({ queryKey: ['candidate-activity', candidate.id] })
      addToast(`Interview scheduled for ${candidate.name}`, 'success')
      reset({
        duration: 60,
        type: 'TECHNICAL',
        interviewerIds: [],
        planStageId: '',
        scheduledAt: '',
        meetingLink: '',
        location: '',
        description: '',
      })
      onStageChange('')
      onScheduled?.()
    },
    onError: (err: unknown) => {
      addToast(err instanceof ApiError ? err.message : 'Failed to schedule interview', 'error')
    },
  })

  const jobTitle = candidate.jobTitle || candidate.role

  if (progressLoading) {
    return (
      <div className="rounded-2xl border border-primary/10 dark:border-white/10 p-8 text-center text-sm font-medium text-primary/50 dark:text-white/50">
        Loading interview plan…
      </div>
    )
  }

  if (!progress?.nextSchedulableStageId && !progress?.stages.some((s) => s.canSchedule)) {
    return null
  }

  return (
    <section
      id="candidate-schedule-interview"
      className="rounded-2xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-primary/10 dark:border-white/10 bg-white dark:bg-white/5 flex items-center gap-3">
        <div className="size-10 rounded-xl bg-primary dark:bg-white flex items-center justify-center text-primary-foreground">
          <CalendarPlus size={20} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-primary dark:text-white">
            Schedule for {candidate.name}
          </h3>
          <p className="text-xs text-primary/50 dark:text-white/50">
            This form only schedules interviews for this candidate.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="p-5 md:p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-primary/10 dark:border-white/10 bg-white dark:bg-white/5 p-4 opacity-90">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <User size={12} /> Candidate
            </p>
            <p className="font-bold text-primary dark:text-white">{candidate.name}</p>
            <p className="text-xs text-primary/60 dark:text-white/60 mt-0.5 truncate">
              {[jobTitle, candidate.email].filter(Boolean).join(' · ')}
            </p>
          </div>
          <div className="rounded-xl border border-primary/10 dark:border-white/10 bg-white dark:bg-white/5 p-4 opacity-90">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Briefcase size={12} /> Job requirement
            </p>
            <p className="font-bold text-primary dark:text-white">{requirement.title}</p>
            <p className="text-xs text-primary/60 dark:text-white/60 mt-0.5">
              {[requirement.client, requirement.department].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>

        {selectedStageMeta && (
          <div className="p-4 rounded-xl border-2 border-primary dark:border-white bg-primary/5 dark:bg-white/10">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary/50 dark:text-white/50">
              Scheduling stage
            </p>
            <p className="text-base font-bold text-primary dark:text-white mt-0.5">
              {selectedStageMeta.name}
            </p>
            <p className="text-xs text-primary/50 dark:text-white/50 mt-0.5">
              {selectedStageMeta.interviewType.replace(/_/g, ' ')} · {selectedStageMeta.defaultDuration}{' '}
              min default
            </p>
          </div>
        )}

        <input type="hidden" {...register('planStageId')} />
        <input type="hidden" {...register('type')} />

        <div className="space-y-2">
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
                    : 'Add interviewer…'
                }
                searchPlaceholder="Search panel members…"
              />
            )}
          />
          {errors.interviewerIds && (
            <p className="text-xs font-bold text-red-500">{errors.interviewerIds.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider block">
              Date & time
            </label>
            <input
              type="datetime-local"
              className="w-full px-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-white dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-bold text-primary dark:text-white"
              {...register('scheduledAt')}
            />
            {errors.scheduledAt && (
              <p className="text-xs font-bold text-red-500">{errors.scheduledAt.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider block">
              Duration
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
              Meeting link
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/30" size={18} />
              <input
                type="text"
                placeholder="https://meet.google.com/…"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-white dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-medium text-primary dark:text-white"
                {...register('meetingLink')}
              />
            </div>
            {errors.meetingLink && (
              <p className="text-xs font-bold text-red-500">{errors.meetingLink.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={createMutation.isPending || !canSubmit}
            className={clsx(
              'inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all',
              'bg-primary text-primary-foreground',
              'hover:opacity-90 disabled:opacity-50 shadow-lg shadow-primary/15 dark:shadow-none'
            )}
          >
            {createMutation.isPending ? 'Scheduling…' : `Schedule for ${candidate.name.split(' ')[0]}`}
            {!createMutation.isPending && <CheckCircle size={18} />}
          </button>
        </div>
      </form>
    </section>
  )
}
