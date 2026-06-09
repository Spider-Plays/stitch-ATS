import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { useThemeStore } from '@/store/themeStore'
import {
    User,
    Shield,
    Moon,
    CheckCircle,
    Lock,
    Globe,
    Monitor,
    AlertCircle,
    Mail,
    Phone,
    KeyRound,
    Settings2,
    Sun,
    Eye,
    EyeOff,
    BadgeCheck,
    Building2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'
import { AppSelect } from '@/components/ui/AppSelect'
import { LANGUAGE_OPTIONS } from '@/lib/selectOptions'
import { useForm, type UseFormRegisterReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '@/services/http/auth'
import { api } from '@/services/api'
import { ApiError } from '@/lib/apiClient'
import { useToastStore } from '@/store/toastStore'
import { PageHero } from '@/components/layout/PageHero'
import { AnimatedTabNav } from '@/components/motion/AnimatedTabNav'
import { TabContent } from '@/components/motion/TabContent'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/Switch'
import { InterviewStatCard } from '@/components/interviews/InterviewStatCard'
import './account.css'

const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, 'Enter your current password'),
        newPassword: z.string().min(8, 'At least 8 characters'),
        confirmPassword: z.string().min(1, 'Confirm your new password'),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    })

type ChangePasswordForm = z.infer<typeof changePasswordSchema>

function roleLabel(role?: string) {
    return role?.replace(/_/g, ' ') ?? '—'
}

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
    return (
        <label
            htmlFor={htmlFor}
            className="text-xs font-bold uppercase tracking-wider text-primary/50 dark:text-white/50 block"
        >
            {children}
        </label>
    )
}

function SettingsSection({
    icon: Icon,
    title,
    description,
    children,
    action,
}: {
    icon: LucideIcon
    title: string
    description: string
    children: React.ReactNode
    action?: React.ReactNode
}) {
    return (
        <section className="app-card shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 md:p-6 border-b border-outline-variant/40 bg-surface-container-low/80">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="size-11 shrink-0 rounded-xl bg-primary/10 dark:bg-white/10 flex items-center justify-center text-primary dark:text-white">
                        <Icon size={22} strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-base font-bold text-primary dark:text-white">{title}</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                    </div>
                </div>
                {action}
            </div>
            <div className="p-5 md:p-6">{children}</div>
        </section>
    )
}

function ProfileDetailRow({
    icon: Icon,
    label,
    value,
    muted,
}: {
    icon: LucideIcon
    label: string
    value: string
    muted?: boolean
}) {
    return (
        <div className="flex items-start gap-3 p-3 rounded-xl border border-outline-variant/60 bg-surface-container-low shadow-[var(--app-control-shadow)]">
            <div className="size-8 shrink-0 rounded-lg bg-primary/10 dark:bg-white/10 flex items-center justify-center text-primary dark:text-white">
                <Icon size={16} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
                <p
                    className={clsx(
                        'text-sm font-semibold mt-0.5 break-all',
                        muted ? 'text-muted-foreground italic' : 'text-primary dark:text-white'
                    )}
                >
                    {value}
                </p>
            </div>
        </div>
    )
}

function PreferenceRow({
    icon: Icon,
    title,
    description,
    control,
}: {
    icon: LucideIcon
    title: string
    description: string
    control: React.ReactNode
}) {
    return (
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-outline-variant/50 bg-surface-container-low/50 hover:bg-surface-container-low transition-colors">
            <div className="flex items-center gap-3 min-w-0">
                <div className="size-9 shrink-0 rounded-lg bg-surface-container-high flex items-center justify-center text-primary/70 dark:text-white/70">
                    <Icon size={18} />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-bold text-primary dark:text-white">{title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                </div>
            </div>
            <div className="shrink-0">{control}</div>
        </div>
    )
}

function PasswordField({
    id,
    label,
    error,
    show,
    onToggleShow,
    registration,
}: {
    id: string
    label: string
    error?: string
    show: boolean
    onToggleShow: () => void
    registration: UseFormRegisterReturn
}) {
    return (
        <div className="space-y-1.5">
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <div className="relative">
                <input
                    id={id}
                    type={show ? 'text' : 'password'}
                    className="app-input w-full !min-h-12 !py-3 !pr-12"
                    autoComplete={id.includes('current') ? 'current-password' : 'new-password'}
                    {...registration}
                />
                <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-muted-foreground hover:text-primary dark:hover:text-white transition-colors"
                    onClick={onToggleShow}
                    aria-label={show ? 'Hide password' : 'Show password'}
                >
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
            {error && <p className="text-xs font-semibold text-red-600 dark:text-red-400">{error}</p>}
        </div>
    )
}

