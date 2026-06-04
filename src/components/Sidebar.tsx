import React from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { SidebarBrand } from './layout/SidebarBrand'
import { SidebarNavItem, SidebarSectionLabel } from './layout/SidebarNavItem'
import { SidebarProfileFooter } from './layout/SidebarProfileFooter'
import clsx from 'clsx'
import { canAccessPage, PageKey } from '../lib/pageAccess'
import { getAccessibleFeatureTags } from '../lib/userTags'

const Sidebar = () => {
  const location = useLocation()
  const path = location.pathname
  const { user, allowedPages } = useAuth()
  const role = user?.role || 'RECRUITER'

  const isRecruiter = role === 'RECRUITER'
  const navVariant = isRecruiter ? 'recruiter' : 'default'

  const show = (page: PageKey) => canAccessPage(allowedPages, page)
  const isAdmin = role === 'ADMIN'
  const featureModules = getAccessibleFeatureTags(role, user?.tags)

  return (
    <aside
      className={clsx(
        'm3-navigation-drawer flex flex-col h-screen fixed left-0 top-0 z-50',
        isRecruiter && 'm3-navigation-drawer--recruiter'
      )}
    >
      <SidebarBrand subtitle={isRecruiter ? 'Recruiter' : 'Workspace'} />

      <nav className="sidebar-nav custom-scrollbar">
        <SidebarSectionLabel>{isRecruiter ? 'Hiring' : 'Menu'}</SidebarSectionLabel>

        {show('dashboard') && (
          <SidebarNavItem
            to="/dashboard"
            icon="dashboard"
            label="Dashboard"
            active={path === '/dashboard' || path === '/'}
            variant={navVariant}
          />
        )}
        {show('requirements') && (
          <SidebarNavItem
            to="/requirements"
            icon="work"
            label="Requirements"
            active={path.startsWith('/requirements')}
            variant={navVariant}
          />
        )}
        {show('vendors') && (
          <SidebarNavItem
            to="/vendors"
            icon="storefront"
            label="Vendors"
            active={path.startsWith('/vendors')}
            variant={navVariant}
          />
        )}
        {show('candidates') && (
          <SidebarNavItem
            to="/candidates"
            icon="group"
            label="Candidates"
            active={path.startsWith('/candidates')}
            variant={navVariant}
          />
        )}
        {show('pipeline') && (
          <SidebarNavItem
            to="/pipeline"
            icon="view_kanban"
            label="Pipeline"
            active={path.startsWith('/pipeline')}
            variant={navVariant}
          />
        )}
        {show('interviews') && (
          <SidebarNavItem
            to="/interviews"
            icon="calendar_today"
            label="Interviews"
            active={path.startsWith('/interviews')}
            variant={navVariant}
          />
        )}
        {show('offers') && (
          <SidebarNavItem
            to="/offers"
            icon="card_giftcard"
            label="Offers"
            active={path.startsWith('/offers')}
            variant={navVariant}
          />
        )}

        {featureModules.length > 0 && (
          <>
            <SidebarSectionLabel>Features</SidebarSectionLabel>
            {featureModules.map((mod) => (
              <SidebarNavItem
                key={mod.key}
                to={mod.path}
                icon={mod.icon}
                label={mod.label}
                active={path.startsWith(mod.path)}
                variant={navVariant}
              />
            ))}
          </>
        )}

        {isAdmin && (
          <>
            <div className="sidebar-divider" role="presentation" />
            <SidebarSectionLabel>System</SidebarSectionLabel>
            <SidebarNavItem
              to="/admin"
              icon="admin_panel_settings"
              label="Administration"
              active={path === '/admin' || path.startsWith('/admin/')}
              variant={navVariant}
            />
          </>
        )}
      </nav>

      <SidebarProfileFooter profileTo="/settings" />
    </aside>
  )
}

export default Sidebar
