import React from 'react'
import clsx from 'clsx'
import type { LucideIcon } from 'lucide-react'

interface InterviewStatCardProps {
  label: string
  value: number
  icon: LucideIcon
  accent?: 'blue' | 'amber' | 'green' | 'slate' | 'brand'
  active?: boolean
  onClick?: () => void
}

const iconWellStyles = {
  brand: 'bg-primary/12 text-primary dark:bg-primary/25 dark:text-primary',
  blue: 'bg-secondary-container text-on-secondary-container',
  amber: 'bg-tertiary-container text-on-tertiary-container',
  green: 'bg-tertiary/15 text-tertiary dark:bg-tertiary/25 dark:text-tertiary',
  slate: 'bg-surface-container-high text-on-surface-variant',
}

const valueStyles = {
  brand: 'text-primary',
  blue: 'text-on-surface',
  amber: 'text-tertiary',
  green: 'text-tertiary',
  slate: 'text-foreground',
}

export function InterviewStatCard({
  label,
  value,
  icon: Icon,
  accent = 'slate',
  active,
  onClick,
}: InterviewStatCardProps) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={clsx(
        'flex items-center gap-4 p-4 rounded-xl border border-outline-variant/50',
        'bg-card text-left shadow-m3-1 transition-shadow duration-200 h-full',
        onClick && 'm3-state-layer cursor-pointer hover:shadow-m3-2',
        active && 'ring-2 ring-primary border-primary/30 shadow-m3-2'
      )}
    >
      <div className={clsx('p-2.5 rounded-xl shrink-0', iconWellStyles[accent])}>
        <Icon size={22} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className={clsx('text-m3-headline font-normal tabular-nums leading-none', valueStyles[accent])}>
          {value}
        </p>
        <p className="text-m3-label-sm text-muted-foreground mt-1 normal-case tracking-normal">{label}</p>
      </div>
    </Tag>
  )
}
