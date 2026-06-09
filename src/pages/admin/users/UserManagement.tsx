import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { User, UserRole } from '@/types';
import { FEATURE_TAG_DEFINITIONS, isAdminRole, canManageUsers } from '@/permissions';
import {
    Users, Shield,
    KeyRound, XCircle,
    Download, UserPlus, Monitor, ChevronLeft, ChevronRight, RefreshCw, Copy, Check,
} from 'lucide-react';
import { ActionsMenu } from '@/components/ui/ActionsMenu';
import { useToastStore } from '@/store/toastStore';
import { useConfirm } from '@/hooks/useConfirm';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/lib/apiClient';
import clsx from 'clsx';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { UserStatusToggle } from '@/components/admin/UserStatusToggle';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppSelect } from '@/components/ui/AppSelect';
import { PageHeader } from '@/components/layout/PageHeader';
import { ListSearchBar } from '@/components/ui/ListSearchBar';
import { heroBtnPrimary, heroBtnSecondary } from '@/components/layout/PageHero';
import {
    departmentSelectOptions,
    ADD_USER_ROLE_OPTIONS,
    USER_ROLE_FILTER_OPTIONS,
    USER_ROLE_OPTIONS,
    USER_STATUS_FILTER_OPTIONS,
    toRole,
} from '@/lib/selectOptions';
import { generateTempPassword } from '@/lib/tempPassword';
import './users.css';

const addUserSchema = z.object({
    email: z.string().email('Enter a valid email'),
    name: z.string().min(1, 'Name is required'),
    role: z.enum(['SUPER_ADMIN', 'ADMIN', 'HR_HEAD', 'HR_MANAGER', 'RECRUITER', 'TEAM_LEAD', 'HIRING_MANAGER', 'INTERVIEWER', 'CANDIDATE', 'VENDOR', 'EMPLOYEE']),
    department: z.string().max(120).optional(),
    phoneNumber: z.string().max(40).optional(),
    address: z.string().max(500).optional(),
    temporaryPassword: z.string().min(8, 'Temporary password must be at least 8 characters'),
})

type AddUserFormValues = z.infer<typeof addUserSchema>

