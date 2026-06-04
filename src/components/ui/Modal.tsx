import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import { modalOverlayMotion, modalPanelMotion } from '../../lib/motion'

type ModalProps = {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
  overlayClassName?: string
  'aria-labelledby'?: string
}

export function Modal({
  open,
  onClose,
  children,
  className,
  overlayClassName,
  'aria-labelledby': ariaLabelledBy,
}: ModalProps) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className={clsx(
            'fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md',
            overlayClassName
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby={ariaLabelledBy}
          initial={modalOverlayMotion.initial}
          animate={modalOverlayMotion.animate}
          exit={modalOverlayMotion.exit}
          transition={modalOverlayMotion.transition}
          onClick={onClose}
        >
          <motion.div
            className={clsx('w-full max-w-md', className)}
            initial={modalPanelMotion.initial}
            animate={modalPanelMotion.animate}
            exit={modalPanelMotion.exit}
            transition={modalPanelMotion.transition}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
