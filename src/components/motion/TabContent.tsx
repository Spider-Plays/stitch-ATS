import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import { tabContentMotion } from '../../lib/motion'

type TabContentProps = {
  activeKey: string
  children: React.ReactNode
  className?: string
}

/** Cross-fade tab / wizard step panels */
export function TabContent({ activeKey, children, className }: TabContentProps) {
  return (
    <div className={clsx('relative', className)}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeKey}
          initial={tabContentMotion.initial}
          animate={tabContentMotion.animate}
          exit={tabContentMotion.exit}
          transition={tabContentMotion.transition}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
