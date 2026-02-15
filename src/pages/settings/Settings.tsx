import React, { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useThemeStore } from '../../store/themeStore'
import {
    User, Shield, Bell, Users, Moon, Sun, LogOut,
    CheckCircle, History, Lock, Globe, Monitor
} from 'lucide-react'
import clsx from 'clsx'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'

const Settings = () => {
    const { user, logout } = useAuth()
    const { theme, toggleTheme } = useThemeStore()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState<'GENERAL' | 'SECURITY' | 'NOTIFICATIONS' | 'TEAM'>('GENERAL')

    const handleLogout = async () => {
        try {
            await logout()
            navigate('/login')
        } catch (error) {
            console.error('Logout failed', error)
        }
    }

    return (
        <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
            <div className="mb-8">
                <h2 className="text-3xl font-black text-primary dark:text-white tracking-tight">Organization Settings</h2>
                <p className="text-primary/60 dark:text-white/60 mt-1 font-medium">Manage your account details, security preferences, and team access.</p>
            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-primary/10 dark:border-white/10 mb-8 overflow-x-auto">
                <nav className="flex gap-8 min-w-max">
                    <button
                        onClick={() => setActiveTab('GENERAL')}
                        className={clsx(
                            "flex items-center gap-2 py-4 px-1 text-sm font-bold border-b-2 transition-all",
                            activeTab === 'GENERAL' ? "border-primary dark:border-white text-primary dark:text-white" : "border-transparent text-primary/40 dark:text-white/40 hover:text-primary dark:hover:text-white"
                        )}
                    >
                        <User size={20} /> General
                    </button>
                    <button
                        onClick={() => setActiveTab('SECURITY')}
                        className={clsx(
                            "flex items-center gap-2 py-4 px-1 text-sm font-bold border-b-2 transition-all",
                            activeTab === 'SECURITY' ? "border-primary dark:border-white text-primary dark:text-white" : "border-transparent text-primary/40 dark:text-white/40 hover:text-primary dark:hover:text-white"
                        )}
                    >
                        <Shield size={20} /> Security
                    </button>
                    <button
                        onClick={() => setActiveTab('NOTIFICATIONS')}
                        className={clsx(
                            "flex items-center gap-2 py-4 px-1 text-sm font-bold border-b-2 transition-all",
                            activeTab === 'NOTIFICATIONS' ? "border-primary dark:border-white text-primary dark:text-white" : "border-transparent text-primary/40 dark:text-white/40 hover:text-primary dark:hover:text-white"
                        )}
                    >
                        <Bell size={20} /> Notifications
                    </button>
                    <button
                        onClick={() => setActiveTab('TEAM')}
                        className={clsx(
                            "flex items-center gap-2 py-4 px-1 text-sm font-bold border-b-2 transition-all",
                            activeTab === 'TEAM' ? "border-primary dark:border-white text-primary dark:text-white" : "border-transparent text-primary/40 dark:text-white/40 hover:text-primary dark:hover:text-white"
                        )}
                    >
                        <Users size={20} /> Team & Permissions
                        <span className="bg-primary/10 dark:bg-white/10 text-primary dark:text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ml-1">Admin</span>
                    </button>
                </nav>
            </div>

            <div className="space-y-6">
                {activeTab === 'GENERAL' && (
                    <>
                        {/* Profile Card */}
                        <section className="bg-white dark:bg-white/5 rounded-2xl shadow-sm border border-primary/10 dark:border-white/10 overflow-hidden">
                            <div className="p-6 border-b border-primary/10 dark:border-white/10 flex justify-between items-center bg-primary/[0.02] dark:bg-white/[0.02]">
                                <div>
                                    <h3 className="font-bold text-primary dark:text-white">Profile Information</h3>
                                    <p className="text-xs text-primary/60 dark:text-white/60">Update your photo and personal details.</p>
                                </div>
                                <button className="bg-primary dark:bg-white text-white dark:text-primary px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">Save Changes</button>
                            </div>
                            <div className="p-8">
                                <div className="flex flex-col md:flex-row items-start gap-8">
                                    <div className="relative group mx-auto md:mx-0">
                                        <div className="size-24 rounded-full border-4 border-primary/5 dark:border-white/5 overflow-hidden">
                                            <img className="w-full h-full object-cover" src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}`} alt="User Profile" />
                                        </div>
                                    </div>
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider">Full Name</label>
                                            <input className="w-full border-primary/10 dark:border-white/10 rounded-xl bg-primary/[0.02] dark:bg-white/[0.02] focus:ring-primary focus:border-primary font-bold text-primary dark:text-white text-sm p-3" type="text" defaultValue={user?.name} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider">Role</label>
                                            <input className="w-full border-primary/10 dark:border-white/10 rounded-xl bg-primary/5 dark:bg-white/5 text-primary/40 dark:text-white/40 font-bold text-sm p-3 cursor-not-allowed" type="text" value={user?.role} disabled />
                                        </div>
                                        <div className="space-y-1.5 col-span-1 md:col-span-2">
                                            <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider">Email Address</label>
                                            <div className="relative">
                                                <input className="w-full bg-primary/5 dark:bg-white/5 border-primary/10 dark:border-white/10 rounded-xl text-sm p-3 text-primary/40 dark:text-white/40 cursor-not-allowed pl-10 font-bold" disabled type="email" value={user?.email} />
                                                <Lock className="absolute left-3 top-3 text-primary/30 dark:text-white/30" size={16} />
                                            </div>
                                            <p className="text-[11px] text-primary/40 dark:text-white/40 italic mt-1">Email address is managed by your organization's SSO.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Preferences Card */}
                        <section className="bg-white dark:bg-white/5 rounded-2xl shadow-sm border border-primary/10 dark:border-white/10 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="size-10 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 rounded-xl flex items-center justify-center">
                                    <Monitor size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-primary dark:text-white">System Preferences</h3>
                                    <p className="text-xs text-primary/60 dark:text-white/60">Appearance and accessibility</p>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Moon size={20} className="text-primary/60 dark:text-white/60" />
                                        <div>
                                            <p className="text-sm font-bold text-primary dark:text-white">Global Dark Mode</p>
                                            <p className="text-[11px] text-primary/60 dark:text-white/60">Switch between light and dark theme</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={toggleTheme}
                                        className={clsx(
                                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                                            theme === 'dark' ? 'bg-primary' : 'bg-slate-200'
                                        )}
                                    >
                                        <span className={clsx("inline-block h-4 w-4 transform rounded-full bg-white transition-transform", theme === 'dark' ? 'translate-x-6' : 'translate-x-1')} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Globe size={20} className="text-primary/60 dark:text-white/60" />
                                        <div>
                                            <p className="text-sm font-bold text-primary dark:text-white">Default Language</p>
                                            <p className="text-[11px] text-primary/60 dark:text-white/60">System-wide UI language</p>
                                        </div>
                                    </div>
                                    <select className="bg-primary/5 dark:bg-white/5 border-primary/10 dark:border-white/10 text-primary dark:text-white text-xs rounded-lg focus:ring-primary focus:border-primary p-2 font-bold cursor-pointer outline-none">
                                        <option>English (US)</option>
                                        <option>German</option>
                                        <option>Spanish</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        <div className="mt-8 pt-8 border-t border-primary/10 dark:border-white/10">
                            <div className="flex items-center justify-between p-6 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20">
                                <div>
                                    <h3 className="font-bold text-red-900 dark:text-red-200">Sign Out</h3>
                                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">Securely log out of your account.</p>
                                </div>
                                <button onClick={handleLogout} className="bg-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 flex items-center gap-2">
                                    <LogOut size={16} /> Sign Out
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'SECURITY' && (
                    <section className="bg-white dark:bg-white/5 rounded-2xl shadow-sm border border-primary/10 dark:border-white/10 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="size-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-xl flex items-center justify-center">
                                <Shield size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-primary dark:text-white">Security Status</h3>
                                <p className="text-xs text-primary/60 dark:text-white/60">Enhanced account protection</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-primary/[0.02] dark:bg-white/[0.02] rounded-xl border border-primary/5 dark:border-white/5">
                                <div className="flex items-center gap-3">
                                    <CheckCircle size={20} className="text-emerald-500" />
                                    <div>
                                        <p className="text-sm font-bold text-primary dark:text-white">Two-Factor Auth</p>
                                        <p className="text-[11px] text-primary/60 dark:text-white/60">Protect with SMS or Authenticator</p>
                                    </div>
                                </div>
                                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded uppercase">Enabled</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-primary/[0.02] dark:bg-white/[0.02] rounded-xl border border-primary/5 dark:border-white/5">
                                <div className="flex items-center gap-3">
                                    <History size={20} className="text-primary/40 dark:text-white/40" />
                                    <div>
                                        <p className="text-sm font-bold text-primary dark:text-white">Login History</p>
                                        <p className="text-[11px] text-primary/60 dark:text-white/60">Last activity: 2 hours ago</p>
                                    </div>
                                </div>
                                <button className="text-primary dark:text-white text-[11px] font-bold hover:underline">VIEW</button>
                            </div>
                            <button className="w-full mt-2 py-3 border border-primary/10 dark:border-white/10 rounded-xl text-sm font-bold text-primary dark:text-white hover:bg-primary/5 dark:hover:bg-white/5 transition-colors">
                                Change Password
                            </button>
                        </div>
                    </section>
                )}
                {activeTab === 'NOTIFICATIONS' && (
                    <div className="p-12 text-center bg-primary/[0.02] dark:bg-white/[0.02] rounded-2xl border border-dashed border-primary/10 dark:border-white/10">
                        <Bell size={48} className="mx-auto text-primary/20 dark:text-white/20 mb-4" />
                        <h3 className="text-lg font-bold text-primary dark:text-white">Notification Settings</h3>
                        <p className="text-primary/60 dark:text-white/60">Configure how you receive updates.</p>
                    </div>
                )}
                {activeTab === 'TEAM' && (
                    <div className="p-12 text-center bg-primary/[0.02] dark:bg-white/[0.02] rounded-2xl border border-dashed border-primary/10 dark:border-white/10">
                        <Users size={48} className="mx-auto text-primary/20 dark:text-white/20 mb-4" />
                        <h3 className="text-lg font-bold text-primary dark:text-white">Team Management</h3>
                        <p className="text-primary/60 dark:text-white/60 outline-none">Redirecting to admin panel...</p>
                        <Button className="mt-4" onClick={() => navigate('/admin/users')}>Go to User Management</Button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Settings
