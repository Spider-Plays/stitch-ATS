import React from 'react'
import clsx from 'clsx'
import type { LucideIcon } from 'lucide-react'

/** Primary CTA on vivid (blue) hero backgrounds */
export const heroBtnPrimary =
  'btn-filled !h-10 !bg-white !text-primary hover:!bg-white/90 shadow-m3-2'

/** Secondary CTA on vivid hero backgrounds */
export const heroBtnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-full font-bold text-sm px-4 h-10 ' +
  'bg-white/15 text-white ring-1 ring-white/25 hover:bg-white/25 transition-colors'

type PageHeroProps = {
  eyebrow: string
  title: string
  description?: string
  icon?: LucideIcon
  actions?: React.ReactNode
  /** vivid = blue→teal banner with white bold type (default) */
  variant?: 'vivid' | 'soft'
  className?: string
}

export function PageHero({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions,
  variant = 'vivid',
  className,
}: PageHeroProps) {
  const vivid = variant === 'vivid'

  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-2xl',
        vivid ? 'm3-hero-card m3-hero-card--vivid' : 'm3-hero-card',
        className
      )}
    >
      {vivid && (
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,_rgba(255,255,255,0.14),_transparent_55%)]"
          aria-hidden
        />
      )}
      <div className="relative px-6 py-6 md:px-8 md:py-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2 max-w-2xl min-w-0">
          <div className={vivid ? 'badge-eyebrow--on-vivid' : 'badge-eyebrow m3-hero-eyebrow-soft'}>
            {Icon && <Icon size={14} aria-hidden />}
            {eyebrow}
          </div>
          <h1
            className={clsx(
              'm3-hero-title',
              vivid ? 'text-white' : 'text-on-primary-container'
            )}
          >
            {title}
          </h1>
          {description && (
            <p
              className={clsx(
                'm3-hero-desc',
                vivid ? 'text-white/85' : 'text-on-primary-container/80'
              )}
            >
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  )
}
