import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, RotateCcw, Save, Shield } from 'lucide-react'
import clsx from 'clsx'
import { roleAccessApi } from '../../services/http/roleAccess'
import {
    CONFIGURABLE_ROLES,
    ConfigurableRole,
    PageKey,
    PAGE_DEFINITIONS,
} from '../../lib/pageAccess'
import { useToastStore } from '../../store/toastStore'
import { useAuth } from '../../hooks/useAuth'

const ROLE_LABELS: Record<ConfigurableRole, string> = {
    ADMIN: 'Admin',
    HR_HEAD: 'HR Head',
    HR_MANAGER: 'HR Manager',
    RECRUITER: 'Recruiter',
    TEAM_LEAD: 'Team Lead',
    HIRING_MANAGER: 'Hiring Manager',
    INTERVIEWER: 'Interviewer',
}

const RoleAccessEditor = () => {
    const queryClient = useQueryClient()
    const { addToast } = useToastStore()
    const { setAllowedPages } = useAuth()
    const [selectedRole, setSelectedRole] = useState<ConfigurableRole>('RECRUITER')
    const [draftPages, setDraftPages] = useState<PageKey[]>([])

    const { data, isLoading } = useQuery({
        queryKey: ['role-access'],
        queryFn: () => roleAccessApi.getAll(),
    })

    useEffect(() => {
        if (!data?.access) return
        const pages = data.access[selectedRole]?.pages ?? []
        setDraftPages([...pages])
    }, [data, selectedRole])

    const saveMutation = useMutation({
        mutationFn: () => roleAccessApi.updateRole(selectedRole, draftPages),
        onSuccess: async (result) => {
            queryClient.invalidateQueries({ queryKey: ['role-access'] })
            addToast(`Page access saved for ${ROLE_LABELS[selectedRole]}`, 'success')
            try {
                const mine = await roleAccessApi.getMine()
                setAllowedPages(mine.pages)
            } catch {
                /* ignore */
            }
            return result
        },
        onError: () => addToast('Failed to save role access', 'error'),
    })

    const resetMutation = useMutation({
        mutationFn: () => roleAccessApi.resetRole(selectedRole),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['role-access'] })
            setDraftPages(result.pages)
            addToast(`Reset ${ROLE_LABELS[selectedRole]} to defaults`, 'success')
        },
        onError: () => addToast('Failed to reset role access', 'error'),
    })

    const togglePage = (key: PageKey) => {
        setDraftPages((prev) => {
            if (prev.includes(key)) {
                if (key === 'admin_users' && selectedRole === 'ADMIN') return prev
                const next = prev.filter((p) => p !== key)
                return next.length > 0 ? next : prev
            }
            return [...prev, key]
        })
    }

    const selectAll = () => setDraftPages(PAGE_DEFINITIONS.map((p) => p.key))
    const clearAll = () => {
        if (selectedRole === 'ADMIN') {
            setDraftPages(['admin_users'])
            return
        }
        setDraftPages(['dashboard'])
    }

    return (
        <div className="max-w-4xl mx-auto p-8 animate-in fade-in duration-500">
            <Link
                to="/admin"
                className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary dark:hover:text-white mb-6"
            >
                <ArrowLeft size={16} />
                Administration
            </Link>

            <div className="flex items-start gap-4 mb-8">
                <div className="p-3 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    <Shield size={28} />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-primary dark:text-white tracking-tight">
                        Role page access
                    </h1>
                    <p className="text-primary/60 dark:text-white/60 font-medium mt-1">
                        Choose which sidebar pages each role can see. Changes apply to all users with that role.
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-white/5 rounded-2xl border border-primary/10 dark:border-white/10 p-6 shadow-sm space-y-6">
                <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-2">
                        Role
                    </label>
                    <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value as ConfigurableRole)}
                        className="w-full max-w-md px-4 py-2.5 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] font-bold text-primary dark:text-white"
                    >
                        {CONFIGURABLE_ROLES.map((r) => (
                            <option key={r} value={r}>
                                {ROLE_LABELS[r]}
                            </option>
                        ))}
                    </select>
                </div>

                {isLoading ? (
                    <p className="text-slate-500">Loading…</p>
                ) : (
                    <>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={selectAll}
                                className="text-xs font-bold text-primary dark:text-white hover:underline"
                            >
                                Enable all
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                                type="button"
                                onClick={clearAll}
                                className="text-xs font-bold text-primary/70 dark:text-white/70 hover:underline"
                            >
                                Minimal access
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {PAGE_DEFINITIONS.map((page) => {
                                const checked = draftPages.includes(page.key)
                                const locked = selectedRole === 'ADMIN' && page.key === 'admin_users'
                                return (
                                    <label
                                        key={page.key}
                                        className={clsx(
                                            'flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors',
                                            checked
                                                ? 'border-primary/30 bg-primary/5 dark:bg-white/10'
                                                : 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5',
                                            locked && 'opacity-80 cursor-not-allowed'
                                        )}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            disabled={locked}
                                            onChange={() => togglePage(page.key)}
                                            className="mt-1 size-4 rounded border-slate-300 text-primary focus:ring-primary"
                                        />
                                        <div>
                                            <p className="text-sm font-bold text-primary dark:text-white">
                                                {page.label}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-0.5">{page.description}</p>
                                        </div>
                                    </label>
                                )
                            })}
                        </div>

                        <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100 dark:border-white/10">
                            <button
                                type="button"
                                onClick={() => saveMutation.mutate()}
                                disabled={saveMutation.isPending || draftPages.length === 0}
                                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary dark:bg-white text-white dark:text-primary font-bold text-sm disabled:opacity-50"
                            >
                                <Save size={16} />
                                Save for {ROLE_LABELS[selectedRole]}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (
                                        !confirm(
                                            `Reset ${ROLE_LABELS[selectedRole]} to factory defaults?`
                                        )
                                    )
                                        return
                                    resetMutation.mutate()
                                }}
                                disabled={resetMutation.isPending}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 font-bold text-sm text-primary dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50"
                            >
                                <RotateCcw size={16} />
                                Reset to defaults
                            </button>
                        </div>
                    </>
                )}
            </div>

            <p className="text-xs text-slate-500 mt-6">
                Candidate and Vendor portals use separate routes and are not configured here.
            </p>
        </div>
    )
}

export default RoleAccessEditor