const Settings = () => {
    const { user, refreshUser } = useAuth()
    const { addToast } = useToastStore()
    const [profileName, setProfileName] = useState(user?.name ?? '')
    const [profilePhone, setProfilePhone] = useState(user?.phoneNumber ?? '')
    const [profileSaving, setProfileSaving] = useState(false)

    React.useEffect(() => {
        if (user) {
            setProfileName(user.name)
            setProfilePhone(user.phoneNumber ?? '')
        }
    }, [user])

    const { theme, toggleTheme } = useThemeStore()
    const isDark = theme === 'dark'
    const [activeTab, setActiveTab] = useState<'GENERAL' | 'SECURITY'>('GENERAL')
    const [showPasswordForm, setShowPasswordForm] = useState(false)
    const [passwordLoading, setPasswordLoading] = useState(false)
    const [passwordError, setPasswordError] = useState<string | null>(null)
    const [passwordSuccess, setPasswordSuccess] = useState(false)
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)

    const passwordForm = useForm<ChangePasswordForm>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    })

    const onSaveProfile = async () => {
        setProfileSaving(true)
        try {
            await api.users.updateMe({
                name: profileName.trim(),
                phoneNumber: profilePhone.trim() || undefined,
            })
            await refreshUser()
            addToast('Profile updated', 'success')
        } catch (err) {
            addToast(err instanceof ApiError ? err.message : 'Failed to save profile', 'error')
        } finally {
            setProfileSaving(false)
        }
    }

    const onChangePassword = async (data: ChangePasswordForm) => {
        setPasswordLoading(true)
        setPasswordError(null)
        setPasswordSuccess(false)
        try {
            await authApi.changePassword(data.currentPassword, data.newPassword)
            passwordForm.reset()
            setShowPasswordForm(false)
            setPasswordSuccess(true)
            setTimeout(() => setPasswordSuccess(false), 5000)
            addToast('Password updated', 'success')
        } catch (err) {
            setPasswordError(
                err instanceof ApiError ? err.message : 'Failed to update password. Try again.'
            )
        } finally {
            setPasswordLoading(false)
        }
    }

    const profileDirty =
        profileName.trim() !== (user?.name ?? '').trim() ||
        profilePhone.trim() !== (user?.phoneNumber ?? '').trim()

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
            <PageHero
                icon={Settings2}
                eyebrow="Your account"
                title="Settings"
                description="Update your profile, appearance, and security preferences for this workspace."
            />

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,17rem)_1fr] gap-6 lg:gap-8 items-start">
                {/* Profile sidebar */}
                <aside className="app-card p-5 md:p-6 shadow-sm lg:sticky lg:top-6 space-y-5">
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="relative">
                            <div className="size-24 rounded-2xl border-2 border-outline-variant/60 overflow-hidden shadow-m3-2 ring-4 ring-primary/10 dark:ring-white/10">
                                <UserAvatar name={user?.name} avatar={user?.avatar} className="w-full h-full" />
                            </div>
                            <span className="absolute -bottom-1 -right-1 size-7 rounded-full bg-emerald-500 border-2 border-surface-container-lowest flex items-center justify-center text-white">
                                <BadgeCheck size={14} strokeWidth={2.5} />
                            </span>
                        </div>
                        <div className="min-w-0 w-full">
                            <p className="text-lg font-black text-primary dark:text-white truncate">
                                {user?.name ?? 'User'}
                            </p>
                        </div>
                        <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-container text-on-primary-container border border-primary/15 shadow-[var(--app-control-shadow)]">
                            {roleLabel(user?.role)}
                        </span>
                    </div>

                    <div className="space-y-2.5 pt-4 border-t border-outline-variant/40">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                            Account details
                        </p>
                        <ProfileDetailRow
                            icon={Mail}
                            label="Email"
                            value={user?.email ?? '—'}
                        />
                        <ProfileDetailRow
                            icon={Phone}
                            label="Phone"
                            value={user?.phoneNumber?.trim() || 'Not set'}
                            muted={!user?.phoneNumber?.trim()}
                        />
                        {user?.department && (
                            <ProfileDetailRow
                                icon={Building2}
                                label="Department"
                                value={user.department}
                            />
                        )}
                    </div>
                </aside>

                {/* Main panel */}
                <div className="min-w-0 space-y-6">
                    <AnimatedTabNav
                        layoutId="settings-tabs"
                        variant="pill"
                        className="overflow-x-auto custom-scrollbar"
                        aria-label="Settings sections"
                        tabs={[
                            {
                                id: 'GENERAL',
                                label: (
                                    <>
                                        <User size={18} aria-hidden />
                                        General
                                    </>
                                ),
                            },
                            {
                                id: 'SECURITY',
                                label: (
                                    <>
                                        <Shield size={18} aria-hidden />
                                        Security
                                    </>
                                ),
                            },
                        ]}
                        activeId={activeTab}
                        onChange={(id) => setActiveTab(id as 'GENERAL' | 'SECURITY')}
                    />

                    <TabContent activeKey={activeTab} className="space-y-6">
                        {activeTab === 'GENERAL' && (
                            <>
                                <SettingsSection
                                    icon={User}
                                    title="Profile"
                                    description="Name and contact details visible to your team."
                                    action={
                                        <Button
                                            type="button"
                                            variant="primary"
                                            size="sm"
                                            className="!rounded-xl shrink-0"
                                            disabled={profileSaving || !profileDirty}
                                            isLoading={profileSaving}
                                            onClick={onSaveProfile}
                                        >
                                            Save changes
                                        </Button>
                                    }
                                >
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div className="space-y-1.5 sm:col-span-2">
                                            <FieldLabel htmlFor="profile-name">Full name</FieldLabel>
                                            <input
                                                id="profile-name"
                                                type="text"
                                                className="app-input w-full !min-h-12"
                                                value={profileName}
                                                onChange={(e) => setProfileName(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <FieldLabel htmlFor="profile-email">Email</FieldLabel>
                                            <div className="relative">
                                                <Mail
                                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                                                    size={18}
                                                />
                                                <input
                                                    id="profile-email"
                                                    type="email"
                                                    disabled
                                                    value={user?.email ?? ''}
                                                    className="app-input app-input-leading-icon w-full !min-h-12 opacity-80 cursor-not-allowed"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <FieldLabel htmlFor="profile-role">Role</FieldLabel>
                                            <input
                                                id="profile-role"
                                                type="text"
                                                disabled
                                                value={roleLabel(user?.role)}
                                                className="app-input w-full !min-h-12 opacity-80 cursor-not-allowed capitalize"
                                            />
                                        </div>
                                        <div className="space-y-1.5 sm:col-span-2">
                                            <FieldLabel htmlFor="profile-phone">Phone</FieldLabel>
                                            <div className="relative">
                                                <Phone
                                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                                                    size={18}
                                                />
                                                <input
                                                    id="profile-phone"
                                                    type="tel"
                                                    className="app-input app-input-leading-icon w-full !min-h-12"
                                                    placeholder="Optional contact number"
                                                    value={profilePhone}
                                                    onChange={(e) => setProfilePhone(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </SettingsSection>

                                <SettingsSection
                                    icon={Monitor}
                                    title="Appearance & language"
                                    description="How Stitch ATS looks and reads for you."
                                >
                                    <div className="space-y-3">
                                        <PreferenceRow
                                            icon={isDark ? Moon : Sun}
                                            title="Dark mode"
                                            description={
                                                isDark
                                                    ? 'Dark theme is on — easier on the eyes at night'
                                                    : 'Light theme is on — crisp and bright'
                                            }
                                            control={
                                                <Switch
                                                    checked={isDark}
                                                    onChange={() => toggleTheme()}
                                                    ariaLabel="Toggle dark mode"
                                                />
                                            }
                                        />
                                        <PreferenceRow
                                            icon={Globe}
                                            title="Language"
                                            description="UI language (more locales coming soon)"
                                            control={
                                                <AppSelect
                                                    className="min-w-[9rem]"
                                                    size="sm"
                                                    value="en-US"
                                                    onChange={() => {}}
                                                    options={LANGUAGE_OPTIONS}
                                                    aria-label="Default language"
                                                />
                                            }
                                        />
                                    </div>
                                </SettingsSection>
                            </>
                        )}

                        {activeTab === 'SECURITY' && (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <InterviewStatCard
                                        label="Account"
                                        value={1}
                                        icon={BadgeCheck}
                                        accent="green"
                                    />
                                    <InterviewStatCard
                                        label="2FA"
                                        value={1}
                                        icon={Shield}
                                        accent="blue"
                                    />
                                    <InterviewStatCard
                                        label="Credentials"
                                        value={1}
                                        icon={KeyRound}
                                        accent="amber"
                                    />
                                </div>

                                <SettingsSection
                                    icon={Shield}
                                    title="Account protection"
                                    description="Extra layers that keep your workspace secure."
                                >
                                    <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-emerald-500/25 bg-emerald-500/5 dark:bg-emerald-500/10">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <CheckCircle
                                                size={22}
                                                className="text-emerald-600 dark:text-emerald-400 shrink-0"
                                            />
                                            <div>
                                                <p className="text-sm font-bold text-primary dark:text-white">
                                                    Two-factor authentication
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    SMS or authenticator app
                                                </p>
                                            </div>
                                        </div>
                                        <span className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                            Enabled
                                        </span>
                                    </div>
                                </SettingsSection>

                                <SettingsSection
                                    icon={KeyRound}
                                    title="Password"
                                    description="Use a strong password you do not reuse elsewhere."
                                >
                                    {passwordSuccess && (
                                        <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-sm font-medium flex items-center gap-2">
                                            <CheckCircle size={18} className="shrink-0" />
                                            Password updated successfully.
                                        </div>
                                    )}

                                    {!showPasswordForm ? (
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl border border-dashed border-outline-variant/70 bg-surface-container-low/40">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary/60 dark:text-white/60">
                                                    <Lock size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-primary dark:text-white">
                                                        Password is set
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        Last changed date is not tracked in this demo
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="!rounded-xl shrink-0"
                                                onClick={() => {
                                                    setShowPasswordForm(true)
                                                    setPasswordError(null)
                                                    setPasswordSuccess(false)
                                                }}
                                            >
                                                Change password
                                            </Button>
                                        </div>
                                    ) : (
                                        <form
                                            onSubmit={passwordForm.handleSubmit(onChangePassword)}
                                            className="space-y-4 p-4 md:p-5 rounded-xl border border-outline-variant/50 bg-surface-container-low/30"
                                        >
                                            <p className="text-sm font-bold text-primary dark:text-white">
                                                Set a new password
                                            </p>

                                            {passwordError && (
                                                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                                                    <AlertCircle size={18} className="shrink-0" />
                                                    {passwordError}
                                                </div>
                                            )}

                                            <PasswordField
                                                id="current-password"
                                                label="Current password"
                                                show={showCurrentPassword}
                                                onToggleShow={() => setShowCurrentPassword((v) => !v)}
                                                error={passwordForm.formState.errors.currentPassword?.message}
                                                registration={passwordForm.register('currentPassword')}
                                            />
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <PasswordField
                                                    id="new-password"
                                                    label="New password"
                                                    show={showNewPassword}
                                                    onToggleShow={() => setShowNewPassword((v) => !v)}
                                                    error={passwordForm.formState.errors.newPassword?.message}
                                                    registration={passwordForm.register('newPassword')}
                                                />
                                                <div className="space-y-1.5">
                                                    <FieldLabel htmlFor="confirm-password">
                                                        Confirm password
                                                    </FieldLabel>
                                                    <input
                                                        id="confirm-password"
                                                        type={showNewPassword ? 'text' : 'password'}
                                                        className="app-input w-full !min-h-12"
                                                        autoComplete="new-password"
                                                        {...passwordForm.register('confirmPassword')}
                                                    />
                                                    {passwordForm.formState.errors.confirmPassword && (
                                                        <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                                                            {
                                                                passwordForm.formState.errors.confirmPassword
                                                                    .message
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-3 pt-2">
                                                <Button
                                                    type="submit"
                                                    variant="primary"
                                                    className="!rounded-xl flex-1 sm:flex-none min-w-[10rem]"
                                                    disabled={passwordLoading}
                                                    isLoading={passwordLoading}
                                                >
                                                    Update password
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="!rounded-xl"
                                                    onClick={() => {
                                                        setShowPasswordForm(false)
                                                        passwordForm.reset()
                                                        setPasswordError(null)
                                                    }}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </form>
                                    )}
                                </SettingsSection>
                            </>
                        )}
                    </TabContent>
                </div>
            </div>
        </div>
    )
}

export default Settings
