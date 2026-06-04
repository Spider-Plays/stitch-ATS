import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { StitchLogo } from './branding/StitchLogo'
import { SidebarProfileFooter } from './layout/SidebarProfileFooter'
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
      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
      active
        ? 'bg-violet-500/25 text-white shadow-[inset_3px_0_0_0] shadow-violet-400'
        : 'text-white/65 hover:bg-white/[0.06] hover:text-white'
    )}
  >
    <span className="material-symbols-outlined text-[20px]">{icon}</span>
    <span>{label}</span>
  </Link>
)

const ReferralSidebar = () => {
  const location = useLocation()
  const path = location.pathname

  return (
    <aside className="w-[var(--sidebar-width)] flex flex-col h-screen fixed left-0 top-0 z-50 text-white bg-gradient-to-b from-violet-950 via-indigo-950 to-slate-950 border-r border-violet-500/10 shadow-sidebar">
      <div className="p-5 border-b border-white/[0.06]">
        <StitchLogo
          tone="primary"
          subtitle="Referral portal"
          onDark
          subtitleClassName="text-violet-300/70"
        />
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1 custom-scrollbar overflow-y-auto">
        <p className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em] px-3 mb-2">
          Menu
        </p>
        <NavItem
          to="/referral-portal/dashboard"
          icon="dashboard"
          label="Dashboard"
          active={path === '/referral-portal/dashboard'}
        />
        <NavItem
          to="/referral-portal/jobs"
          icon="work"
          label="Open roles"
          active={path.startsWith('/referral-portal/jobs')}
        />
        <NavItem
          to="/referral-portal/referrals"
          icon="group"
          label="My referrals"
          active={
            path.startsWith('/referral-portal/referrals') &&
            !path.startsWith('/referral-portal/jobs')
          }
        />
        <NavItem
          to="/referral-portal/program"
          icon="card_giftcard"
          label="Rewards program"
          active={path === '/referral-portal/program'}
        />
      </nav>

      <SidebarProfileFooter />
    </aside>
  )
}

export default ReferralSidebar
