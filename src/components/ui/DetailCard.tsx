import React from 'react'
import { AnimatedTabNav } from '../motion/AnimatedTabNav'

interface Tab {
  id: string
  label: string
}

interface DetailCardProps {
  title: string
  subtitle?: React.ReactNode
  tabs?: Tab[]
  activeTab?: string
  onTabChange?: (tabId: string) => void
  actions?: React.ReactNode
  children: React.ReactNode
  /** Unique layout id when multiple DetailCard shells exist on one route */
  tabLayoutId?: string
}

export const DetailCard: React.FC<DetailCardProps> = ({
  title,
  subtitle,
  tabs,
  activeTab,
  onTabChange,
  actions,
  children,
  tabLayoutId = 'detail-card-tabs',
}) => {
  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] max-w-7xl mx-auto animate-slide-up">
      <div className="app-card-elevated border-b border-border/60 rounded-t-2xl rounded-b-none z-20 shadow-lg">
        <div className="px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <h1 className="text-page-title">{title}</h1>
              {subtitle && (
                <div className="mt-2 text-sm text-muted-foreground flex flex-wrap gap-3 items-center font-medium">
                  {subtitle}
                </div>
              )}
            </div>
            {actions && <div className="flex gap-3 shrink-0">{actions}</div>}
          </div>
        </div>

        {tabs && tabs.length > 0 && activeTab && onTabChange && (
          <div className="px-6 pb-4 pt-2 border-t border-border/40 overflow-x-auto custom-scrollbar">
            <AnimatedTabNav
              layoutId={tabLayoutId}
              variant="pill"
              tabs={tabs.map((t) => ({ id: t.id, label: t.label }))}
              activeId={activeTab}
              onChange={onTabChange}
              aria-label="Page sections"
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden app-card md:rounded-t-none md:rounded-b-2xl border-t-0 shadow-md relative">
        {children}
      </div>
    </div>
  )
}