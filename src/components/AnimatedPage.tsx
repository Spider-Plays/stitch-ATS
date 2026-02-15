import React from 'react'
import { motion } from 'framer-motion'

const pageVariants = {
    initial: {
        opacity: 0,
        y: 10,
        scale: 0.98
    },
    in: {
        opacity: 1,
        y: 0,
        scale: 1
    },
    out: {
        opacity: 0,
        y: -10,
        scale: 0.98
    }
}

const pageTransition: any = {
    type: "tween",
    ease: "anticipate",
    duration: 0.4
}

export const AnimatedPage = ({ children }: { children: React.ReactNode }) => {
    return (
        <motion.div
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="w-full h-full"
        >
            {children}
        </motion.div>
    )
}
