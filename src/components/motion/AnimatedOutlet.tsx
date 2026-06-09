import React from 'react'
import { motion } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'
import { pageMotion } from '../../lib/motion'

/** Route-level page enter inside layout shells (no exit wait — keeps navigation snappy). */
export function AnimatedOutlet() {
  const location = useLocation()

  return (
    <motion.div
      key={location.pathname}
      initial={pageMotion.initial}
      animate={pageMotion.animate}
      transition={{ duration: 0.12, ease: pageMotion.transition.ease }}
      className="w-full"
    >
      <Outlet />
    </motion.div>
  )
}
