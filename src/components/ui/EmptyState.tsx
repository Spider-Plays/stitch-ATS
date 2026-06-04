import React from 'react'

export const EmptyState = ({
  icon = 'inbox',
  title,
  description,
}: {
  icon?: string
  title: string
  description?: string
}) => (
  <div className="py-14 px-6 text-center">
    <div className="empty-state-icon mx-auto">
      <span className="material-symbols-outlined !text-3xl">{icon}</span>
    </div>
    <p className="font-bold text-foreground">{title}</p>
    {description && <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">{description}</p>}
  </div>
)
