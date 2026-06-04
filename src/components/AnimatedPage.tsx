import React from 'react'
import { motion } from 'framer-motion'
import { pageMotion } from '../lib/motion'

/** Optional wrapper for in-page sections (layouts use AnimatedOutlet for routes) */
export const AnimatedPage = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={pageMotion.initial}
    animate={pageMotion.animate}
    transition={pageMotion.transition}
    className="w-full"
  >
    {children}
  </motion.div>
)
