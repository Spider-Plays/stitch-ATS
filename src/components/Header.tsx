import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useThemeStore } from '../store/themeStore'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

const Header = () => {
    const { user } = useAuth()
    const { theme, toggleTheme } = useThemeStore()
    const navigate = useNavigate()
    const [query, setQuery] = useState('')
    const [open, setOpen] = useState(false)
    const wrapRef = useRef<HTMLDivElement>(null)

    const isHr = ['ADMIN', 'HR_MANAGER', 'HR_HEAD'].includes(user?.role || '')
    const canSearch = user && user.role !== 'CANDIDATE'

    const { data: pendingRequirements = [] } = useQuery({
        queryKey: ['pendingRequirements'],
        queryFn: api.requirements.getPending,
        enabled: isHr,
        refetchInterval: 30000,
    })

    const { data: results } = useQuery({
        queryKey: ['search', query],
        queryFn: () => api.search.query(query),
        enabled: !!canSearch && query.trim().length >= 2,
    })

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', onClick)
        return () => document.removeEventListener('mousedown', onClick)
    }, [])

    const showNotificationDot = pendingRequirements.length > 0
    const isAdmin = user?.role === 'ADMIN'
    const hasResults =
        (results?.candidates?.length ?? 0) > 0 ||
        (results?.requirements?.length ?? 0) > 0 ||
        (results?.interviews?.length ?? 0) > 0 ||
        (results?.users?.length ?? 0) > 0

    return (
        <header className="h-16 border-b border-slate-200 dark:border-white/10 flex items-center justify-between px-8 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-40 ml-64 transition-all duration-300">
            <div className="flex items-center gap-4 w-1/3" ref={wrapRef}>
                {canSearch ? (
                    <div className="relative w-full">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                            search
                        </span>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value)
                                setOpen(true)
                            }}
                            onFocus={() => setOpen(true)}
                            placeholder="Search candidates, jobs, interviews, users..."
                            className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-xl pl-10 text-sm focus:ring-2 focus:ring-primary/50 transition-all dark:text-white"
                        />
                        {open && query.trim().length >= 2 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl max-h-80 overflow-y-auto z-50">
                                {!hasResults ? (
                                    <p className="p-4 text-sm text-slate-500">No results</p>
                                ) : (
                                    <>
                                        {results?.candidates?.map((c) => (
                                            <button
                                                key={c.id}
                                                type="button"
                                                className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 border-b border-slate-100 dark:border-white/5"
                                                onClick={() => {
                                                    navigate(`/candidates/${c.id}`)
                                                    setOpen(false)
                                                    setQuery('')
                                                }}
                                            >
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                    {c.name}
                                                </p>
                                                <p className="text-xs text-slate-500">{c.role} · Candidate</p>
                                            </button>
                                        ))}
                                        {results?.requirements?.map((r) => (
                                            <button
                                                key={r.id}
                                                type="button"
                                                className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 border-b border-slate-100 dark:border-white/5"
                                                onClick={() => {
                                                    navigate(`/requirements/${r.id}`)
                                                    setOpen(false)
                                                    setQuery('')
                                                }}
                                            >
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                    {r.title}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {r.department} · Requirement
                                                </p>
                                            </button>
                                        ))}
                                        {results?.interviews?.map((i) => (
                                            <button
                                                key={i.id}
                                                type="button"
                                                className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 border-b border-slate-100 dark:border-white/5"
                                                onClick={() => {
                                                    navigate(i.candidateId ? `/candidates/${i.candidateId}` : '/interviews')
                                                    setOpen(false)
                                                    setQuery('')
                                                }}
                                            >
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                    {i.candidateName || 'Interview'}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {i.type.replace('_', ' ')} · Interview
                                                </p>
                                            </button>
                                        ))}
                                        {isAdmin &&
                                            results?.users?.map((u) => (
                                                <button
                                                    key={u.uid}
                                                    type="button"
                                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 border-b border-slate-100 dark:border-white/5 last:border-0"
                                                    onClick={() => {
                                                        navigate('/admin/users')
                                                        setOpen(false)
                                                        setQuery('')
                                                    }}
                                                >
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                        {u.name}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {u.email} · {u.role.replace('_', ' ')}
                                                    </p>
                                                </button>
                                            ))}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-full" />
                )}
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
                    type="button"
                    aria-label="Toggle theme"
                >
                    <span className="material-symbols-outlined">
                        {theme === 'light' ? 'dark_mode' : 'light_mode'}
                    </span>
                </button>

                <Link
                    to="/notifications"
                    className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-primary transition-colors relative"
                >
                    <span className="material-symbols-outlined">notifications</span>
                    {showNotificationDot && (
                        <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white dark:border-background-dark animate-pulse" />
                    )}
                </Link>
            </div>
        </header>
    )
}

export default Header
