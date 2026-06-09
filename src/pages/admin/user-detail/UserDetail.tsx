import React, { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
    Mail, Shield, Lock, RefreshCw, Copy, Check,
    User as UserIcon, Phone, Calendar, Briefcase, History, Tags, Trash2,
} from 'lucide-react'
import clsx from 'clsx'
import { api } from '@/services/api'
import { ApiError } from '@/lib/apiClient'
import { useAuth } from '@/hooks/useAuth'
import { useToastStore } from '@/store/toastStore'
import { FeatureTagKey, UserRole } from '@/types'
import { Button } from '@/components/ui/Button'
import { UserStatusToggle } from '@/components/admin/UserStatusToggle'
import { useConfirm } from '@/hooks/useConfirm'
import { SearchableMultiSelect } from '@/components/ui/SearchableMultiSelect'
import { AppSelect } from '@/components/ui/AppSelect'
import { departmentSelectOptions, USER_ROLE_OPTIONS } from '@/lib/selectOptions'
import { FEATURE_TAG_DEFINITIONS } from '@/permissions'
import './user-detail.css'

const INPUT =
    'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none'
const LABEL = 'block text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider mb-1.5'

const setPasswordSchema = z
    .object({
        newPassword: z.string().min(8, 'At least 8 characters'),
        confirmPassword: z.string().min(1, 'Confirm the password'),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    })

type SetPasswordForm = z.infer<typeof setPasswordSchema>

