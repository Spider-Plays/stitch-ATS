import React from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Check,
  Lock,
  Calendar,
  AlertCircle,
  X,
  Circle,
  MessageSquare,
  Plus,
  Trash2,
} from 'lucide-react'
import clsx from 'clsx'
import type {
  CandidateInterviewProgress,
  InterviewStageProgress,
  InterviewStageProgressStatus,
} from '../../../types'
import {
  INTERVIEW_STAGE_STATUS_LABEL,
  interviewStageCardClass,
  interviewStageDotClass,
} from '../../../lib/interviewStageProgress'
import { api } from '../../../services/api'
import { useToastStore } from '../../../store/toastStore'
import { useConfirm } from '../../../hooks/useConfirm'
import { ApiError } from '../../../lib/apiClient'
import { insertPlanStage, removePlanStage } from '../../../lib/interviewPlanEdit'

type CandidateInterviewPipelineProps = {
  requirementId: string
  progress: CandidateInterviewProgress
  selectedStageId: string | null
  onSelectStage: (stageId: string) => void
  canManage: boolean
  canEditPlan: boolean
}

function StageIcon({ status }: { status: InterviewStageProgressStatus }) {
  const size = 14
  switch (status) {
    case 'completed':
      return <Check size={size} className="text-white" />
    case 'failed':
      return <X size={size} className="text-white" />
    case 'awaiting_feedback':
      return <AlertCircle size={size} className="text-white" />
    case 'scheduled':
      return <Calendar size={size} className="text-white" />
    case 'available':
      return <Circle size={size} className="text-white fill-white" />
    default:
      return <Lock size={size} className="text-primary/50 dark:text-white/50" />
  }
}

function StageInsertBetween({ onInsert, disabled }: { onInsert: () => void; disabled?: boolean }) {
  return (
    <div className="group/insert relative flex w-5 sm:w-8 shrink-0 items-center justify-center self-stretch">
      <div
        className="absolute inset-y-3 left-1/2 w-px -translate-x-1/2 bg-transparent group-hover/insert:bg-primary/15 dark:group-hover/insert:bg-white/15 transition-colors"
        aria-hidden
      />
      <button
        type="button"
        onClick={onInsert}
        disabled={disabled}
        title="Add stage here"
        aria-label="Add interview stage"
        className={clsx(
          'relative z-10 flex size-7 sm:size-8 items-center justify-center rounded-full border-2 border-dashed transition-all',
          'border-primary/20 dark:border-white/20 text-primary dark:text-white',
          'opacity-0 scale-75 group-hover/insert:opacity-100 group-hover/insert:scale-100',
          'hover:border-primary hover:bg-primary hover:text-primary-foreground',
          'focus-visible:opacity-100 focus-visible:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
          disabled && 'pointer-events-none opacity-0'
        )}
      >
        <Plus size={16} strokeWidth={2.5} />
      </button>
    </div>
  )
}

type StageCardProps = {
  stage: InterviewStageProgress
  index: number
  selected: boolean
  clickable: boolean
  canEditPlan: boolean
  canRemove: boolean
  saving: boolean
  onSelect: () => void
  onRemove: () => void
}

