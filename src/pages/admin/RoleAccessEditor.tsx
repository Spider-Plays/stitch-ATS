import React, { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    Briefcase,
    GitBranch,
    Handshake,
    LayoutDashboard,
    LayoutGrid,
    MoreHorizontal,
    Search,
    Settings,
    Shield,
    UserPlus,
    Users,
    Video,
    X,
    type LucideIcon,
} from 'lucide-react'
import { SearchableSelect } from '../../components/ui/SearchableSelect'
import { AnimatedTabNav } from '../../components/motion/AnimatedTabNav'
import { InputWithIcon } from '../../components/ui/InputWithIcon'
import { roleAccessApi } from '../../services/http/roleAccess'
import {
    CONFIGURABLE_ROLES,
    ConfigurableRole,
    PageKey,
    PAGE_DEFINITIONS,
} from '../../lib/pageAccess'
import { useToastStore } from '../../store/toastStore'
import { useConfirm } from '../../hooks/useConfirm'
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

type PageDef = (typeof PAGE_DEFINITIONS)[number]

const PAGE_ICONS: Record<PageKey, LucideIcon> = {
    dashboard: LayoutDashboard,
    requirements: Briefcase,
    vendors: Handshake,
    candidates: Users,
    pipeline: GitBranch,
    interviews: Video,
    offers: LayoutGrid,
    admin_users: UserPlus,
    notifications: LayoutGrid,
    settings: Settings,
}

function pagesAvailableForRole(role: ConfigurableRole): PageDef[] {
    return PAGE_DEFINITIONS.filter((p) => role === 'ADMIN' || p.key !== 'admin_users')
}

function pageRoute(key: PageKey): string {
    if (key === 'dashboard') return '/dashboard'
    if (key === 'admin_users') return '/admin'
    return `/${key}`
}

