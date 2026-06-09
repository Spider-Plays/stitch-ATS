import React from 'react'
import clsx from 'clsx'
import type { Candidate, CandidateStatus } from '../../types'
import { stageDotColor } from '@/pages/pipeline/board/pipeline.utils'
import { candidateStatusClass } from '@/pages/candidates/_shared/candidate.utils'
import { PipelineKanbanCard } from './PipelineKanbanCard'

interface PipelineKanbanColumnProps {
  stage: CandidateStatus
  title: string
  candidates: Candidate[]
  canManage: boolean
  userRole?: string | null
  showJob?: boolean
  highlighted?: boolean
  dimmed?: boolean
  onMoveStage: (candidate: Candidate, status: CandidateStatus) => void
}

export function PipelineKanbanColumn({
  stage,
  title,
  candidates,
  canManage,
  userRole,
  showJob,
  highlighted,
  dimmed,
  onMoveStage,
}: PipelineKanbanColumnProps) {
  return (
    <div
      data-stage={stage}
      className={clsx(
        'kanban-column flex-shrink-0 w-[min(100%,18rem)] sm:w-72 flex flex-col max-h-[calc(100vh-14rem)] transition-opacity',
        dimmed && 'opacity-40 pointer-events-none',
        highlighted && 'opacity-100 ring-2 ring-brand/20 shadow-glow'
      )}
    >
      <div
        className={clsx(
          'flex items-center justify-between gap-2 px-1 mb-3 pb-3 border-b border-primary/10 dark:border-white/10',
          highlighted && 'border-primary/30 dark:border-white/30'
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className={clsx('size-2.5 rounded-full shrink-0', stageDotColor(stage))} />
          <h3 className="text-xs font-bold uppercase tracking-wider text-primary dark:text-white truncate">
            {title}
          </h3>
          <span
            className={clsx(
              'flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums border',
              candidateStatusClass(stage)
            )}
          >
            {candidates.length}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-1 pb-4 min-h-[8rem]">
        {candidates.map((c) => (
          <PipelineKanbanCard
            key={c.id}
            candidate={c}
            canManage={canManage}
            userRole={userRole}
            showJob={showJob}
            onMoveStage={onMoveStage}
          />
        ))}

        {candidates.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[7rem] rounded-xl border-2 border-dashed border-border/80 bg-card/50 shadow-inner text-center px-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Empty
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
