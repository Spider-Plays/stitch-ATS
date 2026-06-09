import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Clock, GitBranch, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'
import { api } from '../../services/api'
import { Requirement, RequirementHiringStage } from '../../types'
import { useToastStore } from '../../store/toastStore'
import { ApiError } from '../../lib/apiClient'
import { computeRequirementAgeing, hiringStageClass, hiringStageLabel } from '../../lib/requirementHiring'
import { AppSelect } from '../ui/AppSelect'
import { hiringStageSelectOptions } from '../../lib/selectOptions'
import { requirementStatusClass, requirementStatusLabel } from '@/pages/requirements/_shared/requirement.utils'
import { canUpdateHiringStage } from '@/permissions'

type RequirementHiringPanelProps = {
  requirement: Requirement
  userRole?: string | null
}

function AgeMetric({ label, value, hint, warn }: { label: string; value: string; hint?: string; warn?: boolean }) {
  return (
    <div className="rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] p-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-primary/50 dark:text-white/50">{label}</p>
      <p
        className={clsx(
          'text-lg font-black tabular-nums mt-0.5',
          warn ? 'text-red-600 dark:text-red-400' : 'text-primary dark:text-white'
        )}
      >
        {value}
      </p>
      {hint && <p className="text-[10px] text-primary/45 dark:text-white/45 mt-0.5">{hint}</p>}
    </div>
  )
}

export function RequirementHiringPanel({ requirement, userRole }: RequirementHiringPanelProps) {
  const queryClient = useQueryClient()
  const { addToast } = useToastStore()
  const ageing = computeRequirementAgeing(requirement)
  const canEditStage = canUpdateHiringStage(userRole, requirement)
  const stage = requirement.hiringStage ?? 'SOURCING'

  const stageMutation = useMutation({
    mutationFn: (hiringStage: RequirementHiringStage) =>
      api.requirements.updateHiringStage(requirement.id, hiringStage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requirement', requirement.id] })
      queryClient.invalidateQueries({ queryKey: ['requirements'] })
      addToast('Hiring stage updated', 'success')
    },
    onError: (err: unknown) => {
      addToast(err instanceof ApiError ? err.message : 'Failed to update hiring stage', 'error')
    },
  })

  return (
    <div className="app-card border-slate-200 p-6 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Position status</h3>
        <span
          className={clsx(
            'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border shrink-0',
            requirementStatusClass(requirement.status)
          )}
        >
          {requirementStatusLabel(requirement.status)}
        </span>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
          <GitBranch size={12} /> Current hiring stage
        </p>
        {canEditStage ? (
          <AppSelect
            variant="filled"
            value={stage}
            disabled={stageMutation.isPending}
            onChange={(v) => stageMutation.mutate(v as RequirementHiringStage)}
            options={hiringStageSelectOptions()}
            aria-label="Current hiring stage"
          />
        ) : (
          <p
            className={clsx(
              'inline-flex text-sm font-bold px-3 py-2 rounded-xl border',
              hiringStageClass(stage)
            )}
          >
            {hiringStageLabel(stage)}
          </p>
        )}
        {!canEditStage && (
          <p className="text-[10px] text-primary/50 dark:text-white/50">
            {requirement.status === 'CANCELLED'
              ? 'This requirement was cancelled.'
              : requirement.status === 'ON_HOLD' || requirement.status === 'LIVE'
                ? 'Only recruiters, HR managers, and team leads can update hiring stage.'
                : 'Hiring stage can be updated when the job is live or on hold.'}
          </p>
        )}
      </div>

      <div className="space-y-3 pt-2 border-t border-primary/10 dark:border-white/10">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
          <Clock size={12} /> Requirement ageing
        </p>
        <div className="grid grid-cols-2 gap-2">
          <AgeMetric label="Total age" value={`${ageing.totalDaysOpen}d`} hint={`Since ${ageing.createdLabel}`} />
          <AgeMetric
            label="Active sourcing"
            value={ageing.daysSinceLive != null ? `${ageing.daysSinceLive}d` : '—'}
            hint={
              ageing.liveSinceLabel ? `Live since ${ageing.liveSinceLabel}` : 'Not live yet'
            }
          />
          {requirement.status === 'ON_HOLD' && (
            <AgeMetric
              label="On hold"
              value={ageing.daysOnHold != null ? `${ageing.daysOnHold}d` : '—'}
              hint={
                ageing.onHoldSinceLabel ? `Since ${ageing.onHoldSinceLabel}` : undefined
              }
              warn
            />
          )}
          {ageing.daysToDeadline != null && (
            <AgeMetric
              label="To deadline"
              value={
                ageing.deadlineOverdue
                  ? `${Math.abs(ageing.daysToDeadline)}d overdue`
                  : `${ageing.daysToDeadline}d left`
              }
              warn={ageing.deadlineOverdue}
            />
          )}
        </div>
        {ageing.deadlineOverdue && (
          <p className="text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1.5">
            <AlertTriangle size={14} /> Past the hiring deadline
          </p>
        )}
      </div>
    </div>
  )
}
