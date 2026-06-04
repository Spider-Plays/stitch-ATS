import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { ADMIN_HUB_PAGES } from '../../lib/adminPages'
import { tabIndicatorSpring } from '../../lib/motion'

export function isAdminNavActive(pathname: string, to: string): boolean {
  if (to === '/admin/users') return pathname.startsWith('/admin/users')
  return pathname === to || pathname.startsWith(`${to}/`)
}

export function AdminSubNav() {
  const { pathname } = useLocation()

  return (
    <nav
      aria-label="Administration sections"
      className={clsx(
        'shrink-0 border-b border-outline-variant/50',
        'bg-surface-container-low',
        'px-6 lg:px-8 py-3 overflow-x-auto custom-scrollbar'
      )}
    >
      <div className="flex items-center gap-1 min-w-max p-1 rounded-full bg-surface-container border border-outline-variant/40">
        {ADMIN_HUB_PAGES.map(({ to, icon: Icon, title }) => {
          const active = isAdminNavActive(pathname, to)
          return (
            <Link
              key={to}
              to={to}
              className={clsx(
                'relative inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap app-tab-btn',
                active
                  ? 'text-primary-foreground [&_svg]:text-primary-foreground'
                  : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface [&_svg]:text-current'
              )}
            >
              {active && (
                <motion.span
                  layoutId="admin-subnav-indicator"
                  className="absolute inset-0 rounded-full m3-surface-primary shadow-m3-1"
                  transition={tabIndicatorSpring}
                  aria-hidden
                />
              )}
              <Icon size={16} className="relative z-[1]" aria-hidden />
              <span className="relative z-[1]">{title}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
