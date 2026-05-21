import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { APP_NAME } from '../config/branding'
import clsx from 'clsx'

const NavItem = ({
  to,
  icon,
  label,
  active,
}: {
  to: string
  icon: string
  label: string
  active: boolean
}) => (
  <Link
    to={to}
    className={clsx(
      'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all',
      active
        ? 'bg-emerald-500/25 text-white border border-emerald-400/45 shadow-sm'
        : 'text-white/70 hover:bg-white/8 hover:text-white'
    )}
  >
    <span className="material-symbols-outlined text-[20px]">{icon}</span>
    <span>{label}</span>
  </Link>
)

const VendorSidebar = () => {
  const location = useLocation()
  const path = location.pathname
  const { user, logout } = useAuth()

  return (
    <aside className="w-64 flex flex-col h-screen fixed left-0 top-0 z-50 bg-[#0f2a1f] text-white">
      <div className="p-6 flex items-center gap-3 border-b border-white/10">
        <div className="size-8 rounded-lg bg-emerald-500/30 flex items-center justify-center">
          <span className="material-symbols-outlined text-emerald-200">storefront</span>
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight">{APP_NAME}</h2>
          <p className="text-[10px] text-white/50 uppercase tracking-widest">Vendor Portal</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-3 mb-2">
          Menu
        </div>
        <NavItem
          to="/vendor-portal/dashboard"
          icon="dashboard"
          label="Dashboard"
          active={path === '/vendor-portal/dashboard'}
        />
        <NavItem
          to="/vendor-portal/positions"
          icon="work"
          label="Assigned jobs"
          active={path.startsWith('/vendor-portal/positions')}
        />
        <NavItem
          to="/vendor-portal/submissions"
          icon="group"
          label="My submissions"
          active={path.startsWith('/vendor-portal/submissions')}
        />
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-3 bg-white/5 rounded-xl">
          <div className="size-9 rounded-full bg-emerald-600/40 flex items-center justify-center text-xs font-bold">
            {user?.name?.charAt(0) ?? 'V'}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-bold truncate">{user?.name}</p>
            <p className="text-[10px] text-white/40 truncate">Vendor</p>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            className="text-white/40 hover:text-white"
            aria-label="Log out"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
          </button>
        </div>
      </div>
    </aside>
  )
}

export default VendorSidebar
