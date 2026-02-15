import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'

interface Tab {
    id: string
    label: string
}

interface DetailCardProps {
    title: string
    subtitle?: React.ReactNode // Can be string or badges
    backPath?: string
    backLabel?: string
    tabs?: Tab[]
    activeTab?: string
    onTabChange?: (tabId: string) => void
    actions?: React.ReactNode
    children: React.ReactNode
}

export const DetailCard: React.FC<DetailCardProps> = ({
    title,
    subtitle,
    backPath,
    backLabel = 'Back',
    tabs,
    activeTab,
    onTabChange,
    actions,
    children
}) => {
    const navigate = useNavigate()

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Sticky Header */}
            <div className="bg-white dark:bg-white/5 border-b border-primary/10 dark:border-white/10 rounded-t-2xl z-20 backdrop-blur-xl">
                <div className="px-6 py-6">
                    {backPath && (
                        <button
                            onClick={() => navigate(backPath)}
                            className="mb-4 text-primary/60 hover:text-primary dark:text-white/60 dark:hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors"
                        >
                            <ArrowLeft size={14} /> {backLabel}
                        </button>
                    )}

                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-black text-primary dark:text-white tracking-tight">{title}</h1>
                            {subtitle && <div className="mt-2 text-sm text-primary/60 dark:text-white/60 flex flex-wrap gap-3 items-center font-medium">{subtitle}</div>}
                        </div>
                        {actions && <div className="flex gap-3 shrink-0">{actions}</div>}
                    </div>
                </div>

                {/* Tabs */}
                {tabs && tabs.length > 0 && (
                    <div className="px-6 flex gap-8 overflow-x-auto scrollbar-hide">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange?.(tab.id)}
                                className={clsx(
                                    "pb-4 pt-2 text-sm font-bold border-b-2 transition-all whitespace-nowrap",
                                    activeTab === tab.id
                                        ? "border-primary dark:border-white text-primary dark:text-white"
                                        : "border-transparent text-primary/40 dark:text-white/40 hover:text-primary dark:hover:text-white"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Scrollable Content Content */}
            <div className="flex-1 overflow-hidden bg-white dark:bg-white/5 md:rounded-b-2xl border-x border-b border-primary/10 dark:border-white/10 shadow-sm relative backdrop-blur-sm">
                {children}
            </div>
        </div>
    )
}
