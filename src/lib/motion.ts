/** Material-style easing — shared across framer-motion and CSS */
export const M3_EASE = [0.2, 0, 0, 1] as const

export const motionDurations = {
  fast: 0.14,
  normal: 0.28,
  slow: 0.4,
} as const

export const pageMotion = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: motionDurations.normal, ease: M3_EASE },
}

export const tabContentMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: motionDurations.normal, ease: M3_EASE },
}

export const modalOverlayMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: motionDurations.fast, ease: M3_EASE },
}

export const modalPanelMotion = {
  initial: { opacity: 0, scale: 0.96, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: 8 },
  transition: { duration: motionDurations.normal, ease: M3_EASE },
}

export const tabIndicatorSpring = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 32,
}
