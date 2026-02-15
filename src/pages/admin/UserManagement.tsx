import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { User, UserRole } from '../../types';
import {
    Users, Search, Filter, MoreVertical, Shield,
    Mail, Calendar, CheckCircle, XCircle, Trash2, Edit,
    Download, UserPlus, Briefcase, Lock, Monitor, Clock, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import clsx from 'clsx';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const UserManagement = () => {
    const { user: currentUser } = useAuth();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DISABLED'>('ALL');
    const [isInviteOpen, setIsInviteOpen] = useState(false);

    // Fetch Users
    const { data: users = [], isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: api.users.list
    });

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

    const handleRoleChange = (uid: string, newRole: string) => {
        if (uid === currentUser?.uid) {
            alert("You cannot change your own role.");
            return;
        }
        updateRoleMutation.mutate({ uid, role: newRole as UserRole });
    };

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

    // Invite User Form (Mock)
    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        alert("Invite sent! (Mock functionality - requires backend/cloud functions)");
        setIsInviteOpen(false);
    }

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
                <div className="flex gap-3">
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

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 shrink-0">
                <StatCard title="Total Users" value={users.length} icon={Users} colorClass="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" />
                <StatCard title="Admins" value={users.filter(u => u.role === 'ADMIN').length} icon={Shield} colorClass="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" />
                <StatCard title="Active Now" value={Math.floor(users.length * 0.8)} icon={Monitor} colorClass="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" />
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
                    <option value="hr_manager">HR Manager</option>
                    <option value="RECRUITER">Recruiter</option>
                    <option value="HIRING_MANAGER">Hiring Manager</option>
                    <option value="INTERVIEWER">Interviewer</option>
                    <option value="CANDIDATE">Candidate</option>
                </select>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-white/5 rounded-2xl border border-primary/10 dark:border-white/10 overflow-hidden shadow-sm flex-1 flex flex-col">
                <div className="overflow-auto flex-1">
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
                                                <div>
                                                    <p className="font-bold text-primary dark:text-white text-sm">{u.name}</p>
                                                    <p className="text-xs text-primary/60 dark:text-white/60 font-medium">{u.email}</p>
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
                                            <span className="text-sm font-medium text-primary/70 dark:text-white/70">{u.department || '-'}</span>
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
                                            <button className="text-primary/40 hover:text-primary dark:text-white/40 dark:hover:text-white transition-colors p-1 rounded hover:bg-primary/5 dark:hover:bg-white/10">
                                                <MoreVertical size={18} />
                                            </button>
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
                        <div className="p-8 flex-1 overflow-y-auto space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider mb-2">Email Address</label>
                                    <input type="email" placeholder="colleague@company.com" className="w-full px-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary font-medium" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider mb-2">Role</label>
                                    <select className="w-full px-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary font-medium">
                                        <option value="RECRUITER">Recruiter</option>
                                        <option value="HIRING_MANAGER">Hiring Manager</option>
                                        <option value="INTERVIEWER">Interviewer</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                </div>
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-xl text-sm leading-relaxed">
                                    <p className="font-bold mb-1">Note:</p>
                                    This feature requires cloud functions to send emails. For now, users must sign up manually, and then you can update their role here.
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02]">
                            <button onClick={handleInvite} className="w-full py-3 bg-primary dark:bg-white text-white dark:text-primary font-bold rounded-xl hover:opacity-90 shadow-lg shadow-primary/20 dark:shadow-none transition-all">
                                Send Invitation
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
