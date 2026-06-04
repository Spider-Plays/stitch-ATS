import React from 'react'
import clsx from 'clsx'

type AppCardProps = {
  children: React.ReactNode
  className?: string
  interactive?: boolean
  as?: 'div' | 'section' | 'article'
}

/** Shared surface for panels and list containers — pairs with .app-card in index.css */
export function AppCard({
  children,
  className,
  interactive = false,
  as: Tag = 'div',
}: AppCardProps) {
  return (
    <Tag className={clsx(interactive ? 'app-card-interactive' : 'app-card', className)}>
      {children}
    </Tag>
  )
}
