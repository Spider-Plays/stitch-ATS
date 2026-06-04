import React, { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { AdminSubNav } from '../components/admin/AdminSubNav'
import { AnimatedOutlet } from '../components/motion/AnimatedOutlet'
import { useAuth } from '../hooks/useAuth'
import { bindSidebarViewportSync, useSidebarStore } from '../store/sidebarStore'

const MainLayout = () => {
    const { pathname } = useLocation()
    const { user, refreshUser } = useAuth()
    const collapsed = useSidebarStore((s) => s.collapsed)
    const setCollapsed = useSidebarStore((s) => s.setCollapsed)

    useEffect(() => {
        refreshUser().catch(() => {})
        // Refresh once when entering the staff app so feature tags assigned by admin are picked up.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => bindSidebarViewportSync(), [])
    const showAdminSubNav =
        user?.role === 'ADMIN' &&
        (pathname === '/admin' || pathname.startsWith('/admin/'))

    return (
        <div className="flex h-screen max-h-[100dvh] overflow-hidden app-shell-bg text-foreground">
            <Sidebar />
            {!collapsed && (
                <button
                    type="button"
                    className="sidebar-backdrop"
                    aria-label="Close sidebar"
                    onClick={() => setCollapsed(true)}
                />
            )}
            <div className="app-shell-main flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden relative z-[1]">
                <div className="app-shell-top shrink-0">
                    <Header />
                    {showAdminSubNav && <AdminSubNav />}
                </div>
                <main className="app-main-canvas flex-1 min-h-0 p-6 md:p-8 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    <AnimatedOutlet />
                </main>
            </div>
        </div>
    )
}

export default MainLayout
