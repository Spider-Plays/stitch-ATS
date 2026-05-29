import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { APP_NAME } from '../config/branding'
import clsx from 'clsx'
import { canAccessPage, PageKey } from '../lib/pageAccess'

const NavItem = ({ to, icon, label, active, theme }: { to: string, icon: string, label: string, active: boolean, theme: 'nexus-blue' | 'nexus-orange' }) => {
    const activeStyles =
        theme === 'nexus-orange'
            ? 'bg-nexus-orange/25 text-white border border-nexus-orange/45 shadow-sm'
            : 'bg-white/15 text-white border border-white/10'

    const inactiveStyles = 'text-white/70 hover:bg-white/8 hover:text-white'

    return (
        <Link
            to={to}
            className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                active ? activeStyles : inactiveStyles
            )}
        >
            <span className={clsx('material-symbols-outlined text-[20px]', active && 'opacity-100')}>{icon}</span>
            <span className="text-sm font-medium">{label}</span>
        </Link>
    )
}

const Sidebar = () => {
    const location = useLocation()
    const path = location.pathname
    const { user, logout, allowedPages } = useAuth()
    const role = user?.role || 'RECRUITER'

    const isRecruiter = role === 'RECRUITER'
    const theme = isRecruiter ? 'nexus-orange' : 'nexus-blue'
    const sidebarBg = isRecruiter ? 'bg-[#221311]' : 'bg-[#1a2b3c]'
    const logoIcon = isRecruiter ? 'rocket_launch' : 'lan'
    const logoTitle = APP_NAME

    const show = (page: PageKey) => canAccessPage(allowedPages, page)
    const isAdmin = role === 'ADMIN'
    const showAdminSection = isAdmin || show('admin_users')

    return (
        <aside className={clsx(
            "w-64 flex flex-col h-screen fixed left-0 top-0 z-50 text-white transition-all duration-500 overflow-hidden",
            sidebarBg,
            "glass-sidebar"
        )}>
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-[-1]">
                <div className="liquid-blob liquid-blob-1"></div>
                <div className="liquid-blob liquid-blob-2"></div>
                <div className="liquid-blob liquid-blob-3"></div>
            </div>

            <div className="p-6 flex items-center gap-3 relative z-10">
                <div className={clsx(
                    "size-8 rounded-lg flex items-center justify-center transition-colors",
                    isRecruiter ? "bg-primary" : "bg-white/20"
                )}>
                    <span className="material-symbols-outlined text-white">{logoIcon}</span>
                </div>
                <h2 className="text-xl font-bold tracking-tight">{logoTitle}</h2>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto relative z-10">
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-3 mb-2">
                    {isRecruiter ? 'Hiring Pipeline' : 'Main Menu'}
                </div>

                {show('dashboard') && (
                    <NavItem to="/dashboard" icon="dashboard" label="Dashboard" active={path === '/dashboard' || path === '/'} theme={theme} />
                )}

                {show('requirements') && (
                    <NavItem to="/requirements" icon="work" label="Requirements" active={path.startsWith('/requirements')} theme={theme} />
                )}

                {show('vendors') && (
                    <NavItem to="/vendors" icon="storefront" label="Vendors" active={path.startsWith('/vendors')} theme={theme} />
                )}

                {show('candidates') && (
                    <NavItem to="/candidates" icon="group" label="Candidates" active={path.startsWith('/candidates')} theme={theme} />
                )}

                {show('pipeline') && (
                    <NavItem to="/pipeline" icon="plumbing" label="Pipeline" active={path.startsWith('/pipeline')} theme={theme} />
                )}

                {show('interviews') && (
                    <NavItem to="/interviews" icon="calendar_today" label="Interviews" active={path.startsWith('/interviews')} theme={theme} />
                )}

                {show('offers') && (
                    <NavItem to="/offers" icon="card_giftcard" label="Offers" active={path.startsWith('/offers')} theme={theme} />
                )}

                {showAdminSection && (
                    <>
                        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-3 mt-6 mb-2">
                            Administration
                        </div>
                        <NavItem
                            to="/admin"
                            icon="admin_panel_settings"
                            label="Admin home"
                            active={path === '/admin'}
                            theme={theme}
                        />
                        <NavItem
                            to="/admin/users"
                            icon="manage_accounts"
                            label="Users"
                            active={path.startsWith('/admin/users')}
                            theme={theme}
                        />
                        <NavItem
                            to="/admin/departments"
                            icon="corporate_fare"
                            label="Departments"
                            active={path.startsWith('/admin/departments')}
                            theme={theme}
                        />
                        <NavItem
                            to="/admin/skills"
                            icon="psychology"
                            label="Skills"
                            active={path.startsWith('/admin/skills')}
                            theme={theme}
                        />
                        <NavItem
                            to="/admin/role-access"
                            icon="tune"
                            label="Role access"
                            active={path.startsWith('/admin/role-access')}
                            theme={theme}
                        />
                    </>
                )}
            </nav>

            <div className="p-4 border-t border-white/10 space-y-2 relative z-10">
                {show('notifications') && (
                    <NavItem to="/notifications" icon="notifications" label="Notifications" active={path.startsWith('/notifications')} theme={theme} />
                )}
                {show('settings') && (
                    <NavItem to="/settings" icon="settings" label="Settings" active={path.startsWith('/settings')} theme={theme} />
                )}

                <div className="mt-4 flex items-center gap-3 px-3 py-4 bg-white/5 rounded-xl border border-white/5">
                    <div className={clsx(
                        "size-10 rounded-full bg-cover bg-center border-2 shrink-0",
                        isRecruiter ? "border-primary" : "border-white/20"
                    )} style={{ backgroundImage: `url(${user?.avatar || 'https://via.placeholder.com/40'})` }}></div>
                    <div className="overflow-hidden">
                        <p className="text-xs font-bold truncate">{user?.name || 'User'}</p>
                        <p className="text-[10px] text-white/40 truncate capitalize">{user?.role?.toLowerCase().replace('_', ' ')}</p>
                    </div>
                    <button onClick={() => logout()} className="ml-auto text-white/40 hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-sm">logout</span>
                    </button>
                </div>
            </div>
        </aside>
    )
}

export default Sidebar
