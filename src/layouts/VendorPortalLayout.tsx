import React from 'react'
import { Outlet } from 'react-router-dom'
import VendorSidebar from '../components/VendorSidebar'

const VendorPortalLayout = () => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
    <VendorSidebar />
    <main className="flex-1 ml-64 p-6 min-h-screen">
      <Outlet />
    </main>
  </div>
)

export default VendorPortalLayout