const PageAccessCard = ({
    page,
    onRemove,
    removing,
    locked,
}: {
    page: PageDef
    onRemove: () => void
    removing: boolean
    locked?: boolean
}) => {
    const Icon = PAGE_ICONS[page.key] ?? LayoutGrid

    return (
        <div className="group relative flex flex-col gap-3 rounded-xl border border-primary/10 bg-white p-4 shadow-sm hover:border-primary/30 hover:shadow-md dark:border-white/10 dark:bg-white/5 transition-all">
            <div className="flex items-start justify-between">
                <div className="flex gap-3 min-w-0">
                    <div className="size-10 shrink-0 rounded-lg bg-primary/10 dark:bg-white/10 flex items-center justify-center text-primary dark:text-white">
                        <Icon size={18} strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                        <h4 className="text-sm font-bold text-primary dark:text-white truncate">
                            {page.label}
                        </h4>
                        <div className="text-[11px] font-medium text-primary/50 dark:text-white/40 uppercase tracking-wide">
                            {pageRoute(page.key)}
                        </div>
                    </div>
                </div>
                {!locked && (
                    <button
                        type="button"
                        onClick={onRemove}
                        disabled={removing}
                        className="p-1 rounded-lg text-primary/30 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50 shrink-0"
                        aria-label={`Remove ${page.label} access`}
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            <div className="flex items-center gap-2 rounded bg-primary/5 p-2 dark:bg-white/5">
                <p className="text-[11px] font-medium text-primary dark:text-white leading-snug">
                    {page.description}
                </p>
            </div>
        </div>
    )
}

const RoleColumn = ({
    role,
    enabledPages,
    onAdd,
    onRemove,
    onReset,
    addOptions,
    saving,
}: {
    role: ConfigurableRole
    enabledPages: PageDef[]
    onAdd: (pageKey: PageKey) => void
    onRemove: (pageKey: PageKey) => void
    onReset: () => void
    addOptions: { value: string; label: string; sublabel?: string }[]
    saving: boolean
}) => {
    const [pickerOpen, setPickerOpen] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)

    return (
        <div className="flex-shrink-0 w-80 flex flex-col h-full">
            <div className="flex items-center justify-between px-1 mb-4">
                <div className="flex items-center gap-2 min-w-0">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary/60 dark:text-white/60 truncate">
                        {ROLE_LABELS[role]}
                    </h3>
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary/10 px-1.5 text-[10px] font-bold text-primary dark:bg-white/10 dark:text-white shrink-0">
                        {enabledPages.length}
                    </span>
                </div>
                <div className="relative shrink-0">
                    <button
                        type="button"
                        onClick={() => setMenuOpen((o) => !o)}
                        className="text-primary/30 hover:text-primary dark:text-white/30 dark:hover:text-white transition-colors"
                        aria-label={`${ROLE_LABELS[role]} column options`}
                    >
                        <MoreHorizontal size={18} />
                    </button>
                    {menuOpen && (
                        <>
                            <button
                                type="button"
                                className="fixed inset-0 z-10"
                                aria-label="Close menu"
                                onClick={() => setMenuOpen(false)}
                            />
                            <div className="absolute right-0 top-full mt-1 z-20 min-w-[10rem] rounded-xl border border-primary/10 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-slate-900">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMenuOpen(false)
                                        onReset()
                                    }}
                                    disabled={saving}
                                    className="w-full px-3 py-2 text-left text-xs font-bold text-primary dark:text-white hover:bg-primary/5 dark:hover:bg-white/5 disabled:opacity-50"
                                >
                                    Reset to defaults
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-2 pb-20">
                {enabledPages.map((page) => {
                    const locked = role === 'ADMIN' && page.key === 'admin_users'
                    return (
                        <PageAccessCard
                            key={page.key}
                            page={page}
                            locked={locked}
                            onRemove={() => onRemove(page.key)}
                            removing={saving}
                        />
                    )
                })}

                {enabledPages.length === 0 && (
                    <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-primary/5 dark:border-white/5 rounded-xl bg-primary/[0.02] dark:bg-white/[0.02] text-primary/30 dark:text-white/30">
                        <span className="text-xs font-bold uppercase tracking-wider">No pages</span>
                    </div>
                )}

                <div className="rounded-xl border border-dashed border-primary/15 dark:border-white/15 p-3 bg-primary/[0.02] dark:bg-white/[0.02]">
                    {pickerOpen ? (
                        <div className="space-y-2">
                            <SearchableSelect
                                value=""
                                onChange={(key) => {
                                    if (key) {
                                        onAdd(key as PageKey)
                                        setPickerOpen(false)
                                    }
                                }}
                                options={addOptions}
                                placeholder="Select page..."
                                searchPlaceholder="Search pages..."
                            />
                            <button
                                type="button"
                                onClick={() => setPickerOpen(false)}
                                className="w-full text-xs font-bold text-primary/50 dark:text-white/50 hover:text-primary dark:hover:text-white"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setPickerOpen(true)}
                            disabled={saving || addOptions.length === 0}
                            className="w-full flex items-center justify-center gap-2 py-2 text-[12px] font-bold text-primary dark:text-white hover:bg-primary/5 dark:hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <UserPlus size={16} />
                            Add page
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

const RoleAccessEditor = () => {
    const queryClient = useQueryClient()
    const { addToast } = useToastStore()
    const confirm = useConfirm()
    const { setAllowedPages, user } = useAuth()
    const [searchTerm, setSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState<'ALL' | ConfigurableRole>('ALL')
    const [accessByRole, setAccessByRole] = useState<Record<ConfigurableRole, PageKey[]>>({
        ADMIN: [],
        HR_HEAD: [],
        HR_MANAGER: [],
        RECRUITER: [],
        TEAM_LEAD: [],
        HIRING_MANAGER: [],
        INTERVIEWER: [],
    })

    const { data, isLoading } = useQuery({
        queryKey: ['role-access'],
        queryFn: () => roleAccessApi.getAll(),
    })

    useEffect(() => {
        if (!data?.access) return
        const next = {} as Record<ConfigurableRole, PageKey[]>
        for (const role of CONFIGURABLE_ROLES) {
            next[role] = [...(data.access[role]?.pages ?? [])]
        }
        setAccessByRole(next)
    }, [data])

    const saveMutation = useMutation({
        mutationFn: ({ role, pages }: { role: ConfigurableRole; pages: PageKey[] }) =>
            roleAccessApi.updateRole(role, pages),
        onSuccess: async (_result, { role }) => {
            queryClient.invalidateQueries({ queryKey: ['role-access'] })
            addToast(`Page access updated for ${ROLE_LABELS[role]}`, 'success')
            if (user?.role === role) {
                try {
                    const mine = await roleAccessApi.getMine()
                    setAllowedPages(mine.pages)
                } catch {
                    /* ignore */
                }
            }
        },
        onError: () => addToast('Failed to save role access', 'error'),
    })

    const resetMutation = useMutation({
        mutationFn: (role: ConfigurableRole) => roleAccessApi.resetRole(role),
        onSuccess: (result, role) => {
            queryClient.invalidateQueries({ queryKey: ['role-access'] })
            setAccessByRole((prev) => ({ ...prev, [role]: result.pages }))
            addToast(`Reset ${ROLE_LABELS[role]} to defaults`, 'success')
            if (user?.role === role) {
                setAllowedPages(result.pages)
            }
        },
        onError: () => addToast('Failed to reset role access', 'error'),
    })

    const updateRolePages = (role: ConfigurableRole, pages: PageKey[]) => {
        if (pages.length === 0) {
            addToast('Each role must have at least one page', 'error')
            return
        }
        if (role === 'ADMIN' && !pages.includes('admin_users')) {
            addToast('Admin must keep User Management access', 'error')
            return
        }
        setAccessByRole((prev) => ({ ...prev, [role]: pages }))
        saveMutation.mutate({ role, pages })
    }

    const matchesSearch = (page: PageDef) => {
        if (!searchTerm.trim()) return true
        const q = searchTerm.toLowerCase()
        return (
            page.label.toLowerCase().includes(q) ||
            page.description.toLowerCase().includes(q) ||
            page.key.toLowerCase().includes(q) ||
            pageRoute(page.key).toLowerCase().includes(q)
        )
    }

    const visibleRoles = useMemo(
        () => (roleFilter === 'ALL' ? CONFIGURABLE_ROLES : [roleFilter]),
        [roleFilter]
    )

    const handleResetRole = async (role: ConfigurableRole) => {
        const ok = await confirm({
            title: 'Reset role access',
            message: `Reset ${ROLE_LABELS[role]} to factory defaults?`,
            confirmLabel: 'Reset',
            variant: 'danger',
        })
        if (!ok) return
        resetMutation.mutate(role)
    }

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] animate-in fade-in duration-500">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div className="flex gap-4 items-center min-w-0">
                    <div className="size-10 m3-surface-primary rounded-xl flex items-center justify-center shadow-m3-2 shrink-0">
                        <Shield size={20} className="text-primary" aria-hidden />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-2xl font-black text-primary dark:text-white tracking-tight">
                            Role page access
                        </h1>
                        <p className="text-sm font-medium text-primary/60 dark:text-white/60">
                            Choose which sidebar pages each role can see — changes apply to all users with that role
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <InputWithIcon
                        type="text"
                        icon={<Search size={18} />}
                        placeholder="Search pages..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        wrapperClassName="w-64"
                        className="!min-h-10 !py-2.5 !rounded-xl text-sm"
                    />
                </div>
            </div>

            <AnimatedTabNav
                layoutId="role-access-filter"
                variant="pill"
                className="mb-2 overflow-x-auto custom-scrollbar max-w-full"
                aria-label="Filter roles"
                tabs={[
                    { id: 'ALL', label: 'All roles' },
                    ...CONFIGURABLE_ROLES.map((role) => ({
                        id: role,
                        label: ROLE_LABELS[role],
                    })),
                ]}
                activeId={roleFilter}
                onChange={(id) => setRoleFilter(id as 'ALL' | ConfigurableRole)}
            />

            <p className="text-xs text-primary/50 dark:text-white/40 mb-4 -mt-2">
                Candidate and Vendor portals use separate routes and are not configured here.
            </p>

            {isLoading ? (
                <p className="text-sm text-muted-foreground font-medium py-12 text-center">
                    Loading role access…
                </p>
            ) : (
                <div className="flex-1 min-h-[420px] flex gap-6 overflow-x-auto pb-6 custom-scrollbar">
                    {visibleRoles.map((role) => {
                        const rolePages = accessByRole[role] ?? []
                        const enabledPages = pagesAvailableForRole(role)
                            .filter((p) => rolePages.includes(p.key))
                            .filter(matchesSearch)

                        const addOptions = pagesAvailableForRole(role)
                            .filter((p) => !rolePages.includes(p.key) && matchesSearch(p))
                            .map((p) => ({
                                value: p.key,
                                label: p.label,
                                sublabel: p.description,
                            }))

                        return (
                            <RoleColumn
                                key={role}
                                role={role}
                                enabledPages={enabledPages}
                                saving={saveMutation.isPending || resetMutation.isPending}
                                addOptions={addOptions}
                                onAdd={(pageKey) => updateRolePages(role, [...rolePages, pageKey])}
                                onRemove={(pageKey) => {
                                    if (role === 'ADMIN' && pageKey === 'admin_users') return
                                    const next = rolePages.filter((k) => k !== pageKey)
                                    updateRolePages(role, next)
                                }}
                                onReset={() => handleResetRole(role)}
                            />
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default RoleAccessEditor
