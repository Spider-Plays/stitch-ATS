import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useThemeStore } from '../store/themeStore'
import { useNavigate, Link } from 'react-router-dom'
import clsx from 'clsx'
import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

const Header = () => {
    const { user, logout } = useAuth()
    const { theme, toggleTheme } = useThemeStore()
    const navigate = useNavigate()
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const isHr = ['ADMIN', 'HR_MANAGER', 'HR_HEAD'].includes(user?.role || '')

    const { data: pendingRequirements = [] } = useQuery({
        queryKey: ['pendingRequirements'],
        queryFn: api.requirements.getPending,
        enabled: isHr,
        refetchInterval: 30000 // Poll every 30s
    })

    const showNotificationDot = pendingRequirements.length > 0

    const handleLogout = async () => {
        try {
            await logout()
            navigate('/login')
        } catch (error) {
            console.error('Logout failed', error)
        }
    }

    return (
        <header className="h-16 border-b border-slate-200 dark:border-white/10 flex items-center justify-between px-8 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-40 ml-64 transition-all duration-300">
            <div className="flex items-center gap-4 w-1/3">
                <div className="relative w-full">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                    <input
                        type="text"
                        placeholder="Search candidates, requirements..."
                        className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-xl pl-10 text-sm focus:ring-2 focus:ring-primary/50 transition-all dark:text-white"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
                >
                    <span className="material-symbols-outlined">{theme === 'light' ? 'dark_mode' : 'light_mode'}</span>
                </button>

                <Link to="/notifications" className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-primary transition-colors relative">
                    <span className="material-symbols-outlined">notifications</span>
                    {showNotificationDot && (
                        <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white dark:border-background-dark animate-pulse"></span>
                    )}
                </Link>

                <div className="h-8 w-px bg-slate-200 dark:bg-white/10 mx-2"></div>

                <div className="relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-black text-slate-900 dark:text-white truncate max-w-[120px]">{user?.name || 'User'}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tight capitalize">
                                {user?.role?.replace('_', ' ').toLowerCase() || 'Guest'}
                            </p>
                        </div>
                        <div className="size-9 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-white/10 relative group">
                            {user?.avatar ? (
                                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="material-symbols-outlined text-slate-400">person</span>
                            )}
                            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                        <span className={clsx(
                            "material-symbols-outlined text-slate-400 text-sm transition-transform duration-200",
                            isMenuOpen && "rotate-180"
                        )}>expand_more</span>
                    </button>

                    {isMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-white/10 py-2 animate-in fade-in zoom-in-95 duration-200 z-50">
                            <div className="px-4 py-2 border-b border-slate-100 dark:border-white/5 mb-1 md:hidden">
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.name}</p>
                                <p className="text-xs text-slate-500">{user?.email}</p>
                            </div>

                            <button className="w-full text-left px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-3 transition-colors">
                                <span className="material-symbols-outlined text-lg">person_outline</span>
                                My Profile
                            </button>
                            <button className="w-full text-left px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-3 transition-colors">
                                <span className="material-symbols-outlined text-lg">settings</span>
                                Settings
                            </button>

                            <div className="h-px bg-slate-100 dark:bg-white/5 my-1"></div>

                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-3 transition-colors font-semibold"
                            >
                                <span className="material-symbols-outlined text-lg">logout</span>
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {isMenuOpen && (
                <div className="fixed inset-0 z-20" onClick={() => setIsMenuOpen(false)} />
            )}
        </header>
    )
}

export default Header
