import React from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { M3_EASE, tabIndicatorSpring } from '../../lib/motion'

export type AnimatedTabItem = {
  id: string
  label: React.ReactNode
}

type AnimatedTabNavProps = {
  tabs: AnimatedTabItem[]
  activeId: string
  onChange: (id: string) => void
  /** Unique per nav group so indicators don't collide across pages */
  layoutId?: string
  variant?: 'pill' | 'segment' | 'underline'
  /** Match list filter chips (ALL, UPCOMING, …) */
  uppercase?: boolean
  className?: string
  'aria-label'?: string
}

const trackEnter = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.28, ease: M3_EASE },
}

const tabEnter = (index: number) => ({
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: index * 0.04, duration: 0.22, ease: M3_EASE },
})

export function AnimatedTabNav({
  tabs,
  activeId,
  onChange,
  layoutId = 'app-tab-indicator',
  variant = 'pill',
  uppercase = false,
  className,
  'aria-label': ariaLabel,
}: AnimatedTabNavProps) {
  const isPill = variant === 'pill' || variant === 'segment'
  const indicatorRadius = variant === 'segment' ? 'rounded-lg' : 'rounded-full'

  return (
    <motion.div
      role="tablist"
      aria-label={ariaLabel}
      {...trackEnter}
      className={clsx(
        'flex items-center gap-1 min-w-max',
        variant === 'segment' && 'p-1 rounded-xl bg-surface-container border border-outline-variant/40 shadow-[var(--app-control-shadow)]',
        variant === 'pill' && 'p-1 rounded-full bg-surface-container border border-outline-variant/40 shadow-[var(--app-control-shadow)]',
        variant === 'underline' && 'gap-6 border-b border-outline-variant/50',
        className
      )}
    >
      {tabs.map((tab, index) => {
        const active = tab.id === activeId
        const TabTag = isPill ? motion.button : 'button'

        return (
          <TabTag
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            {...(isPill
              ? {
                  ...tabEnter(index),
                  whileHover: active ? undefined : { scale: 1.02 },
                  whileTap: { scale: 0.97 },
                }
              : {})}
            className={clsx(
              'relative inline-flex items-center justify-center font-semibold whitespace-nowrap app-tab-btn',
              isPill && 'px-4 py-2 rounded-full min-h-[2.25rem]',
              isPill && (uppercase ? 'text-[11px] font-bold uppercase tracking-wider' : 'text-sm font-semibold'),
              variant === 'segment' && 'flex-1 py-2.5 px-4 rounded-lg text-sm min-h-[2.5rem]',
              variant === 'underline' && 'pb-4 text-sm border-b-2 -mb-px bg-transparent',
              active && isPill && 'text-primary-foreground [&_svg]:text-primary-foreground border-transparent',
              active && variant === 'segment' && 'text-primary-foreground [&_svg]:text-primary-foreground',
              active && variant === 'underline' && 'border-primary text-primary dark:border-white dark:text-white',
              !active &&
                isPill &&
                'text-primary dark:text-white bg-surface-container-lowest border-2 border-outline/70 shadow-[var(--app-control-shadow)] hover:bg-surface-container-high hover:shadow-[var(--app-control-shadow-hover)]',
              !active &&
                variant === 'segment' &&
                'text-primary dark:text-white bg-surface-container-lowest border border-outline-variant/70 shadow-[var(--app-control-shadow)] hover:bg-surface-container-high',
              !active && variant === 'underline' && 'border-transparent text-muted-foreground hover:text-primary dark:hover:text-white'
            )}
          >
            {active && isPill && (
              <motion.span
                layoutId={layoutId}
                className={clsx('absolute inset-0 m3-surface-primary shadow-m3-2', indicatorRadius)}
                transition={tabIndicatorSpring}
                aria-hidden
              />
            )}
            {active && variant === 'underline' && (
              <motion.span
                layoutId={`${layoutId}-underline`}
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary dark:bg-white rounded-full"
                transition={tabIndicatorSpring}
                aria-hidden
              />
            )}
            <span className="relative z-[1] inline-flex items-center gap-2">{tab.label}</span>
          </TabTag>
        )
      })}
    </motion.div>
  )
}
