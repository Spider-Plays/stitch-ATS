import React from 'react'
import clsx from 'clsx'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={clsx(
                        "w-full rounded-xl border bg-slate-50 dark:bg-slate-800/50 dark:text-white px-3 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/50",
                        error
                            ? "border-red-500 focus:border-red-500"
                            : "border-slate-200 dark:border-slate-700 focus:border-primary/30",
                        className
                    )}
                    {...props}
                />
                {error && <p className="mt-1 text-xs text-red-500 font-bold">{error}</p>}
            </div>
        )
    }
)
Input.displayName = 'Input'
