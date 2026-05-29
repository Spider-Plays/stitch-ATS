import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { User, UserRole } from '../../types';
import {
    Users, Search, Shield,
    Mail, XCircle, Trash2,
    Download, UserPlus, Briefcase, Monitor, ChevronLeft, ChevronRight, Building2
} from 'lucide-react';
import { ActionsMenu } from '../../components/ui/ActionsMenu';
import { useToastStore } from '../../store/toastStore';
import { useAuth } from '../../hooks/useAuth';
import { ApiError } from '../../lib/apiClient';
import clsx from 'clsx';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const inviteSchema = z.object({
    email: z.string().email('Enter a valid email'),
    name: z.string().optional(),
    role: z.enum(['ADMIN', 'HR_HEAD', 'HR_MANAGER', 'RECRUITER', 'TEAM_LEAD', 'HIRING_MANAGER', 'INTERVIEWER', 'CANDIDATE', 'VENDOR']),
    department: z.string().max(120).optional(),
})

type InviteFormValues = z.infer<typeof inviteSchema>

const UserManagement = () => {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const queryClient = useQueryClient();
    const { addToast } = useToastStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DISABLED'>('ALL');
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const inviteForm = useForm<InviteFormValues>({
        resolver: zodResolver(inviteSchema),
        defaultValues: { email: '', name: '', role: 'RECRUITER', department: '' },
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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        }
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
    ];

    const handleToggleStatus = (uid: string, currentStatus?: 'ACTIVE' | 'DISABLED') => {
        if (uid === currentUser?.uid) {
            alert("You cannot disable yourself.");
            return;
        }
        const newStatus = currentStatus === 'DISABLED' ? 'ACTIVE' : 'DISABLED';
        if (confirm(`Are you sure you want to ${newStatus === 'DISABLED' ? 'disable' : 'enable'} this user?`)) {
            toggleStatusMutation.mutate({ uid, status: newStatus });
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
        const matchesStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? user.status !== 'DISABLED' : user.status === 'DISABLED');
        return matchesSearch && matchesRole && matchesStatus;
    });

    const inviteMutation = useMutation({
        mutationFn: (data: InviteFormValues) => api.users.invite(data),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['users'] })
            setIsInviteOpen(false)
            inviteForm.reset()
            if (result.emailSent) {
                alert(`Invitation sent to ${result.user.email}.`)
            } else if (result.temporaryPassword) {
                alert(
                    `User created. Email is not configured (set RESEND_API_KEY on Render).\n\n` +
                    `Email: ${result.user.email}\nTemporary password: ${result.temporaryPassword}`
                )
            } else {
                alert(`User ${result.user.email} was created.`)
            }
        },
        onError: (err: unknown) => {
            const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Failed to send invite'
            alert(msg)
        },
    })

    const handleInvite = inviteForm.handleSubmit((data) => inviteMutation.mutate(data))

    const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
        <div className="bg-white dark:bg-white/5 p-5 rounded-xl border border-primary/10 dark:border-white/10 shadow-sm relative overflow-hidden group">
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
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-primary dark:text-white tracking-tight">User Administration</h1>
                    <p className="text-primary/60 dark:text-white/60 font-medium mt-1">Manage your team's access levels and roles.</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                    <Link
                        to="/admin"
                        className="px-4 py-2 bg-white dark:bg-white/5 border border-primary/10 dark:border-white/10 text-primary dark:text-white font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-primary/5 dark:hover:bg-white/10 shadow-sm transition-all"
                    >
                        <Building2 size={18} />
                        Administration
                    </Link>
                    <button className="px-4 py-2 bg-white dark:bg-white/5 border border-primary/10 dark:border-white/10 text-primary dark:text-white font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-primary/5 dark:hover:bg-white/10 shadow-sm transition-all">
                        <Download size={18} />
                        Export
                    </button>
                    <button
                        onClick={() => setIsInviteOpen(true)}
                        className="px-6 py-2 bg-primary dark:bg-white text-white dark:text-primary font-bold rounded-xl text-sm flex items-center gap-2 hover:opacity-90 shadow-lg shadow-primary/20 dark:shadow-none transition-all"
                    >
                        <UserPlus size={18} />
                        Invite New User
                    </button>
                </div>
            </div>

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
                <StatCard title="Admins" value={users.filter(u => u.role === 'ADMIN').length} icon={Shield} colorClass="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" />
                <StatCard title="Active Users" value={users.filter(u => u.status !== 'DISABLED').length} icon={Monitor} colorClass="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" />
                <StatCard title="Pending Invites" value="0" icon={Mail} colorClass="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" />
            </div>

            {/* Filters & Search */}
            <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-primary/10 dark:border-white/10 mb-6 flex gap-4 flex-wrap shrink-0 shadow-sm">
                <div className="flex-1 min-w-[300px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40 dark:text-white/40" size={18} />
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:ring-2 focus:ring-primary/20 outline-none font-medium text-primary dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="px-4 py-2 rounded-lg border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm text-primary dark:text-white cursor-pointer"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as any)}
                >
                    <option value="ALL">All Roles</option>
                    <option value="ADMIN">Admin</option>
                    <option value="HR_HEAD">HR Head</option>
                    <option value="HR_MANAGER">HR Manager</option>
                    <option value="RECRUITER">Recruiter</option>
                    <option value="HIRING_MANAGER">Hiring Manager</option>
                    <option value="INTERVIEWER">Interviewer</option>
                    <option value="CANDIDATE">Candidate</option>
                </select>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-white/5 rounded-2xl border border-primary/10 dark:border-white/10 overflow-visible shadow-sm flex-1 flex flex-col">
                <div className="overflow-auto overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-primary/[0.02] dark:bg-white/[0.02] border-b border-primary/10 dark:border-white/10 sticky top-0 z-10 backdrop-blur-sm">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-primary/40 dark:text-white/40 uppercase tracking-wider">User Details</th>
                                <th className="px-6 py-4 text-xs font-bold text-primary/40 dark:text-white/40 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-xs font-bold text-primary/40 dark:text-white/40 uppercase tracking-wider">Department</th>
                                <th className="px-6 py-4 text-xs font-bold text-primary/40 dark:text-white/40 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-primary/40 dark:text-white/40 uppercase tracking-wider">Last Login</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-primary/40 dark:text-white/40 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-primary/5 dark:divide-white/5">
                            {isLoading ? (
                                <tr><td colSpan={6} className="p-12 text-center text-primary/60 dark:text-white/60 font-medium">Loading users...</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan={6} className="p-12 text-center text-primary/60 dark:text-white/60 font-medium">No users found.</td></tr>
                            ) : (
                                filteredUsers.map((u) => (
                                    <tr key={u.uid} className="hover:bg-primary/[0.02] dark:hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-full bg-primary/10 dark:bg-white/10 flex items-center justify-center text-primary dark:text-white font-bold overflow-hidden border border-primary/10 dark:border-white/10">
                                                    {u.avatar ? <img src={u.avatar} className="size-full object-cover" alt={u.name} /> : u.name.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <Link
                                                        to={`/admin/users/${u.uid}`}
                                                        className="font-bold text-primary dark:text-white text-sm hover:underline block truncate"
                                                    >
                                                        {u.name}
                                                    </Link>
                                                    <p className="text-xs text-primary/60 dark:text-white/60 font-medium truncate">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={u.role}
                                                onChange={(e) => handleRoleChange(u.uid, e.target.value)}
                                                disabled={u.uid === currentUser?.uid}
                                                className="bg-transparent text-sm font-bold text-primary dark:text-white border-none outline-none focus:ring-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed py-0 pl-0 pr-6"
                                            >
                                                <option value="ADMIN">Admin</option>
                                                <option value="HR_HEAD">HR Head</option>
                                                <option value="HR_MANAGER">HR Manager</option>
                                                <option value="RECRUITER">Recruiter</option>
                                                <option value="HIRING_MANAGER">Hiring Manager</option>
                                                <option value="INTERVIEWER">Interviewer</option>
                                                <option value="CANDIDATE">Candidate</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={u.department ?? ''}
                                                onChange={(e) => handleDepartmentChange(u, e.target.value)}
                                                disabled={updateProfileMutation.isPending}
                                                className="text-sm font-medium text-primary dark:text-white border border-primary/10 dark:border-white/10 rounded-lg px-2 py-1.5 bg-white dark:bg-white/5 max-w-[180px] disabled:opacity-50"
                                                title="Set user department"
                                            >
                                                <option value="">— None —</option>
                                                {u.department && !departmentNames.includes(u.department) && (
                                                    <option value={u.department}>{u.department}</option>
                                                )}
                                                {departmentNames.map((name) => (
                                                    <option key={name} value={name}>
                                                        {name}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={clsx(
                                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border",
                                                u.status === 'DISABLED'
                                                    ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/30'
                                                    : 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900/30'
                                            )}>
                                                <span className={clsx("size-1.5 rounded-full", u.status === 'DISABLED' ? "bg-red-500" : "bg-emerald-500")}></span>
                                                {u.status === 'DISABLED' ? 'Disabled' : 'Active'}
                                            </span>
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
                        <button className="size-8 rounded flex items-center justify-center text-xs font-bold bg-primary dark:bg-white text-white dark:text-primary">1</button>
                    </div>
                    <button className="px-3 py-1 text-xs font-bold text-primary/60 dark:text-white/60 hover:text-primary dark:hover:text-white transition-colors flex items-center gap-1 disabled:opacity-30">
                        Next <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            {/* Invite Drawer (Overlay) */}
            {isInviteOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" onClick={() => setIsInviteOpen(false)}></div>
                    <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                        <div className="px-6 py-4 border-b border-primary/10 dark:border-white/10 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-primary dark:text-white">Invite Team Member</h3>
                            <button onClick={() => setIsInviteOpen(false)} className="p-2 hover:bg-primary/5 dark:hover:bg-white/10 rounded-full text-primary/60 dark:text-white/60">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleInvite} className="flex flex-col flex-1 min-h-0">
                        <div className="p-8 flex-1 overflow-y-auto space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        placeholder="colleague@company.com"
                                        className="w-full px-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary font-medium text-primary dark:text-white"
                                        {...inviteForm.register('email')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider mb-2">Name (optional)</label>
                                    <input
                                        type="text"
                                        placeholder="Jane Smith"
                                        className="w-full px-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary font-medium text-primary dark:text-white"
                                        {...inviteForm.register('name')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider mb-2">Role</label>
                                    <select
                                        className="w-full px-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary font-medium text-primary dark:text-white"
                                        {...inviteForm.register('role')}
                                    >
                                        <option value="RECRUITER">Recruiter</option>
                                        <option value="HR_MANAGER">HR Manager</option>
                                        <option value="HR_HEAD">HR Head</option>
                                        <option value="HIRING_MANAGER">Hiring Manager</option>
                                        <option value="INTERVIEWER">Interviewer</option>
                                        <option value="TEAM_LEAD">Team Lead</option>
                                        <option value="ADMIN">Admin</option>
                                        <option value="CANDIDATE">Candidate</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider mb-2">Department</label>
                                    <select
                                        className="w-full px-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary font-medium text-primary dark:text-white"
                                        {...inviteForm.register('department')}
                                    >
                                        <option value="">— None —</option>
                                        {departmentNames.map((name) => (
                                            <option key={name} value={name}>
                                                {name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-xl text-sm leading-relaxed">
                                    An email with a temporary password is sent via Resend. For testing, use <code className="text-xs">onboarding@resend.dev</code> as the sender until your domain is verified.
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02]">
                            <button
                                type="submit"
                                disabled={inviteMutation.isPending}
                                className="w-full py-3 bg-primary dark:bg-white text-white dark:text-primary font-bold rounded-xl hover:opacity-90 shadow-lg shadow-primary/20 dark:shadow-none transition-all disabled:opacity-60"
                            >
                                {inviteMutation.isPending ? 'Sending…' : 'Send Invitation'}
                            </button>
                        </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default UserManagement;
