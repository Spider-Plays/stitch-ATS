import React, { useState } from 'react'
import { Star } from 'lucide-react'
import clsx from 'clsx'
import { ratingLabel } from '../../config/interviewFeedbackForm'

const MAX_STARS = 5

type StarRatingInputProps = {
  value: number
  onChange: (value: number) => void
  'aria-label'?: string
}

export function StarRatingDisplay({
  value,
  showLabel = true,
}: {
  value: number
  showLabel?: boolean
}) {
  if (value <= 0) {
    return <span className="text-xs text-slate-400 dark:text-slate-500">Not assessed</span>
  }

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex gap-0.5" aria-label={ratingLabel(value)}>
        {Array.from({ length: MAX_STARS }, (_, i) => (
          <Star
            key={i}
            size={14}
            className={clsx(
              i < value
                ? 'fill-amber-400 text-amber-400'
                : 'text-slate-200 dark:text-slate-600'
            )}
            aria-hidden
          />
        ))}
      </div>
      {showLabel && (
        <span className="text-[10px] leading-tight text-slate-500 dark:text-slate-400">
          {ratingLabel(value)}
        </span>
      )}
    </div>
  )
}

export function StarRatingInput({ value, onChange, 'aria-label': ariaLabel }: StarRatingInputProps) {
  const [hover, setHover] = useState(0)
  const display = hover || value

  return (
    <div className="flex flex-col gap-0.5">
      <div
        className="flex flex-wrap items-center gap-0.5"
        role="radiogroup"
        aria-label={ariaLabel ?? 'Rating'}
        onMouseLeave={() => setHover(0)}
      >
        {Array.from({ length: MAX_STARS }, (_, i) => {
          const star = i + 1
          const filled = star <= display
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={value === star}
              onClick={() => onChange(value === star ? 0 : star)}
              onMouseEnter={() => setHover(star)}
              className="rounded p-0.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <Star
                size={20}
                className={clsx(
                  filled
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-300 dark:text-slate-600'
                )}
              />
            </button>
          )
        })}
        {value > 0 && (
          <button
            type="button"
            onClick={() => onChange(0)}
            className="ml-1 text-[10px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            Clear
          </button>
        )}
      </div>
      <span className="text-[10px] leading-tight text-slate-500 dark:text-slate-400 min-h-[14px]">
        {value > 0 ? ratingLabel(value) : 'Not assessed'}
      </span>
    </div>
  )
}
