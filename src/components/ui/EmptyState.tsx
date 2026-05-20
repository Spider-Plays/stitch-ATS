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
  <div className="py-12 px-6 text-center">
    <span className="material-symbols-outlined !text-5xl text-primary/20 dark:text-white/20 mb-3 block">{icon}</span>
    <p className="font-bold text-primary/70 dark:text-white/70">{title}</p>
    {description && <p className="text-sm text-primary/50 dark:text-white/50 mt-1">{description}</p>}
  </div>
)
