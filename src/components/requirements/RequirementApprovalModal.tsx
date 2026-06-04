import React, { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import clsx from 'clsx'

type RequirementApprovalModalProps = {
  open: boolean
  action: 'APPROVE' | 'REJECT'
  requirementTitle: string
  requiresHrHeadDelegation: boolean
  isPending?: boolean
  onClose: () => void
  onConfirm: (options: { onBehalfOfHrHead: boolean }) => void
}

export function RequirementApprovalModal({
  open,
  action,
  requirementTitle,
  requiresHrHeadDelegation,
  isPending = false,
  onClose,
  onConfirm,
}: RequirementApprovalModalProps) {
  const [onBehalfOfHrHead, setOnBehalfOfHrHead] = useState(false)

  useEffect(() => {
    if (open) setOnBehalfOfHrHead(false)
  }, [open, action])

  const isApprove = action === 'APPROVE'
  const canSubmit = !requiresHrHeadDelegation || onBehalfOfHrHead

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="requirement-approval-title">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        <div className="px-6 py-5 border-b border-primary/10 dark:border-white/10">
          <h2
            id="requirement-approval-title"
            className="text-lg font-black text-primary dark:text-white"
          >
            {isApprove ? 'Approve requirement' : 'Reject requirement'}
          </h2>
          <p className="text-sm text-primary/60 dark:text-white/60 mt-1 line-clamp-2">
            {requirementTitle}
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">
          {requiresHrHeadDelegation ? (
            <label
              className={clsx(
                'flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors',
                onBehalfOfHrHead
                  ? 'border-primary dark:border-white/30 bg-primary/5 dark:bg-white/10'
                  : 'border-primary/15 dark:border-white/15 hover:border-primary/25'
              )}
            >
              <input
                type="checkbox"
                checked={onBehalfOfHrHead}
                onChange={(e) => setOnBehalfOfHrHead(e.target.checked)}
                className="mt-1 size-4 rounded border-primary/30 text-primary focus:ring-primary/30"
              />
              <span className="text-sm text-primary dark:text-white">
                <span className="font-bold block">On behalf of HR Head</span>
                <span className="text-page-desc">
                  I confirm this {isApprove ? 'approval' : 'rejection'} is recorded as HR Head’s
                  decision, delegated by me as Admin.
                </span>
              </span>
            </label>
          ) : (
            <p className="text-sm text-primary/70 dark:text-white/70">
              {isApprove
                ? 'This will publish the job as live on the portal (subject to visibility settings).'
                : 'This will mark the requirement as rejected.'}
            </p>
          )}
        </div>

        <div className="px-6 py-4 flex justify-end gap-2 border-t border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02]">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 rounded-xl text-sm font-bold text-primary/70 dark:text-white/70 hover:bg-primary/5 dark:hover:bg-white/10 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit || isPending}
            onClick={() =>
              onConfirm({
                onBehalfOfHrHead: requiresHrHeadDelegation ? true : false,
              })
            }
            className={clsx(
              'px-5 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50',
              isApprove ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
            )}
          >
            {isPending
              ? 'Saving…'
              : isApprove
                ? requiresHrHeadDelegation
                  ? 'Approve on behalf of HR Head'
                  : 'Approve'
                : requiresHrHeadDelegation
                  ? 'Reject on behalf of HR Head'
                  : 'Reject'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
