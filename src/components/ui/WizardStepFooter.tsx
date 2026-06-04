import React from 'react'
import { Link } from 'react-router-dom'

type WizardStepFooterProps = {
  currentStep: number
  onPreviousStep: () => void
  exitTo: string
  exitLabel?: string
  children: React.ReactNode
}

const secondaryActionClass =
  'text-sm font-bold text-primary/70 dark:text-white/70 hover:text-primary dark:hover:text-white transition-colors'

/**
 * Footer for multi-step wizards. Step 0 shows a text exit link; later steps show Previous.
 */
export function WizardStepFooter({
  currentStep,
  onPreviousStep,
  exitTo,
  exitLabel = 'Cancel',
  children,
}: WizardStepFooterProps) {
  const isFirst = currentStep === 0

  return (
    <div className="mt-8 pt-6 border-t border-primary/10 dark:border-white/10 flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3">
      {isFirst ? (
        <Link to={exitTo} className={secondaryActionClass}>
          {exitLabel}
        </Link>
      ) : (
        <button type="button" onClick={onPreviousStep} className={secondaryActionClass}>
          Previous
        </button>
      )}
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:justify-end">{children}</div>
    </div>
  )
}
