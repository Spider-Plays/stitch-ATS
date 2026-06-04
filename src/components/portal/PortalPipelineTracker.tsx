import clsx from 'clsx'
import type { CandidateStatus } from '../../types'
import {
  PORTAL_PIPELINE_STEPS,
  pipelineStepIndex,
  isTerminalStatus,
} from '../../lib/portalWorkflow'

type PortalPipelineTrackerProps = {
  status: CandidateStatus
  compact?: boolean
}

export function PortalPipelineTracker({ status, compact }: PortalPipelineTrackerProps) {
  const rejected = status === 'REJECTED'
  const currentIdx = pipelineStepIndex(status)

  if (rejected) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 font-medium">
        Your application was not progressed further at this time. Thank you for your interest.
      </div>
    )
  }

  return (
    <div className={clsx('space-y-3', compact && 'space-y-2')}>
      <div className="flex items-center justify-between gap-2">
        {PORTAL_PIPELINE_STEPS.map((step, i) => {
          const done = i < currentIdx
          const active = i === currentIdx
          return (
            <div key={step.status} className="flex-1 flex flex-col items-center gap-1 min-w-0">
              <div
                className={clsx(
                  'size-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-colors',
                  done && 'bg-emerald-600 border-emerald-600 text-white',
                  active && 'bg-[#0f3d38] border-[#0f3d38] text-white ring-4 ring-emerald-100',
                  !done && !active && 'bg-white border-slate-200 text-slate-400'
                )}
              >
                {done ? (
                  <span className="material-symbols-outlined text-base">check</span>
                ) : (
                  i + 1
                )}
              </div>
              {!compact && (
                <span
                  className={clsx(
                    'text-[10px] font-bold text-center leading-tight',
                    active ? 'text-[#0f3d38]' : 'text-slate-500'
                  )}
                >
                  {step.label}
                </span>
              )}
            </div>
          )
        })}
      </div>
      {!compact && !isTerminalStatus(status) && (
        <p className="text-xs text-slate-500 text-center">
          {PORTAL_PIPELINE_STEPS[currentIdx]?.description}
        </p>
      )}
    </div>
  )
}
