import React from 'react'
import { Settings2, type LucideIcon } from 'lucide-react'
import { PageHeader } from '../layout/PageHeader'

type AdminPageShellProps = {
  title: string
  description: string
  children: React.ReactNode
  eyebrow?: string
  icon?: LucideIcon
}

export function AdminPageShell({
  title,
  description,
  children,
  eyebrow = 'Administration',
  icon: Icon = Settings2,
}: AdminPageShellProps) {
  return (
    <div className="max-w-7xl mx-auto w-full space-y-6 animate-in fade-in duration-500 pb-10">
      <PageHeader
        highlighted
        icon={Icon}
        eyebrow={eyebrow}
        title={title}
        description={description}
      />

      {children}
    </div>
  )
}
