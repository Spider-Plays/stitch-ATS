import React from 'react'
import clsx from 'clsx'

export type SwitchProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  /** Visually hidden label for screen readers */
  ariaLabel: string
  id?: string
  className?: string
  size?: 'sm' | 'md'
}

const SIZES = {
  sm: {
    track: 'w-9 h-5',
    thumb: 'size-4',
    /** inner width (36px) − thumb (16px) with p-0.5 padding */
    on: 'translate-x-4',
  },
  md: {
    track: 'w-11 h-6',
    thumb: 'size-5',
    /** inner width (40px) − thumb (20px) with p-0.5 padding */
    on: 'translate-x-5',
  },
} as const

/** Material Design 3–style switch */
export function Switch({
  checked,
  onChange,
  disabled = false,
  ariaLabel,
  id,
  className,
  size = 'md',
}: SwitchProps) {
  const s = SIZES[size]

  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative inline-flex shrink-0 items-center rounded-full p-0.5 overflow-visible',
        'transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        s.track,
        checked ? 'bg-primary' : 'bg-outline-variant/80',
        disabled && 'opacity-[0.38] cursor-not-allowed',
        !disabled && 'cursor-pointer',
        className
      )}
    >
      <span
        aria-hidden
        className={clsx(
          'block rounded-full bg-white shadow-sm ring-1 ring-black/5',
          'transition-transform duration-200 ease-out',
          s.thumb,
          checked ? s.on : 'translate-x-0'
        )}
      />
    </button>
  )
}
