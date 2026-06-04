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
                "app-card backdrop-blur-xl border-white/40 dark:border-border/80 shadow-xl overflow-hidden",
                "bg-white/80 dark:bg-card/90",
                hoverEffect && "hover:shadow-card-hover hover:border-primary/25 dark:hover:border-ring/30",
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    )
}