function StageCard({
  stage,
  index,
  selected,
  clickable,
  canEditPlan,
  canRemove,
  saving,
  onSelect,
  onRemove,
}: StageCardProps) {
  const feedbackDue = stage.status === 'awaiting_feedback' && stage.interviewId

  return (
    <div
      className={clsx(
        'relative flex-1 min-w-[200px] max-w-[280px] rounded-xl border-2 p-4 transition-all',
        interviewStageCardClass(stage.status, selected),
        clickable && 'cursor-pointer',
        !clickable && !feedbackDue && 'cursor-default'
      )}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={() => {
        if (clickable) onSelect()
      }}
      onKeyDown={(e) => {
        if (clickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onSelect()
        }
      }}
    >
      {canEditPlan && canRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          disabled={saving}
          title="Remove stage"
          aria-label={`Remove ${stage.name}`}
          className="absolute top-2 right-2 p-1.5 rounded-lg text-primary/30 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
        >
          <Trash2 size={14} />
        </button>
      )}

      <div className="flex items-start gap-3">
        <div
          className={clsx(
            'size-8 rounded-full flex items-center justify-center shrink-0 ring-4',
            interviewStageDotClass(stage.status)
          )}
        >
          <StageIcon status={stage.status} />
        </div>
        <div className="min-w-0 flex-1 pr-6">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Round {index + 1}
          </p>
          <p className="text-sm font-bold text-primary dark:text-white mt-0.5 truncate">
            {stage.name}
          </p>
          <p className="text-[10px] font-medium text-primary/50 dark:text-white/50 mt-1">
            {INTERVIEW_STAGE_STATUS_LABEL[stage.status]}
          </p>
          {feedbackDue && (
            <Link
              to={`/interviews/${stage.interviewId}/feedback`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-200 hover:underline"
            >
              <MessageSquare size={12} />
              Submit feedback
            </Link>
          )}
          {clickable && selected && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary dark:text-white mt-2">
              Selected for scheduling ↓
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export function CandidateInterviewPipeline({
  requirementId,
  progress,
  selectedStageId,
  onSelectStage,
  canManage,
  canEditPlan,
}: CandidateInterviewPipelineProps) {
  const queryClient = useQueryClient()
  const { addToast } = useToastStore()
  const confirm = useConfirm()

  const { data: plan } = useQuery({
    queryKey: ['interview-plan', requirementId],
    queryFn: () => api.requirements.getInterviewPlan(requirementId),
    enabled: canEditPlan && !!requirementId,
  })

  const saveMutation = useMutation({
    mutationFn: (stages: Parameters<typeof api.requirements.updateInterviewPlan>[1]) =>
      api.requirements.updateInterviewPlan(requirementId, stages),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview-plan', requirementId] })
      queryClient.invalidateQueries({ queryKey: ['interview-progress', requirementId] })
      addToast('Interview stages updated', 'success')
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Failed to update interview stages'
      addToast(msg, 'error')
    },
  })

  const handleInsertAt = (insertIndex: number) => {
    if (!plan) {
      addToast('Loading interview plan… try again in a moment', 'error')
      return
    }
    const payload = insertPlanStage(plan, insertIndex)
    saveMutation.mutate(payload)
  }

  const handleRemove = async (stage: InterviewStageProgress) => {
    if (!plan) return
    if (progress.stages.length <= 1) {
      addToast('At least one interview stage is required', 'error')
      return
    }

    const hasActivity =
      stage.interviewId ||
      stage.status === 'scheduled' ||
      stage.status === 'awaiting_feedback' ||
      stage.status === 'completed' ||
      stage.status === 'failed'

    const ok = await confirm({
      title: 'Remove interview stage',
      message: hasActivity
        ? `"${stage.name}" has interview activity. Removal may fail if any candidate has interviews on this stage.`
        : `Remove "${stage.name}" from this job's pipeline? This applies to all candidates on the role.`,
      confirmLabel: 'Remove stage',
      variant: 'danger',
    })
    if (!ok) return

    const payload = removePlanStage(plan, stage.id)
    saveMutation.mutate(payload)
  }

  const canRemoveStage = (stage: InterviewStageProgress) =>
    progress.stages.length > 1 &&
    !stage.interviewId &&
    stage.status !== 'scheduled' &&
    stage.status !== 'awaiting_feedback' &&
    stage.status !== 'completed' &&
    stage.status !== 'failed'

  const hasInFlightInterview = progress.stages.some(
    (s) => s.status === 'scheduled' || s.status === 'awaiting_feedback'
  )

  const showNoStageReadyMessage =
    canManage && !progress.nextSchedulableStageId && !hasInFlightInterview

  const layoutClass = canEditPlan
    ? 'flex items-stretch gap-0 overflow-x-auto pb-2 custom-scrollbar'
    : 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3'

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-primary dark:text-white">Pipeline stages</h3>
          <p className="text-xs text-primary/50 dark:text-white/50 mt-0.5">
            Interview rounds for this candidate on this job, in order.
            {canEditPlan && ' Hover between rounds to add a stage, or use the trash icon to remove one.'}
          </p>
        </div>
        {canEditPlan && saveMutation.isPending && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary/50 dark:text-white/50">
            Saving…
          </span>
        )}
      </div>

      <div className={layoutClass}>
        {canEditPlan && (
          <StageInsertBetween
            onInsert={() => handleInsertAt(0)}
            disabled={saveMutation.isPending}
          />
        )}
        {progress.stages.map((stage, index) => {
          const selected = selectedStageId === stage.id
          const clickable = canManage && stage.canSchedule

          return (
            <React.Fragment key={stage.id}>
              {canEditPlan && index > 0 && (
                <StageInsertBetween
                  onInsert={() => handleInsertAt(index)}
                  disabled={saveMutation.isPending}
                />
              )}
              <StageCard
                stage={stage}
                index={index}
                selected={selected}
                clickable={clickable}
                canEditPlan={canEditPlan}
                canRemove={canRemoveStage(stage)}
                saving={saveMutation.isPending}
                onSelect={() => onSelectStage(stage.id)}
                onRemove={() => handleRemove(stage)}
              />
            </React.Fragment>
          )
        })}
        {canEditPlan && (
          <StageInsertBetween
            onInsert={() => handleInsertAt(progress.stages.length)}
            disabled={saveMutation.isPending}
          />
        )}
      </div>

      {showNoStageReadyMessage && (
        <p className="text-xs font-medium text-amber-800 dark:text-amber-200 px-1">
          No stage is ready to schedule. Complete pending feedback or earlier rounds first.
        </p>
      )}
    </section>
  )
}