const UserDetail = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { user: currentUser } = useAuth()
    const { addToast } = useToastStore()
    const confirm = useConfirm()

    const [name, setName] = useState('')
    const [department, setDepartment] = useState('')
    const [phoneNumber, setPhoneNumber] = useState('')
    const [address, setAddress] = useState('')
    const [role, setRole] = useState<UserRole>('RECRUITER')
    const [profileSaving, setProfileSaving] = useState(false)
    const [generateLoading, setGenerateLoading] = useState(false)
    const [tempPassword, setTempPassword] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [draftTags, setDraftTags] = useState<FeatureTagKey[]>([])
    const [tagsSaving, setTagsSaving] = useState(false)

    const tagOptions = FEATURE_TAG_DEFINITIONS.map((d) => ({
        value: d.key,
        label: d.label,
        sublabel: d.description,
    }))

    const { data: user, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['user', id],
        queryFn: () => api.users.get(id!),
        enabled: !!id,
    })

    const { data: loginHistory = [], isLoading: loginHistoryLoading } = useQuery({
        queryKey: ['user', id, 'login-history'],
        queryFn: () => api.users.getLoginHistory(id!),
        enabled: !!id,
    })

    const { data: departmentCatalog = [] } = useQuery({
        queryKey: ['department-catalog'],
        queryFn: api.departments.list,
    })
    const departmentNames = departmentCatalog.map((d) => d.name)

    React.useEffect(() => {
        if (!user) return
        setName(user.name)
        setDepartment(user.department ?? '')
        setPhoneNumber(user.phoneNumber ?? '')
        setAddress(user.address ?? '')
        setRole(user.role)
        setDraftTags(user.tags ?? [])
    }, [user])

    const passwordForm = useForm<SetPasswordForm>({
        resolver: zodResolver(setPasswordSchema),
        defaultValues: { newPassword: '', confirmPassword: '' },
    })

    const statusMutation = useMutation({
        mutationFn: (status: 'ACTIVE' | 'DISABLED') => api.users.toggleStatus(id!, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user', id] })
            queryClient.invalidateQueries({ queryKey: ['users'] })
            addToast('Status updated', 'success')
        },
        onError: (err: unknown) => {
            addToast(err instanceof ApiError ? err.message : 'Failed to update status', 'error')
        },
    })

    const deleteMutation = useMutation({
        mutationFn: () => api.users.delete(id!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] })
            addToast('User deleted', 'success')
            navigate('/admin/users')
        },
        onError: (err: unknown) => {
            addToast(err instanceof ApiError ? err.message : 'Failed to delete user', 'error')
        },
    })

    const handleSaveProfile = async () => {
        if (!id) return
        setProfileSaving(true)
        try {
            await api.users.updateProfile(id, {
                name: name.trim(),
                department: department.trim() || null,
                phoneNumber: phoneNumber.trim() || null,
                address: address.trim() || null,
            })
            if (role !== user?.role) {
                if (id === currentUser?.uid) {
                    addToast('You cannot change your own role here', 'error')
                } else {
                    await api.users.updateRole(id, role)
                }
            }
            await refetch()
            queryClient.invalidateQueries({ queryKey: ['users'] })
            addToast('Profile saved', 'success')
        } catch (err) {
            addToast(err instanceof ApiError ? err.message : 'Failed to save profile', 'error')
        } finally {
            setProfileSaving(false)
        }
    }

    const handleRoleOnly = async (newRole: UserRole) => {
        if (!id || id === currentUser?.uid) return
        setRole(newRole)
        try {
            await api.users.updateRole(id, newRole)
            await refetch()
            queryClient.invalidateQueries({ queryKey: ['users'] })
            addToast('Role updated', 'success')
        } catch (err) {
            setRole(user?.role ?? newRole)
            addToast(err instanceof ApiError ? err.message : 'Failed to update role', 'error')
        }
    }

    const onSetPassword = passwordForm.handleSubmit(async (values) => {
        if (!id) return
        try {
            await api.users.resetPassword(id, {
                newPassword: values.newPassword,
            })
            passwordForm.reset({ newPassword: '', confirmPassword: '' })
            setTempPassword(null)
            addToast('Password updated', 'success')
        } catch (err) {
            addToast(err instanceof ApiError ? err.message : 'Failed to set password', 'error')
        }
    })

    const handleGenerateTemporary = async () => {
        if (!id) return
        setGenerateLoading(true)
        setTempPassword(null)
        try {
            const result = await api.users.resetPassword(id, {
                generateTemporary: true,
            })
            if (result.temporaryPassword) {
                setTempPassword(result.temporaryPassword)
            }
            addToast(result.message ?? 'Temporary password generated', 'success')
        } catch (err) {
            addToast(err instanceof ApiError ? err.message : 'Failed to generate password', 'error')
        } finally {
            setGenerateLoading(false)
        }
    }

    const copyTempPassword = async () => {
        if (!tempPassword) return
        await navigator.clipboard.writeText(tempPassword)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleSaveTags = async () => {
        if (!id) return
        setTagsSaving(true)
        try {
            await api.users.updateTags(id, draftTags)
            await refetch()
            queryClient.invalidateQueries({ queryKey: ['users'] })
            addToast('Feature tags updated. User must refresh the page or sign in again to see sidebar changes.', 'success')
        } catch (err) {
            addToast(err instanceof ApiError ? err.message : 'Failed to update tags', 'error')
        } finally {
            setTagsSaving(false)
        }
    }

    const toggleStatus = async () => {
        if (!user || user.uid === currentUser?.uid) {
            addToast('You cannot change your own status', 'error')
            return
        }
        const next = user.status === 'DISABLED' ? 'ACTIVE' : 'DISABLED'
        if (next === 'DISABLED') {
            const ok = await confirm({
                title: 'Disable user',
                message: `${user.name} will not be able to sign in until the account is enabled again.`,
                confirmLabel: 'Disable',
                variant: 'danger',
            })
            if (!ok) return
        }
        statusMutation.mutate(next)
    }

    const handleDeleteUser = async () => {
        if (!user || user.uid === currentUser?.uid) {
            addToast('You cannot delete your own account', 'error')
            return
        }
        const ok = await confirm({
            title: 'Delete user',
            message: `Permanently delete ${user.name} (${user.email})? This cannot be undone.`,
            confirmLabel: 'Delete',
            variant: 'danger',
        })
        if (ok) deleteMutation.mutate()
    }

    if (isLoading) {
        return (
            <div className="p-8 text-center text-page-desc">
                Loading user…
            </div>
        )
    }

    if (isError || !user) {
        return (
            <div className="p-8 max-w-lg mx-auto text-center space-y-4">
                <p className="text-red-600 dark:text-red-400 font-medium">
                    {error instanceof ApiError ? error.message : 'User not found'}
                </p>
            </div>
        )
    }

    const isSelf = user.uid === currentUser?.uid

    return (
        <div className="flex flex-col gap-6 p-6 md:p-8 max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-black text-primary dark:text-white truncate">{user.name}</h1>
                    <p className="text-sm text-page-desc truncate">{user.email}</p>
                </div>
                {!isSelf && (
                    <UserStatusToggle
                        active={user.status !== 'DISABLED'}
                        pending={statusMutation.isPending}
                        onToggle={() => void toggleStatus()}
                        className="shrink-0"
                    />
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <section className="app-card p-6 space-y-5 md:col-span-2">
                    <h2 className="text-sm font-black text-primary dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <UserIcon size={16} /> Profile
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className={LABEL}>Full name</label>
                            <input className={INPUT} value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div>
                            <label className={LABEL}>Email</label>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm text-primary/70 dark:text-white/70">
                                <Mail size={14} className="shrink-0 opacity-50" />
                                {user.email}
                            </div>
                        </div>
                        <div>
                            <label className={LABEL}>Role</label>
                            <AppSelect
                                value={role}
                                onChange={(v) => handleRoleOnly(v as UserRole)}
                                options={USER_ROLE_OPTIONS}
                                disabled={isSelf}
                                aria-label="User role"
                            />
                        </div>
                        <div>
                            <label className={LABEL}>Department</label>
                            <AppSelect
                                value={department}
                                onChange={setDepartment}
                                options={departmentSelectOptions(departmentNames, department)}
                                aria-label="User department"
                            />
                        </div>
                        <div>
                            <label className={LABEL}>Phone</label>
                            <div className="relative">
                                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40" />
                                <input
                                    className={clsx(INPUT, 'pl-9')}
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className={LABEL}>Address</label>
                            <input
                                className={INPUT}
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3 pt-2">
                        <Button onClick={handleSaveProfile} disabled={profileSaving}>
                            {profileSaving ? 'Saving…' : 'Save profile'}
                        </Button>
                        {!isSelf && (
                            <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-outline-variant/50 bg-surface-container-low">
                                <span className="text-m3-label-sm text-on-surface-variant normal-case tracking-normal">
                                    Account access
                                </span>
                                <UserStatusToggle
                                    active={user.status !== 'DISABLED'}
                                    pending={statusMutation.isPending}
                                    onToggle={() => void toggleStatus()}
                                    showLabel
                                />
                            </div>
                        )}
                    </div>
                    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-primary/10 dark:border-white/10 text-sm">
                        <div>
                            <dt className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                                <Calendar size={12} /> Joined
                            </dt>
                            <dd className="font-medium text-primary dark:text-white mt-0.5">
                                {new Date(user.createdAt).toLocaleDateString()}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-[10px] font-bold uppercase text-muted-foreground">Last login</dt>
                            <dd className="font-medium text-primary dark:text-white mt-0.5">
                                {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                                <Shield size={12} /> Auth
                            </dt>
                            <dd className="font-medium text-primary dark:text-white mt-0.5 capitalize">
                                {user.authProvider ?? 'local'}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                                <Briefcase size={12} /> Theme
                            </dt>
                            <dd className="font-medium text-primary dark:text-white mt-0.5 capitalize">
                                {user.themePreference}
                            </dd>
                        </div>
                    </dl>
                </section>

                <section className="app-card p-6 space-y-4 md:col-span-2">
                    <h2 className="text-sm font-black text-primary dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <Tags size={16} /> Feature tags
                    </h2>
                    <p className="text-sm text-primary/60 dark:text-white/60">
                        Tags unlock Careers (portal applicants), Employee referral (ERP), and MIS dashboards.
                        Admins always have access to every feature.
                    </p>
                    <SearchableMultiSelect
                        value={draftTags}
                        onChange={(v) => setDraftTags(v as FeatureTagKey[])}
                        options={tagOptions}
                        placeholder="Add feature tag..."
                        searchPlaceholder="Search features..."
                    />
                    <div className="flex flex-wrap gap-2">
                        {draftTags.length === 0 ? (
                            <span className="text-xs text-muted-foreground">No feature tags assigned.</span>
                        ) : (
                            draftTags.map((t) => {
                                const def = FEATURE_TAG_DEFINITIONS.find((d) => d.key === t)
                                return (
                                    <span
                                        key={t}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-primary/10 dark:bg-white/10 text-primary dark:text-white border border-primary/15 dark:border-white/15"
                                    >
                                        {def?.label ?? t}
                                    </span>
                                )
                            })
                        )}
                    </div>
                    <Button
                        onClick={handleSaveTags}
                        disabled={tagsSaving || JSON.stringify(draftTags) === JSON.stringify(user.tags ?? [])}
                    >
                        {tagsSaving ? 'Saving…' : 'Save feature tags'}
                    </Button>
                </section>

                <section className="app-card p-6 space-y-4 md:col-span-2">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-sm font-black text-primary dark:text-white uppercase tracking-wider flex items-center gap-2">
                            <History size={16} /> Login history
                        </h2>
                        <span className="text-xs font-bold text-primary/50 dark:text-white/50">
                            {loginHistory.length} {loginHistory.length === 1 ? 'entry' : 'entries'}
                        </span>
                    </div>
                    <p className="text-sm text-primary/60 dark:text-white/60">
                        Each successful sign-in is recorded with date, IP address, and browser.
                    </p>
                    {loginHistoryLoading ? (
                        <p className="text-sm text-primary/50 dark:text-white/50 py-6 text-center">Loading login history…</p>
                    ) : loginHistory.length === 0 ? (
                        <p className="text-sm text-primary/50 dark:text-white/50 py-6 text-center rounded-xl border border-dashed border-primary/10 dark:border-white/10">
                            No sign-ins recorded yet.
                        </p>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-primary/10 dark:border-white/10">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-primary/[0.03] dark:bg-white/[0.03] text-left">
                                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-primary/50 dark:text-white/50">
                                            Date & time
                                        </th>
                                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-primary/50 dark:text-white/50">
                                            IP address
                                        </th>
                                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-primary/50 dark:text-white/50 hidden md:table-cell">
                                            Browser / device
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-primary/5 dark:divide-white/5">
                                    {loginHistory.map((entry) => (
                                        <tr key={entry.id} className="hover:bg-primary/[0.02] dark:hover:bg-white/[0.02]">
                                            <td className="px-4 py-3 font-medium text-primary dark:text-white whitespace-nowrap">
                                                {new Date(entry.loggedInAt).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-primary/70 dark:text-white/70 font-mono text-xs">
                                                {entry.ipAddress || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-primary/60 dark:text-white/60 text-xs max-w-md truncate hidden md:table-cell" title={entry.userAgent}>
                                                {entry.userAgent || '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <section className="app-card p-6 space-y-5 md:col-span-2">
                    <h2 className="text-sm font-black text-primary dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <Lock size={16} /> Password
                    </h2>
                    <p className="text-sm text-primary/60 dark:text-white/60">
                        Set a new password for this user or generate a temporary one. Optionally email the new password to them.
                    </p>

                    <form onSubmit={onSetPassword} className="space-y-4 max-w-md">
                        <div>
                            <label className={LABEL}>New password</label>
                            <input
                                type="password"
                                className={INPUT}
                                autoComplete="new-password"
                                {...passwordForm.register('newPassword')}
                            />
                            {passwordForm.formState.errors.newPassword && (
                                <p className="text-xs text-red-600 mt-1">{passwordForm.formState.errors.newPassword.message}</p>
                            )}
                        </div>
                        <div>
                            <label className={LABEL}>Confirm password</label>
                            <input
                                type="password"
                                className={INPUT}
                                autoComplete="new-password"
                                {...passwordForm.register('confirmPassword')}
                            />
                            {passwordForm.formState.errors.confirmPassword && (
                                <p className="text-xs text-red-600 mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>
                            )}
                        </div>
                        <Button type="submit">Set password</Button>
                    </form>

                    <div className="border-t border-primary/10 dark:border-white/10 pt-5 space-y-3">
                        <p className="text-xs font-bold text-primary/50 dark:text-white/50 uppercase tracking-wider">
                            Or generate temporary password
                        </p>
                        <p className="text-xs text-primary/60 dark:text-white/60">
                            User must change it on next sign-in. Share the password with them securely.
                        </p>
                        <button
                            type="button"
                            onClick={handleGenerateTemporary}
                            disabled={generateLoading}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg bg-primary/10 dark:bg-white/10 text-primary dark:text-white hover:bg-primary/15 dark:hover:bg-white/15 disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={generateLoading ? 'animate-spin' : ''} />
                            {generateLoading ? 'Generating…' : 'Generate temporary password'}
                        </button>
                        {tempPassword && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40">
                                <code className="text-sm font-mono text-amber-900 dark:text-amber-100 flex-1 break-all">
                                    {tempPassword}
                                </code>
                                <button
                                    type="button"
                                    onClick={copyTempPassword}
                                    className="p-2 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-200"
                                    title="Copy password"
                                >
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {!isSelf && (
                    <section className="app-card p-6 space-y-4 md:col-span-2 border border-red-200/60 dark:border-red-900/40">
                        <h2 className="text-sm font-black text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-2">
                            <Trash2 size={16} /> Danger zone
                        </h2>
                        <p className="text-sm text-primary/60 dark:text-white/60">
                            Permanently remove this user account. Login history will be deleted. This action cannot be undone.
                        </p>
                        <Button
                            variant="danger"
                            onClick={() => void handleDeleteUser()}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? 'Deleting…' : 'Delete user'}
                        </Button>
                    </section>
                )}
            </div>
        </div>
    )
}

export default UserDetail
