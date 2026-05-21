import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
    ArrowLeft, Mail, Shield, Lock, RefreshCw, Copy, Check,
    User as UserIcon, Phone, MapPin, Calendar, Briefcase,
} from 'lucide-react'
import clsx from 'clsx'
import { api } from '../../services/api'
import { ApiError } from '../../lib/apiClient'
import { useAuth } from '../../hooks/useAuth'
import { useToastStore } from '../../store/toastStore'
import { UserRole } from '../../types'
import { Button } from '../../components/ui/Button'

const INPUT =
    'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none'
const LABEL = 'block text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider mb-1.5'

const setPasswordSchema = z
    .object({
        newPassword: z.string().min(8, 'At least 8 characters'),
        confirmPassword: z.string().min(1, 'Confirm the password'),
        sendEmail: z.boolean(),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    })

type SetPasswordForm = z.infer<typeof setPasswordSchema>

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
    { value: 'ADMIN', label: 'Admin' },
    { value: 'HR_HEAD', label: 'HR Head' },
    { value: 'HR_MANAGER', label: 'HR Manager' },
    { value: 'RECRUITER', label: 'Recruiter' },
    { value: 'TEAM_LEAD', label: 'Team Lead' },
    { value: 'HIRING_MANAGER', label: 'Hiring Manager' },
    { value: 'INTERVIEWER', label: 'Interviewer' },
    { value: 'CANDIDATE', label: 'Candidate' },
]

const DEPARTMENT_SUGGESTIONS = ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'HR', 'Operations', 'Finance']

