import React from 'react'
import { useLocation } from 'react-router-dom'
import { SidebarBrand } from './layout/SidebarBrand'
import { SidebarNavItem, SidebarSectionLabel } from './layout/SidebarNavItem'
import { SidebarProfileFooter } from './layout/SidebarProfileFooter'

const VendorSidebar = () => {
  const location = useLocation()
  const path = location.pathname

  return (
    <aside className="m3-navigation-drawer flex flex-col h-screen fixed left-0 top-0 z-50">
      <SidebarBrand subtitle="Vendor portal" homeTo="/vendor-portal/dashboard" />

      <nav className="sidebar-nav custom-scrollbar">
        <SidebarSectionLabel>Menu</SidebarSectionLabel>
        <SidebarNavItem
          to="/vendor-portal/dashboard"
          icon="dashboard"
          label="Dashboard"
          active={path === '/vendor-portal/dashboard'}
        />
        <SidebarNavItem
          to="/vendor-portal/positions"
          icon="work"
          label="Assigned jobs"
          active={path.startsWith('/vendor-portal/positions')}
        />
      </nav>

      <SidebarProfileFooter />
    </aside>
  )
}

export default VendorSidebar
