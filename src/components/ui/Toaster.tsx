import React from 'react'
import { useToastStore } from '../../store/toastStore'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, XCircle } from 'lucide-react'
import clsx from 'clsx'

import { AnimatePresence, motion } from 'framer-motion'

const icons = {
    success: <CheckCircle className="text-green-500" size={20} />,
    error: <XCircle className="text-red-500" size={20} />, // Fixed: AlertCircle -> XCircle check
    info: <Info className="text-blue-500" size={20} />,
    warning: <AlertTriangle className="text-amber-500" size={20} />
}




export const Toaster = () => {
    const { toasts, removeToast } = useToastStore()

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        layout
                        className={clsx(
                            "flex items-center gap-3 min-w-[300px] max-w-md p-4 rounded-xl shadow-lg border backdrop-blur-md",
                            "bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-white/10"
                        )}
                    >
                        {toast.type === 'success' && <CheckCircle className="text-green-500 shrink-0" size={20} />}
                        {toast.type === 'error' && <AlertCircle className="text-red-500 shrink-0" size={20} />}
                        {toast.type === 'info' && <Info className="text-blue-500 shrink-0" size={20} />}
                        {toast.type === 'warning' && <AlertTriangle className="text-amber-500 shrink-0" size={20} />}

                        <p className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                            {toast.message}
                        </p>

                        <button
                            onClick={() => removeToast(toast.id)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}
