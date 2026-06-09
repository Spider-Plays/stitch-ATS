import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PauseCircle, PlayCircle, Eye, EyeOff, Ban, X, Users, Briefcase } from 'lucide-react'
import clsx from 'clsx'
import { api } from '../../services/api'
import { Requirement } from '../../types'
import { useToastStore } from '../../store/toastStore'
import { useConfirm } from '../../hooks/useConfirm'
import { ApiError } from '../../lib/apiClient'
import { formatDateLabel } from '../../lib/requirementFields'
import {
  canControlPortalVisibility,
  canManageRequirementPosting,
} from '@/permissions'
import { Modal } from '../ui/Modal'

type RequirementPortalControlsProps = {
  requirement: Requirement
  userRole?: string | null
  userId?: string
  userName?: string
}

export function RequirementPortalControls({
  requirement,
  userRole,
  userId,
  userName,
}: RequirementPortalControlsProps) {
  const queryClient = useQueryClient()
  const { addToast } = useToastStore()
  const confirm = useConfirm()
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [closureReason, setClosureReason] = useState('')
  const [closedAt, setClosedAt] = useState('')

  const canPost = canManageRequirementPosting(userRole, requirement, {
    uid: userId ?? '',
    name: userName,
  })
  const canVisibility = canControlPortalVisibility(userRole)

  const isLive = requirement.status === 'LIVE'
  const isOnHold = requirement.status === 'ON_HOLD'
  const isClosed = requirement.status === 'CLOSED' || requirement.status === 'CANCELLED'
  const isCancelled = requirement.status === 'CANCELLED'
  const canPostToPortals = isLive && !isOnHold
  const portalVisible = requirement.visibleToCandidates ?? true
  const referralVisible = requirement.visibleToReferrals ?? true
  const [bonusInput, setBonusInput] = React.useState(
    requirement.referralBonusAmount != null ? String(requirement.referralBonusAmount) : ''
  )
  const showActions = canPost && (isLive || isOnHold)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['requirement', requirement.id] })
    queryClient.invalidateQueries({ queryKey: ['requirements'] })
  }

  const holdMutation = useMutation({
    mutationFn: () => api.requirements.updateStatus(requirement.id, 'ON_HOLD'),
    onSuccess: () => {
      invalidate()
      addToast('Requirement placed on hold', 'success')
    },
    onError: (err: unknown) => {
      addToast(err instanceof ApiError ? err.message : 'Failed to update status', 'error')
    },
  })

  const releaseMutation = useMutation({
    mutationFn: () => api.requirements.updateStatus(requirement.id, 'LIVE'),
    onSuccess: () => {
      invalidate()
      addToast('Requirement is live again', 'success')
    },
    onError: (err: unknown) => {
      addToast(err instanceof ApiError ? err.message : 'Failed to update status', 'error')
    },
  })

  const referralVisibilityMutation = useMutation({
    mutationFn: (visible: boolean) => {
      const bonus =
        bonusInput.trim() === '' ? null : Number.parseInt(bonusInput.replace(/,/g, ''), 10)
      return api.requirements.setReferralVisibility(
        requirement.id,
        visible,
        Number.isNaN(bonus as number) ? null : bonus
      )
    },
    onSuccess: (_data, visible) => {
      invalidate()
      addToast(
        visible ? 'Posted to employee portal' : 'Removed from employee portal',
        'success'
      )
    },
    onError: (err: unknown) => {
      addToast(err instanceof ApiError ? err.message : 'Failed to update referral settings', 'error')
    },
  })

  const visibilityMutation = useMutation({
    mutationFn: (visible: boolean) => api.requirements.setVisibility(requirement.id, visible),
    onSuccess: (_data, visible) => {
      invalidate()
      addToast(
        visible ? 'Visible on candidate portal' : 'Hidden from candidate portal',
        'success'
      )
    },
    onError: (err: unknown) => {
      addToast(err instanceof ApiError ? err.message : 'Failed to update visibility', 'error')
    },
  })

  const cancelMutation = useMutation({
    mutationFn: () =>
      api.requirements.cancel(requirement.id, {
        closureReason: closureReason.trim(),
        closedAt,
      }),
    onSuccess: () => {
      invalidate()
      setShowCancelModal(false)
      setClosureReason('')
      setClosedAt('')
      addToast('Requirement cancelled', 'success')
    },
    onError: (err: unknown) => {
      addToast(err instanceof ApiError ? err.message : 'Failed to cancel requirement', 'error')
    },
  })

  if (!canPost && !canVisibility && !isClosed) return null

  return (
    <>
      <section className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold mb-1 text-primary dark:text-white">
          Portal &amp; posting controls
        </h3>
        <p className="text-xs text-slate-500 dark:text-white/50 mb-4">
          Manage hold, cancellation, and posting to the candidate and employee portals.
        </p>

        {isClosed && (
          <div className="mb-4 p-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-2">
            <p className="text-sm font-bold text-primary dark:text-white">
              {isCancelled ? 'Requirement cancelled' : 'Requirement closed'}
            </p>
            {requirement.closureReason && (
              <p className="text-sm text-slate-600 dark:text-white/70">
                <span className="font-bold">Reason:</span> {requirement.closureReason}
              </p>
            )}
            {requirement.closedAt && (
              <p className="text-sm text-slate-600 dark:text-white/70">
                <span className="font-bold">Closure date:</span>{' '}
                {formatDateLabel(requirement.closedAt)}
              </p>
            )}
          </div>
        )}

        {showActions && (
          <div className="flex flex-wrap gap-3">
            {isLive && (
              <button
                type="button"
                onClick={async () => {
                  const ok = await confirm({
                    title: 'Put on hold',
                    message:
                      'Put this requirement on hold? It will be hidden from the candidate portal until resumed.',
                    confirmLabel: 'Put on hold',
                  })
                  if (!ok) return
                  holdMutation.mutate()
                }}
                disabled={holdMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-orange-200 bg-orange-50 text-orange-800 dark:bg-orange-500/15 dark:text-orange-200 text-sm font-bold hover:bg-orange-100 dark:hover:bg-orange-500/25 disabled:opacity-50"
              >
                <PauseCircle size={16} /> Put on hold
              </button>
            )}
            {isOnHold && (
              <button
                type="button"
                onClick={() => releaseMutation.mutate()}
                disabled={releaseMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200 text-sm font-bold hover:bg-emerald-100 disabled:opacity-50"
              >
                <PlayCircle size={16} /> Resume (go live)
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              disabled={cancelMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-red-800 dark:bg-red-500/15 dark:text-red-200 text-sm font-bold hover:bg-red-100 dark:hover:bg-red-500/25 disabled:opacity-50"
            >
              <Ban size={16} /> Cancel requirement
            </button>
          </div>
        )}

        {canVisibility && !isClosed && (
          <div
            className={clsx(
              showActions && 'mt-4 pt-4 border-t border-slate-100 dark:border-white/10',
              'grid gap-4 sm:grid-cols-2'
            )}
          >
            <div className="rounded-xl border border-slate-200 dark:border-white/10 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Briefcase size={18} className="text-primary/60 dark:text-white/60" />
                <p className="text-sm font-bold text-primary dark:text-white">Candidate portal</p>
              </div>
              <p className="text-xs text-slate-500 dark:text-white/50">
                {portalVisible && canPostToPortals
                  ? 'Live on open positions for external applicants.'
                  : portalVisible
                    ? 'Will show when the job is live.'
                    : 'Not listed on the careers portal yet.'}
              </p>
              <button
                type="button"
                onClick={() => visibilityMutation.mutate(!portalVisible)}
                disabled={visibilityMutation.isPending || isOnHold || (!canPostToPortals && !portalVisible)}
                title={isOnHold ? 'Resume the job before changing portal visibility' : undefined}
                className={clsx(
                  'flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg border text-sm font-bold disabled:opacity-50',
                  portalVisible
                    ? 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-white'
                    : 'border-primary bg-primary text-primary-foreground hover:opacity-90'
                )}
              >
                {portalVisible ? (
                  <>
                    <EyeOff size={16} /> Remove from candidate portal
                  </>
                ) : (
                  <>
                    <Eye size={16} /> Post to candidate portal
                  </>
                )}
              </button>
            </div>

            <div className="rounded-xl border border-violet-200/80 dark:border-violet-500/30 p-4 space-y-3 bg-violet-50/50 dark:bg-violet-500/5">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-violet-700 dark:text-violet-300" />
                <p className="text-sm font-bold text-violet-900 dark:text-violet-100">
                  Employee portal
                </p>
              </div>
              <p className="text-xs text-violet-800/80 dark:text-violet-200/80">
                {referralVisible && canPostToPortals
                  ? 'Employees can refer candidates for this role.'
                  : referralVisible
                    ? 'Will appear when the job is live.'
                    : 'Not open for employee referrals yet.'}
              </p>
              <button
                type="button"
                onClick={() => referralVisibilityMutation.mutate(!referralVisible)}
                disabled={
                  referralVisibilityMutation.isPending ||
                  isOnHold ||
                  (!canPostToPortals && !referralVisible)
                }
                className={clsx(
                  'flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg border text-sm font-bold disabled:opacity-50',
                  referralVisible
                    ? 'border-violet-300 bg-white text-violet-800 hover:bg-violet-50 dark:bg-white/10 dark:text-violet-200'
                    : 'border-violet-600 bg-violet-600 text-white hover:bg-violet-700'
                )}
              >
                {referralVisible ? (
                  <>
                    <EyeOff size={16} /> Remove from employee portal
                  </>
                ) : (
                  <>
                    <Users size={16} /> Post to employee portal
                  </>
                )}
              </button>
              {referralVisible && (
                <div className="flex flex-wrap gap-2 items-end pt-1">
                  <div className="flex-1 min-w-[120px] space-y-1">
                    <label className="text-[10px] font-bold uppercase text-violet-700/70 dark:text-violet-200/70">
                      Referral bonus (₹, optional)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={bonusInput}
                      onChange={(e) => setBonusInput(e.target.value.replace(/[^\d,]/g, ''))}
                      placeholder="e.g. 50000"
                      className="w-full px-3 py-2 rounded-lg border border-violet-200 dark:border-violet-500/30 bg-white dark:bg-white/5 text-sm font-medium"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => referralVisibilityMutation.mutate(true)}
                    disabled={referralVisibilityMutation.isPending || isOnHold}
                    className="px-3 py-2 rounded-lg border border-violet-400 text-xs font-bold text-violet-800 hover:bg-violet-100 disabled:opacity-50"
                  >
                    Save bonus
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {canVisibility && !isClosed && !canPostToPortals && (
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-3">
            Portal posting is available once the requirement is approved and live.
          </p>
        )}

        {!canVisibility && canPost && !isClosed && (
          <p className="text-xs text-slate-500 dark:text-white/50 mt-3">
            Portal show/hide is restricted to Admin, HR Head, HR Manager, and Team Lead.
          </p>
        )}

        {showActions && (
          <p className="text-xs text-slate-500 dark:text-white/50 mt-3">
            {isOnHold
              ? 'On hold: hidden from open positions; linked candidates see a hold message.'
              : portalVisible
                ? 'Live: job can appear on the candidate open positions list (if visibility allows).'
                : 'Hidden from portal listing; use visibility controls above if you have access.'}
          </p>
        )}
      </section>

      <Modal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        aria-labelledby="cancel-req-title"
      >
          <div className="bg-white dark:bg-white/5 rounded-2xl shadow-xl border border-primary/10 dark:border-white/10 p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <h4 id="cancel-req-title" className="text-lg font-bold text-primary dark:text-white">
                Cancel requirement
              </h4>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="p-1 rounded-lg hover:bg-primary/5 dark:hover:bg-white/10 text-primary/50"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-slate-500 dark:text-white/60">
              This closes the job posting. Provide a reason and closure date for the record.
            </p>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-primary/60 dark:text-white/60">
                Closure reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={closureReason}
                onChange={(e) => setClosureReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 rounded-xl border border-primary/10 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-primary dark:text-white resize-none"
                placeholder="e.g. Role filled internally, budget freeze, client cancelled project…"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-primary/60 dark:text-white/60">
                Closure date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={closedAt}
                onChange={(e) => setClosedAt(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-primary/10 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-primary dark:text-white"
              />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-primary/70 dark:text-white/70 hover:bg-primary/5"
              >
                Back
              </button>
              <button
                type="button"
                disabled={
                  cancelMutation.isPending ||
                  closureReason.trim().length < 3 ||
                  !closedAt
                }
                onClick={() => cancelMutation.mutate()}
                className="px-5 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-50"
              >
                {cancelMutation.isPending ? 'Closing…' : 'Confirm cancel'}
              </button>
            </div>
          </div>
      </Modal>
    </>
  )
}
