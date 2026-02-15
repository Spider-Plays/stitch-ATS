import React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GlassCardProps extends HTMLMotionProps<'div'> {
    children: React.ReactNode
    className?: string
    hoverEffect?: boolean
}

export const GlassCard = ({ children, className, hoverEffect = false, ...props }: GlassCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            whileHover={hoverEffect ? { y: -5, transition: { duration: 0.2 } } : undefined}
            className={cn(
                "bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-xl rounded-2xl overflow-hidden",
                hoverEffect && "hover:shadow-2xl hover:border-primary/20 dark:hover:border-primary/20",
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    )
}
