import React from 'react'
import clsx from 'clsx'
import type { LucideIcon } from 'lucide-react'
import { PageHero } from './PageHero'

interface PageHeaderProps {
  title: string
  description?: string
  eyebrow?: string
  icon?: LucideIcon
  actions?: React.ReactNode
  className?: string
  /** Blue highlighted banner (eyebrow + bold title) */
  highlighted?: boolean
}

export function PageHeader({
  title,
  description,
  eyebrow,
  icon: Icon,
  actions,
  className,
  highlighted = false,
}: PageHeaderProps) {
  if (highlighted && eyebrow) {
    return (
      <PageHero
        className={className}
        icon={Icon}
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={actions}
      />
    )
  }

  return (
    <div
      className={clsx(
        'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-slide-up',
        className
      )}
    >
      <div className="space-y-2 min-w-0">
        {eyebrow && (
          <p className="badge-eyebrow w-fit font-bold inline-flex items-center gap-2">
            {Icon && <Icon size={14} aria-hidden />}
            {eyebrow}
          </p>
        )}
        <h1 className="text-page-title font-bold">{title}</h1>
        {description && <p className="text-page-desc">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
