import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, Trash2, GripVertical, Save } from 'lucide-react'
import clsx from 'clsx'
import { api } from '../../services/api'
import { InterviewPlanStage } from '../../types'
import { useToastStore } from '../../store/toastStore'
import { ApiError } from '../../lib/apiClient'
import { AppSelect } from '../ui/AppSelect'
import { INTERVIEW_DURATION_OPTIONS } from '../../lib/selectOptions'

type EditableStage = {
  clientId: string
  id?: string
  name: string
  interviewType: InterviewPlanStage['interviewType']
  defaultDuration: number
}

const INTERVIEW_TYPES: InterviewPlanStage['interviewType'][] = [
  'TECHNICAL',
  'CULTURAL',
  'SCREENING',
  'BEHAVIORAL',
  'SYSTEM_DESIGN',
]

function newClientId(): string {
  return crypto.randomUUID()
}

interface InterviewPlanEditorProps {
  requirementId: string
  canEdit: boolean
}

type SortableStageRowProps = {
  stage: EditableStage
  index: number
  canEdit: boolean
  canRemove: boolean
  onUpdate: (patch: Partial<EditableStage>) => void
  onRemove: () => void
}

function SortableStageRow({
  stage,
  index,
  canEdit,
  canRemove,
  onUpdate,
  onRemove,
}: SortableStageRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stage.clientId,
    disabled: !canEdit,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={clsx(
        'flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02]',
        isDragging && 'z-10 shadow-lg ring-2 ring-primary/20 dark:ring-white/20 opacity-95'
      )}
    >
      <div className="flex items-center gap-2 shrink-0 text-muted-foreground">
        {canEdit ? (
          <button
            type="button"
            className="p-1 -m-1 cursor-grab active:cursor-grabbing touch-none rounded hover:text-primary dark:hover:text-white"
            aria-label={`Drag to reorder stage ${index + 1}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical size={18} />
          </button>
        ) : (
          <GripVertical size={18} className="opacity-40" />
        )}
        <span className="text-xs font-bold uppercase w-6 tabular-nums">{index + 1}</span>
      </div>
      <input
        type="text"
        value={stage.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        onPointerDown={(e) => e.stopPropagation()}
        disabled={!canEdit}
        className="flex-1 px-3 py-2 rounded-lg border border-primary/10 dark:border-white/10 bg-white dark:bg-white/5 font-bold text-sm text-primary dark:text-white disabled:opacity-60"
        placeholder="Round name"
        aria-label={`Round ${index + 1} name`}
      />
      <div className="min-w-[120px]" onPointerDown={(e) => e.stopPropagation()}>
        <AppSelect
          className="w-full"
          size="sm"
          value={stage.interviewType}
          onChange={(v) =>
            onUpdate({
              interviewType: v as InterviewPlanStage['interviewType'],
            })
          }
          disabled={!canEdit}
          options={INTERVIEW_TYPES.map((t) => ({
            value: t,
            label: t.replace('_', ' '),
          }))}
          aria-label="Interview type"
        />
      </div>
      <div className="min-w-[100px]" onPointerDown={(e) => e.stopPropagation()}>
        <AppSelect
          className="w-full"
          size="sm"
          value={String(stage.defaultDuration)}
          onChange={(v) => onUpdate({ defaultDuration: Number(v) })}
          disabled={!canEdit}
          options={INTERVIEW_DURATION_OPTIONS}
          aria-label="Duration"
        />
      </div>
      {canEdit && canRemove && (
        <button
          type="button"
          onClick={onRemove}
          onPointerDown={(e) => e.stopPropagation()}
          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
          title="Remove stage"
        >
          <Trash2 size={18} />
        </button>
      )}
    </li>
  )
}

export function InterviewPlanEditor({ requirementId, canEdit }: InterviewPlanEditorProps) {
  const queryClient = useQueryClient()
  const { addToast } = useToastStore()
  const [stages, setStages] = useState<EditableStage[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const { data: plan, isLoading } = useQuery({
    queryKey: ['interview-plan', requirementId],
    queryFn: () => api.requirements.getInterviewPlan(requirementId),
  })

  useEffect(() => {
    if (!plan) return
    setStages(
      plan.stages.map((s) => ({
        clientId: s.id,
        id: s.id,
        name: s.name,
        interviewType: s.interviewType,
        defaultDuration: s.defaultDuration,
      }))
    )
  }, [plan])

  const saveMutation = useMutation({
    mutationFn: () =>
      api.requirements.updateInterviewPlan(
        requirementId,
        stages.map((s) => ({
          ...(s.id ? { id: s.id } : {}),
          name: s.name,
          interviewType: s.interviewType,
          defaultDuration: s.defaultDuration,
        }))
      ),
    onSuccess: (saved) => {
      setStages(
        saved.stages.map((s) => ({
          clientId: s.id,
          id: s.id,
          name: s.name,
          interviewType: s.interviewType,
          defaultDuration: s.defaultDuration,
        }))
      )
      queryClient.invalidateQueries({ queryKey: ['interview-plan', requirementId] })
      addToast('Interview stages updated', 'success')
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Failed to save interview stages'
      addToast(msg, 'error')
    },
  })

  const addStage = () => {
    setStages((prev) => [
      ...prev,
      {
        clientId: newClientId(),
        name: `Stage ${prev.length + 1}`,
        interviewType: 'TECHNICAL',
        defaultDuration: 60,
      },
    ])
  }

  const removeStage = (clientId: string) => {
    if (stages.length <= 1) return
    setStages((prev) => prev.filter((s) => s.clientId !== clientId))
  }

  const updateStage = (clientId: string, patch: Partial<EditableStage>) => {
    setStages((prev) => prev.map((s) => (s.clientId === clientId ? { ...s, ...patch } : s)))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setStages((prev) => {
      const oldIndex = prev.findIndex((s) => s.clientId === active.id)
      const newIndex = prev.findIndex((s) => s.clientId === over.id)
      if (oldIndex < 0 || newIndex < 0) return prev
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground font-medium py-8 text-center">
        Loading interview plan...
      </p>
    )
  }

  const stageList = (
    <ol className="space-y-3">
      {stages.map((stage, index) => (
        <SortableStageRow
          key={stage.clientId}
          stage={stage}
          index={index}
          canEdit={canEdit}
          canRemove={stages.length > 1}
          onUpdate={(patch) => updateStage(stage.clientId, patch)}
          onRemove={() => removeStage(stage.clientId)}
        />
      ))}
    </ol>
  )

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-primary dark:text-white">Interview stages</h3>
        <p className="text-sm text-primary/60 dark:text-white/60 mt-1">
          Candidates must complete each stage (including feedback) before the next can be scheduled.
          Default: L1 → L2 → HR.
          {canEdit && ' Edit round names inline, drag to reorder, then click Save stages.'}
        </p>
      </div>

      {canEdit ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={stages.map((s) => s.clientId)} strategy={verticalListSortingStrategy}>
            {stageList}
          </SortableContext>
        </DndContext>
      ) : (
        stageList
      )}

      {canEdit && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={addStage}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-primary/20 dark:border-white/20 text-sm font-bold text-primary dark:text-white hover:bg-primary/5 dark:hover:bg-white/5 transition-colors"
          >
            <Plus size={16} /> Add stage
          </button>
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || stages.some((s) => !s.name.trim())}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all"
          >
            <Save size={16} />
            {saveMutation.isPending ? 'Saving...' : 'Save stages'}
          </button>
        </div>
      )}

      {!canEdit && (
        <p className="text-xs text-muted-foreground font-medium">
          Only recruiters and admins can edit interview stages.
        </p>
      )}
    </div>
  )
}
