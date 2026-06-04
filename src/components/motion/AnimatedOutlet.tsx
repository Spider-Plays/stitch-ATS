import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'
import { pageMotion } from '../../lib/motion'

/** Route-level page enter/exit inside layout shells */
export function AnimatedOutlet() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={pageMotion.initial}
        animate={pageMotion.animate}
        exit={pageMotion.exit}
        transition={pageMotion.transition}
        className="w-full"
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  )
}
