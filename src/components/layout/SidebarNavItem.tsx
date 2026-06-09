import React from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { prefetchRoute } from '../../lib/routePrefetch'

type SidebarNavItemProps = {
  to: string
  icon: string
  label: string
  active: boolean
  /** Recruiter portal uses teal active tones */
  variant?: 'default' | 'recruiter'
}

export function SidebarNavItem({
  to,
  icon,
  label,
  active,
  variant = 'default',
}: SidebarNavItemProps) {
  return (
    <Link
      to={to}
      onMouseEnter={() => prefetchRoute(to)}
      onFocus={() => prefetchRoute(to)}
      className={clsx(
        'sidebar-nav-item',
        active &&
          (variant === 'recruiter' ? 'sidebar-nav-item--active-recruiter' : 'sidebar-nav-item--active')
      )}
    >
      {active && <span className="sidebar-nav-indicator" aria-hidden />}
      <span
        className={clsx(
          'sidebar-nav-icon material-symbols-outlined',
          active && 'filled'
        )}
      >
        {icon}
      </span>
      <span className="sidebar-nav-label">{label}</span>
    </Link>
  )
}

export function SidebarSectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="sidebar-section-label">{children}</p>
}
