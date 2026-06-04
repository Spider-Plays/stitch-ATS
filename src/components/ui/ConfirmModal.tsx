import React from 'react'
import { X } from 'lucide-react'
import clsx from 'clsx'
import { Modal } from './Modal'

type ConfirmModalProps = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
  isPending?: boolean
  onClose: () => void
  onConfirm: () => void
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  isPending = false,
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  const titleId = 'confirm-modal-title'

  return (
    <Modal open={open} onClose={onClose} aria-labelledby={titleId}>
      <div className="app-modal">
        <div className="px-6 py-5 border-b border-border/60 flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-lg font-bold text-foreground">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground disabled:opacity-50 shadow-sm"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <p className="px-6 py-5 text-sm text-muted-foreground leading-relaxed">
          {message}
        </p>

        <div className="px-6 py-4 flex justify-end gap-2 border-t border-border/60 bg-muted/30">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted shadow-sm disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={onConfirm}
            className={clsx(
              'px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 shadow-md',
              variant === 'danger'
                ? 'btn-error'
                : 'btn-filled'
            )}
          >
            {isPending ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