const UserDetail = () => {
    const { id } = useParams<{ id: string }>()
    const queryClient = useQueryClient()
    const { user: currentUser } = useAuth()
    const { addToast } = useToastStore()

    const [name, setName] = useState('')
    const [department, setDepartment] = useState('')
    const [phoneNumber, setPhoneNumber] = useState('')
    const [address, setAddress] = useState('')
    const [role, setRole] = useState<UserRole>('RECRUITER')
    const [profileSaving, setProfileSaving] = useState(false)
    const [tempPassword, setTempPassword] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [generateLoading, setGenerateLoading] = useState(false)
    const [sendEmailOnGenerate, setSendEmailOnGenerate] = useState(true)

    const { data: user, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['user', id],
        queryFn: () => api.users.get(id!),
        enabled: !!id,
    })

    React.useEffect(() => {
        if (!user) return
        setName(user.name)
        setDepartment(user.department ?? '')
        setPhoneNumber(user.phoneNumber ?? '')
        setAddress(user.address ?? '')
        setRole(user.role)
    }, [user])

    const passwordForm = useForm<SetPasswordForm>({
        resolver: zodResolver(setPasswordSchema),
        defaultValues: { newPassword: '', confirmPassword: '', sendEmail: true },
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
            const result = await api.users.resetPassword(id, {
                newPassword: values.newPassword,
                sendEmail: values.sendEmail,
            })
            passwordForm.reset({ newPassword: '', confirmPassword: '', sendEmail: true })
            if (result.emailSent) {
                addToast('Password updated and emailed to the user', 'success')
            } else if (result.emailWarning) {
                addToast(`Password updated. ${result.emailWarning}`, 'warning')
            } else {
                addToast('Password updated', 'success')
            }
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
                sendEmail: sendEmailOnGenerate,
            })
            if (result.temporaryPassword) {
                setTempPassword(result.temporaryPassword)
            }
            if (result.emailSent) {
                addToast('Temporary password generated and emailed', 'success')
            } else if (result.emailWarning) {
                addToast(result.emailWarning, 'warning')
                if (result.temporaryPassword) {
                    addToast('Copy the temporary password below', 'info')
                }
            } else {
                addToast('Temporary password generated', 'success')
            }
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

    const toggleStatus = () => {
        if (!user || user.uid === currentUser?.uid) {
            addToast('You cannot change your own status', 'error')
            return
        }
        const next = user.status === 'DISABLED' ? 'ACTIVE' : 'DISABLED'
        statusMutation.mutate(next)
    }

    if (isLoading) {
        return (
            <div className="p-8 text-center text-primary/60 dark:text-white/60 font-medium">
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
                <Link to="/admin/users" className="text-primary dark:text-white font-bold text-sm hover:underline">
                    ← Back to User Management
                </Link>
            </div>
        )
    }

    const isSelf = user.uid === currentUser?.uid

    return (
        <div className="flex flex-col gap-6 p-6 md:p-8 max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-3">
                <Link
                    to="/admin/users"
                    className="p-2 rounded-lg hover:bg-primary/5 dark:hover:bg-white/10 text-primary/60 dark:text-white/60"
                    aria-label="Back to users"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-black text-primary dark:text-white truncate">{user.name}</h1>
                    <p className="text-sm text-primary/60 dark:text-white/60 font-medium truncate">{user.email}</p>
                </div>
                <span
                    className={clsx(
                        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border shrink-0',
                        user.status === 'DISABLED'
                            ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300'
                    )}
                >
                    {user.status === 'DISABLED' ? 'Disabled' : 'Active'}
                </span>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <section className="bg-white dark:bg-white/5 rounded-2xl border border-primary/10 dark:border-white/10 p-6 space-y-5 md:col-span-2">
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
                            <select
                                className={INPUT}
                                value={role}
                                disabled={isSelf}
                                onChange={(e) => handleRoleOnly(e.target.value as UserRole)}
                            >
                                {ROLE_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={LABEL}>Department</label>
                            <input
                                className={INPUT}
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                list="user-dept-suggestions"
                                placeholder="e.g. Engineering"
                            />
                            <datalist id="user-dept-suggestions">
                                {DEPARTMENT_SUGGESTIONS.map((d) => (
                                    <option key={d} value={d} />
                                ))}
                            </datalist>
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
                            <button
                                type="button"
                                onClick={toggleStatus}
                                disabled={statusMutation.isPending}
                                className="px-4 py-2 text-sm font-bold rounded-lg border border-primary/20 dark:border-white/20 text-primary dark:text-white hover:bg-primary/5 dark:hover:bg-white/10"
                            >
                                {user.status === 'DISABLED' ? 'Enable account' : 'Disable account'}
                            </button>
                        )}
                    </div>
                    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-primary/10 dark:border-white/10 text-sm">
                        <div>
                            <dt className="text-[10px] font-bold uppercase text-primary/40 dark:text-white/40 flex items-center gap-1">
                                <Calendar size={12} /> Joined
                            </dt>
                            <dd className="font-medium text-primary dark:text-white mt-0.5">
                                {new Date(user.createdAt).toLocaleDateString()}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-[10px] font-bold uppercase text-primary/40 dark:text-white/40">Last login</dt>
                            <dd className="font-medium text-primary dark:text-white mt-0.5">
                                {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-[10px] font-bold uppercase text-primary/40 dark:text-white/40 flex items-center gap-1">
                                <Shield size={12} /> Auth
                            </dt>
                            <dd className="font-medium text-primary dark:text-white mt-0.5 capitalize">
                                {user.authProvider ?? 'local'}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-[10px] font-bold uppercase text-primary/40 dark:text-white/40 flex items-center gap-1">
                                <Briefcase size={12} /> Theme
                            </dt>
                            <dd className="font-medium text-primary dark:text-white mt-0.5 capitalize">
                                {user.themePreference}
                            </dd>
                        </div>
                    </dl>
                </section>

                <section className="bg-white dark:bg-white/5 rounded-2xl border border-primary/10 dark:border-white/10 p-6 space-y-5 md:col-span-2">
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
                        <label className="flex items-center gap-2 text-sm font-medium text-primary/80 dark:text-white/80 cursor-pointer">
                            <input type="checkbox" className="rounded" {...passwordForm.register('sendEmail')} />
                            Email new password to user
                        </label>
                        <Button type="submit">Set password</Button>
                    </form>

                    <div className="border-t border-primary/10 dark:border-white/10 pt-5 space-y-3">
                        <p className="text-xs font-bold text-primary/50 dark:text-white/50 uppercase tracking-wider">
                            Or generate temporary password
                        </p>
                        <label className="flex items-center gap-2 text-sm font-medium text-primary/80 dark:text-white/80 cursor-pointer">
                            <input
                                type="checkbox"
                                className="rounded"
                                checked={sendEmailOnGenerate}
                                onChange={(e) => setSendEmailOnGenerate(e.target.checked)}
                            />
                            Email temporary password to user
                        </label>
                        <button
                            type="button"
                            onClick={handleGenerateTemporary}
                            disabled={generateLoading}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg bg-primary/10 dark:bg-white/10 text-primary dark:text-white hover:bg-primary/15 dark:hover:bg-white/15 disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={generateLoading ? 'animate-spin' : ''} />
                            {generateLoading ? 'Generating…' : 'Generate & reset password'}
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
            </div>
        </div>
    )
}

export default UserDetail