const UserManagement = () => {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const queryClient = useQueryClient();
    const { addToast } = useToastStore();
    const confirm = useConfirm();
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DISABLED'>('ALL');
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [createdCredentials, setCreatedCredentials] = useState<{ email: string; temporaryPassword: string } | null>(null);
    const [copiedField, setCopiedField] = useState<'email' | 'password' | null>(null);
    const addUserForm = useForm<AddUserFormValues>({
        resolver: zodResolver(addUserSchema),
        defaultValues: {
            email: '',
            name: '',
            role: 'RECRUITER',
            department: '',
            phoneNumber: '',
            address: '',
            temporaryPassword: generateTempPassword(),
        },
    })

    // Fetch Users
    const { data, isLoading, isError, isFetching, refetch } = useQuery({
        queryKey: ['users'],
        queryFn: api.users.list,
    });
    const users = isError ? [] : (data ?? []);

    const { data: departmentCatalog = [] } = useQuery({
        queryKey: ['department-catalog'],
        queryFn: api.departments.list,
    });
    const departmentNames = departmentCatalog.map((d) => d.name);

    // Mutations
    const updateRoleMutation = useMutation({
        mutationFn: ({ uid, role }: { uid: string, role: UserRole }) =>
            api.users.updateRole(uid, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: () => alert('Failed to update role')
    });

    const toggleStatusMutation = useMutation({
        mutationFn: ({ uid, status }: { uid: string, status: 'ACTIVE' | 'DISABLED' }) =>
            api.users.toggleStatus(uid, status),
        onSuccess: (_data, { status }) => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            addToast(status === 'DISABLED' ? 'User disabled' : 'User enabled', 'success');
        },
        onError: (err: unknown) => {
            const msg = err instanceof ApiError ? err.message : 'Failed to update user status';
            addToast(msg, 'error');
        },
    });

    const deleteUserMutation = useMutation({
        mutationFn: (uid: string) => api.users.delete(uid),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            addToast('User deleted', 'success');
        },
        onError: (err: unknown) => {
            const msg = err instanceof ApiError ? err.message : 'Failed to delete user';
            addToast(msg, 'error');
        },
    });

    const updateProfileMutation = useMutation({
        mutationFn: ({ uid, department }: { uid: string; department: string | null }) =>
            api.users.updateProfile(uid, { department }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            addToast('Department updated', 'success');
        },
        onError: (err: unknown) => {
            const msg = err instanceof ApiError ? err.message : 'Failed to update department';
            addToast(msg, 'error');
        },
    });

    const handleRoleChange = (uid: string, newRole: string) => {
        if (uid === currentUser?.uid) {
            alert("You cannot change your own role.");
            return;
        }
        updateRoleMutation.mutate({ uid, role: newRole as UserRole });
    };

    const handleDepartmentChange = (u: User, value: string) => {
        const trimmed = value.trim();
        const next = trimmed || null;
        if ((u.department ?? null) === next) return;
        updateProfileMutation.mutate({ uid: u.uid, department: next });
    };

    const userMenuItems = (u: User) => [
        {
            id: 'details',
            label: 'View user details',
            onClick: () => navigate(`/admin/users/${u.uid}`),
        },
        {
            id: 'department',
            label: u.department ? 'Edit department' : 'Add department',
            onClick: () => navigate(`/admin/users/${u.uid}`),
        },
        {
            id: 'status',
            label: u.status === 'DISABLED' ? 'Enable user' : 'Disable user',
            hidden: u.uid === currentUser?.uid,
            onClick: () => handleToggleStatus(u.uid, u.status),
        },
        {
            id: 'delete',
            label: 'Delete user',
            variant: 'danger' as const,
            hidden: u.uid === currentUser?.uid,
            onClick: () => handleDeleteUser(u),
        },
    ];

    const handleToggleStatus = async (uid: string, currentStatus?: 'ACTIVE' | 'DISABLED') => {
        if (uid === currentUser?.uid) {
            addToast('You cannot disable yourself.', 'error');
            return;
        }
        const newStatus = currentStatus === 'DISABLED' ? 'ACTIVE' : 'DISABLED';
        const ok = await confirm({
            title: newStatus === 'DISABLED' ? 'Disable user' : 'Enable user',
            message: `Are you sure you want to ${newStatus === 'DISABLED' ? 'disable' : 'enable'} this user?`,
            confirmLabel: newStatus === 'DISABLED' ? 'Disable' : 'Enable',
            variant: newStatus === 'DISABLED' ? 'danger' : 'primary',
        });
        if (ok) toggleStatusMutation.mutate({ uid, status: newStatus });
    };

    const handleDeleteUser = async (u: User) => {
        if (u.uid === currentUser?.uid) {
            addToast('You cannot delete your own account.', 'error');
            return;
        }
        const ok = await confirm({
            title: 'Delete user',
            message: `Permanently delete ${u.name} (${u.email})? This cannot be undone.`,
            confirmLabel: 'Delete',
            variant: 'danger',
        });
        if (ok) deleteUserMutation.mutate(u.uid);
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
        const matchesStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? user.status !== 'DISABLED' : user.status === 'DISABLED');
        return matchesSearch && matchesRole && matchesStatus;
    });

    const addUserMutation = useMutation({
        mutationFn: (data: AddUserFormValues) =>
            api.users.create({
                email: data.email,
                name: data.name,
                role: data.role,
                department: data.department || undefined,
                phoneNumber: data.phoneNumber || undefined,
                address: data.address || undefined,
                temporaryPassword: data.temporaryPassword,
            }),
        onSuccess: (result, variables) => {
            queryClient.invalidateQueries({ queryKey: ['users'] })
            setIsAddUserOpen(false)
            setCreatedCredentials({
                email: result.user.email,
                temporaryPassword: variables.temporaryPassword,
            })
            addUserForm.reset({
                email: '',
                name: '',
                role: 'RECRUITER',
                department: '',
                phoneNumber: '',
                address: '',
                temporaryPassword: generateTempPassword(),
            })
            addToast('User created — share the temporary password with them', 'success')
        },
        onError: (err: unknown) => {
            const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Failed to add user'
            addToast(msg, 'error')
        },
    })

    const handleAddUser = addUserForm.handleSubmit((data) => addUserMutation.mutate(data))

    const copyCredential = async (field: 'email' | 'password', value: string) => {
        await navigator.clipboard.writeText(value)
        setCopiedField(field)
        setTimeout(() => setCopiedField(null), 2000)
    }

    const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
        <div className="app-card p-5 rounded-xl border border-primary/10 dark:border-white/10 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
                <div className={clsx("p-2 rounded-lg", colorClass)}>
                    <Icon size={20} />
                </div>
            </div>
            <h4 className="font-bold text-primary dark:text-white text-2xl">{value}</h4>
            <p className="text-xs text-primary/60 dark:text-white/60 mt-1">{title}</p>
        </div>
    )

    return (
        <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col animate-in fade-in duration-500">
            <PageHeader
                highlighted
                icon={Users}
                eyebrow="Team access"
                title="User Administration"
                description="Manage your team's access levels and roles."
                className="mb-8 shrink-0"
                actions={
                    <div className="flex gap-2 flex-wrap">
                        <button type="button" className={heroBtnSecondary}>
                            <Download size={18} />
                            Export
                        </button>
                        <button type="button" onClick={() => setIsAddUserOpen(true)} className={heroBtnPrimary}>
                            <UserPlus size={18} />
                            Add User
                        </button>
                    </div>
                }
            />

            {isError && !isFetching && (
                <div className="mb-6 p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/10 text-amber-800 dark:text-amber-300 text-sm font-medium">
                    Could not load users (session may be invalid after a database reset).{' '}
                    <button type="button" onClick={() => refetch()} className="underline font-bold">
                        Retry
                    </button>
                    {' '}or sign out and sign in again.
                </div>
            )}

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 shrink-0">
                <StatCard title="Total Users" value={users.length} icon={Users} colorClass="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" />
                <StatCard title="Admins" value={users.filter(u => isAdminRole(u.role)).length} icon={Shield} colorClass="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" />
                <StatCard title="Active Users" value={users.filter(u => u.status !== 'DISABLED').length} icon={Monitor} colorClass="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" />
                <StatCard title="Must reset password" value={users.filter((u) => u.mustChangePassword).length} icon={KeyRound} colorClass="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" />
            </div>

            {/* Filters & Search */}
            <div className="app-card p-4 rounded-xl border border-primary/10 dark:border-white/10 mb-6 flex gap-4 flex-wrap shrink-0 shadow-sm">
                <div className="flex-1 min-w-[300px]">
                    <ListSearchBar
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search users by name or email..."
                        className="max-w-none"
                    />
                </div>
                <AppSelect
                    className="min-w-[160px]"
                    value={roleFilter}
                    onChange={(v) => setRoleFilter(v as UserRole | 'ALL')}
                    options={USER_ROLE_FILTER_OPTIONS}
                    aria-label="Filter by role"
                />
                <AppSelect
                    className="min-w-[160px]"
                    value={statusFilter}
                    onChange={(v) => setStatusFilter(v as 'ALL' | 'ACTIVE' | 'DISABLED')}
                    options={USER_STATUS_FILTER_OPTIONS}
                    aria-label="Filter by status"
                />
            </div>

            {/* Users Table */}
            <div className="app-card rounded-2xl border border-primary/10 dark:border-white/10 overflow-visible shadow-sm flex-1 flex flex-col">
                <div className="overflow-auto overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-primary/[0.02] dark:bg-white/[0.02] border-b border-primary/10 dark:border-white/10 sticky top-0 z-10 backdrop-blur-sm">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">User Details</th>
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Department</th>
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Feature tags</th>
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Last Login</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-primary/5 dark:divide-white/5">
                            {isLoading ? (
                                <tr><td colSpan={7} className="p-12 text-center text-page-desc">Loading users...</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan={7} className="p-12 text-center text-page-desc">No users found.</td></tr>
                            ) : (
                                filteredUsers.map((u) => (
                                    <tr key={u.uid} className="hover:bg-primary/[0.02] dark:hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <UserAvatar
                                                    name={u.name}
                                                    avatar={u.avatar}
                                                    borderClassName="border border-primary/10 dark:border-white/10"
                                                />
                                                <div className="min-w-0">
                                                    <Link
                                                        to={`/admin/users/${u.uid}`}
                                                        className="font-bold text-primary dark:text-white text-sm hover:underline block truncate"
                                                    >
                                                        {u.name}
                                                    </Link>
                                                    <p className="text-xs text-page-desc truncate">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 max-w-[200px]">
                                            <AppSelect
                                                size="sm"
                                                value={u.role}
                                                onChange={(v) => handleRoleChange(u.uid, v)}
                                                options={USER_ROLE_OPTIONS}
                                                disabled={u.uid === currentUser?.uid}
                                                aria-label={`Role for ${u.name}`}
                                            />
                                        </td>
                                        <td className="px-6 py-4 max-w-[200px]">
                                            <AppSelect
                                                size="sm"
                                                value={u.department ?? ''}
                                                onChange={(v) => handleDepartmentChange(u, v)}
                                                options={departmentSelectOptions(departmentNames, u.department)}
                                                disabled={updateProfileMutation.isPending}
                                                aria-label={`Department for ${u.name}`}
                                            />
                                        </td>
                                        <td className="px-6 py-4 max-w-[200px]">
                                            {isAdminRole(u.role) ? (
                                                <span className="text-[10px] font-bold uppercase text-primary/40 dark:text-white/40">All features</span>
                                            ) : (u.tags?.length ?? 0) === 0 ? (
                                                <span className="text-xs text-page-desc">—</span>
                                            ) : (
                                                <div className="flex flex-wrap gap-1">
                                                    {u.tags.map((t) => {
                                                        const label = FEATURE_TAG_DEFINITIONS.find((d) => d.key === t)?.label ?? t
                                                        return (
                                                            <span
                                                                key={t}
                                                                className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-primary/10 dark:bg-white/10 text-primary/80 dark:text-white/80"
                                                            >
                                                                {label}
                                                            </span>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <UserStatusToggle
                                                active={u.status !== 'DISABLED'}
                                                disabled={u.uid === currentUser?.uid}
                                                pending={
                                                    toggleStatusMutation.isPending &&
                                                    toggleStatusMutation.variables?.uid === u.uid
                                                }
                                                onToggle={() => handleToggleStatus(u.uid, u.status)}
                                                size="sm"
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-primary/50 dark:text-white/50">
                                            {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <ActionsMenu
                                                items={userMenuItems(u)}
                                                aria-label={`Actions for ${u.name}`}
                                            />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Footer Pagination (Mock) */}
                <div className="px-6 py-4 border-t border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] flex items-center justify-between shrink-0">
                    <button className="px-3 py-1 text-xs font-bold text-primary/60 dark:text-white/60 hover:text-primary dark:hover:text-white transition-colors flex items-center gap-1 disabled:opacity-30">
                        <ChevronLeft size={14} /> Previous
                    </button>
                    <div className="flex gap-1">
                        <button className="size-8 rounded flex items-center justify-center text-xs font-bold bg-primary text-primary-foreground">1</button>
                    </div>
                    <button className="px-3 py-1 text-xs font-bold text-primary/60 dark:text-white/60 hover:text-primary dark:hover:text-white transition-colors flex items-center gap-1 disabled:opacity-30">
                        Next <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            {/* Add user drawer */}
            {isAddUserOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" onClick={() => setIsAddUserOpen(false)}></div>
                    <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                        <div className="px-6 py-4 border-b border-primary/10 dark:border-white/10 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-primary dark:text-white">Add team member</h3>
                            <button type="button" onClick={() => setIsAddUserOpen(false)} className="p-2 hover:bg-primary/5 dark:hover:bg-white/10 rounded-full text-primary/60 dark:text-white/60">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddUser} className="flex flex-col flex-1 min-h-0">
                        <div className="p-8 flex-1 overflow-y-auto space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider mb-2">Full name</label>
                                    <input
                                        type="text"
                                        placeholder="Jane Smith"
                                        className="w-full px-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary font-medium text-primary dark:text-white"
                                        {...addUserForm.register('name')}
                                    />
                                    {addUserForm.formState.errors.name && (
                                        <p className="text-xs text-red-600 mt-1">{addUserForm.formState.errors.name.message}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider mb-2">Email address</label>
                                    <input
                                        type="email"
                                        placeholder="colleague@company.com"
                                        className="w-full px-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary font-medium text-primary dark:text-white"
                                        {...addUserForm.register('email')}
                                    />
                                    {addUserForm.formState.errors.email && (
                                        <p className="text-xs text-red-600 mt-1">{addUserForm.formState.errors.email.message}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider mb-2">Role</label>
                                    <AppSelect
                                        value={addUserForm.watch('role')}
                                        onChange={(v) => addUserForm.setValue('role', toRole(v) as AddUserFormValues['role'])}
                                        options={ADD_USER_ROLE_OPTIONS}
                                        aria-label="User role"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider mb-2">Department</label>
                                    <AppSelect
                                        value={addUserForm.watch('department') ?? ''}
                                        onChange={(v) => addUserForm.setValue('department', v || undefined)}
                                        options={departmentSelectOptions(departmentNames)}
                                        aria-label="Department"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider mb-2">Phone (optional)</label>
                                    <input
                                        type="tel"
                                        className="w-full px-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary font-medium text-primary dark:text-white"
                                        {...addUserForm.register('phoneNumber')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider mb-2">Address (optional)</label>
                                    <textarea
                                        rows={2}
                                        className="w-full px-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary font-medium text-primary dark:text-white resize-none"
                                        {...addUserForm.register('address')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider mb-2">Temporary password</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            autoComplete="off"
                                            className="flex-1 px-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary font-mono text-sm text-primary dark:text-white"
                                            {...addUserForm.register('temporaryPassword')}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => addUserForm.setValue('temporaryPassword', generateTempPassword())}
                                            className="px-3 py-2 rounded-xl border border-primary/10 dark:border-white/10 text-primary dark:text-white hover:bg-primary/5 dark:hover:bg-white/10"
                                            title="Generate password"
                                        >
                                            <RefreshCw size={18} />
                                        </button>
                                    </div>
                                    {addUserForm.formState.errors.temporaryPassword && (
                                        <p className="text-xs text-red-600 mt-1">{addUserForm.formState.errors.temporaryPassword.message}</p>
                                    )}
                                </div>
                                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100 rounded-xl text-sm leading-relaxed">
                                    Share the email and temporary password with the new member securely. They must set a new password on first sign-in.
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02]">
                            <button
                                type="submit"
                                disabled={addUserMutation.isPending}
                                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 shadow-lg shadow-primary/20 dark:shadow-none transition-all disabled:opacity-60"
                            >
                                {addUserMutation.isPending ? 'Creating…' : 'Create user'}
                            </button>
                        </div>
                        </form>
                    </div>
                </div>
            )}

            {createdCredentials && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-primary/30 backdrop-blur-sm" onClick={() => setCreatedCredentials(null)} />
                    <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-primary/10 dark:border-white/10 p-6 space-y-4">
                        <h3 className="font-bold text-lg text-primary dark:text-white">Share sign-in details</h3>
                        <p className="text-sm text-page-desc">
                            Give these credentials to the new member. They will be prompted to choose a new password on first login.
                        </p>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 dark:bg-white/5">
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold uppercase text-primary/50 dark:text-white/50">Email</p>
                                    <p className="text-sm font-medium truncate">{createdCredentials.email}</p>
                                </div>
                                <button type="button" onClick={() => copyCredential('email', createdCredentials.email)} className="p-2 rounded-lg hover:bg-primary/10">
                                    {copiedField === 'email' ? <Check size={16} /> : <Copy size={16} />}
                                </button>
                            </div>
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold uppercase text-amber-800/60 dark:text-amber-200/60">Temporary password</p>
                                    <p className="text-sm font-mono break-all">{createdCredentials.temporaryPassword}</p>
                                </div>
                                <button type="button" onClick={() => copyCredential('password', createdCredentials.temporaryPassword)} className="p-2 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40">
                                    {copiedField === 'password' ? <Check size={16} className="text-amber-800" /> : <Copy size={16} className="text-amber-800" />}
                                </button>
                            </div>
                        </div>
                        <button type="button" onClick={() => setCreatedCredentials(null)} className="w-full py-2.5 bg-primary text-primary-foreground font-bold rounded-xl">
                            Done
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default UserManagement;
