import React from 'react'
import { useLocation } from 'react-router-dom'
import { StitchLogo } from '../branding/StitchLogo'
import { Link } from 'react-router-dom'
import { SidebarNavItem } from '../layout/SidebarNavItem'
import { SidebarProfileFooter } from '../layout/SidebarProfileFooter'

const NAV = [
  { to: '/portal/dashboard', icon: 'dashboard', label: 'Home' },
  { to: '/portal/jobs', icon: 'work', label: 'Jobs' },
] as const

export function CandidatePortalSidebar() {
  const location = useLocation()

  return (
    <aside className="m3-navigation-drawer flex flex-col h-screen fixed left-0 top-0 z-50">
      <div className="sidebar-brand">
        <Link
          to="/portal/dashboard"
          className="sidebar-brand-link rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <StitchLogo tone="primary" subtitle="Candidate portal" size="md" />
        </Link>
      </div>

      <nav className="sidebar-nav">
        {NAV.map((item) => {
          const active =
            location.pathname === item.to ||
            (item.to === '/portal/jobs' && location.pathname.startsWith('/portal/jobs'))
          return (
            <SidebarNavItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              active={active}
            />
          )
        })}
      </nav>

      <SidebarProfileFooter />
    </aside>
  )
}
