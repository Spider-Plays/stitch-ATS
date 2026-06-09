import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useThemeStore } from '../store/themeStore'
import { useSidebarStore } from '../store/sidebarStore'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import { canApproveRequirement, isAdminRole, isAssignedInterviewer } from '@/permissions'
import { needsFeedback } from '@/pages/interviews/_shared/interview.utils'
import clsx from 'clsx'

const iconBtnClass =
    'm3-state-layer p-2.5 rounded-full text-on-surface-variant hover:text-on-surface size-10 flex items-center justify-center'

const Header = () => {
    const { user } = useAuth()
    const { theme, toggleTheme } = useThemeStore()
    const { collapsed: sidebarCollapsed, toggle: toggleSidebar } = useSidebarStore()
    const navigate = useNavigate()
    const [query, setQuery] = useState('')
    const [open, setOpen] = useState(false)
    const wrapRef = useRef<HTMLDivElement>(null)

    const canSearch = user && user.role !== 'CANDIDATE'
    const canReviewPendingApprovals = canApproveRequirement(user?.role)
    const isInterviewer = user?.role === 'INTERVIEWER'

    const { data: pendingRequirements = [] } = useQuery({
        queryKey: ['pendingRequirements'],
        queryFn: api.requirements.getPending,
        enabled: canReviewPendingApprovals,
        staleTime: 30_000,
        refetchInterval: 60_000,
    })

    const { data: interviews = [] } = useQuery({
        queryKey: ['interviews', 'header-notifications'],
        queryFn: api.interviews.list,
        enabled: isInterviewer,
        staleTime: 60_000,
        refetchInterval: 120_000,
    })

    const { data: results } = useQuery({
        queryKey: ['search', query],
        queryFn: () => api.search.query(query),
        enabled: !!canSearch && query.trim().length >= 2,
    })

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            const target = e.target as Node
            if (wrapRef.current && !wrapRef.current.contains(target)) setOpen(false)
        }
        document.addEventListener('mousedown', onClick)
        return () => document.removeEventListener('mousedown', onClick)
    }, [])

    const interviewerFeedbackCount = isInterviewer
        ? interviews.filter((i) => isAssignedInterviewer(i, user?.uid) && needsFeedback(i)).length
        : 0
    const showNotificationDot = pendingRequirements.length > 0 || interviewerFeedbackCount > 0
    const isAdmin = isAdminRole(user?.role)
    const hasResults =
        (results?.candidates?.length ?? 0) > 0 ||
        (results?.requirements?.length ?? 0) > 0 ||
        (results?.interviews?.length ?? 0) > 0 ||
        (results?.users?.length ?? 0) > 0

    const searchResultBtn =
        'w-full text-left px-4 py-3 hover:bg-muted/60 transition-colors border-b border-border/50 last:border-0'

    return (
        <header
            className={clsx(
                'm3-top-app-bar h-16 shrink-0 flex items-center justify-between gap-6 px-4 lg:px-6'
            )}
        >
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 max-w-2xl" ref={wrapRef}>
                <button
                    type="button"
                    onClick={toggleSidebar}
                    className={clsx(iconBtnClass, 'lg:hidden')}
                    aria-label={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
                    aria-expanded={!sidebarCollapsed}
                    title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
                >
                    <span className="material-symbols-outlined text-[22px]">
                        {sidebarCollapsed ? 'menu' : 'menu_open'}
                    </span>
                </button>
                {canSearch ? (
                    <div className="relative w-full">
                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-lg pointer-events-none z-[1]">
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
                            placeholder="Search candidates, jobs, interviews..."
                            className="app-search-input"
                        />
                        {open && query.trim().length >= 2 && (
                            <div className="absolute top-full left-0 right-0 mt-2 app-modal rounded-xl max-h-80 overflow-y-auto z-50 custom-scrollbar">
                                {!hasResults ? (
                                    <p className="p-4 text-sm text-muted-foreground">No results</p>
                                ) : (
                                    <>
                                        {results?.candidates?.map((c) => (
                                            <button
                                                key={c.id}
                                                type="button"
                                                className={searchResultBtn}
                                                onClick={() => {
                                                    navigate(`/candidates/${c.id}`)
                                                    setOpen(false)
                                                    setQuery('')
                                                }}
                                            >
                                                <p className="text-sm font-semibold text-foreground">{c.name}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">{c.role} · Candidate</p>
                                            </button>
                                        ))}
                                        {results?.requirements?.map((r) => (
                                            <button
                                                key={r.id}
                                                type="button"
                                                className={searchResultBtn}
                                                onClick={() => {
                                                    navigate(`/requirements/${r.id}`)
                                                    setOpen(false)
                                                    setQuery('')
                                                }}
                                            >
                                                <p className="text-sm font-semibold text-foreground">{r.title}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">{r.department} · Requirement</p>
                                            </button>
                                        ))}
                                        {results?.interviews?.map((i) => (
                                            <button
                                                key={i.id}
                                                type="button"
                                                className={searchResultBtn}
                                                onClick={() => {
                                                    navigate(i.candidateId ? `/candidates/${i.candidateId}` : '/interviews')
                                                    setOpen(false)
                                                    setQuery('')
                                                }}
                                            >
                                                <p className="text-sm font-semibold text-foreground">{i.candidateName || 'Interview'}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">{i.type.replace('_', ' ')} · Interview</p>
                                            </button>
                                        ))}
                                        {isAdmin &&
                                            results?.users?.map((u) => (
                                                <button
                                                    key={u.uid}
                                                    type="button"
                                                    className={searchResultBtn}
                                                    onClick={() => {
                                                        navigate('/admin/users')
                                                        setOpen(false)
                                                        setQuery('')
                                                    }}
                                                >
                                                    <p className="text-sm font-semibold text-foreground">{u.name}</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
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

            <div className="flex items-center gap-0.5 shrink-0">
                <button onClick={toggleTheme} className={iconBtnClass} type="button" aria-label="Toggle theme">
                    <span className="material-symbols-outlined text-[22px]">
                        {theme === 'light' ? 'dark_mode' : 'light_mode'}
                    </span>
                </button>

                <Link to="/notifications" className={clsx(iconBtnClass, 'relative')}>
                    <span className="material-symbols-outlined text-[22px]">notifications</span>
                    {showNotificationDot && (
                        <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full ring-2 ring-card" />
                    )}
                </Link>
            </div>
        </header>
    )
}

export default Header
