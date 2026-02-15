import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button' // Keep Button as it's used in sub-dashboards
import { useAuth } from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import clsx from 'clsx'
// Removed Lucide icons as StatCard now uses material-symbols-outlined

const StatCard = ({ title, value, change, icon, color, isPositive }: any) => (
    <div className="bg-white dark:bg-white/5 p-6 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all">
        <div className="flex justify-between items-start mb-4">
            <span className={clsx("material-symbols-outlined p-2 rounded-lg", color)}>{icon}</span>
            {change && (
                <span className={clsx(
                    "text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1",
                    isPositive ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                )}>
                    {change}
                    <span className="material-symbols-outlined text-xs">{isPositive ? 'trending_up' : 'trending_down'}</span>
                </span>
            )}
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</p>
        <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{value}</h3>
    </div>
)

const AdminDashboard = ({ requirements, candidates, user }: any) => {
    const activeJobs = requirements?.filter((r: any) => r.status !== 'CLOSED' && r.status !== 'DRAFT').length || 0
    const totalCandidates = candidates?.length || 0

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-black text-primary dark:text-white tracking-tight">System Overview</h1>
                <p className="text-primary/60 dark:text-slate-400 text-sm">Real-time performance metrics and security oversight for the enterprise ATS platform.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Active Job Postings" value={activeJobs} change="+12.5%" icon="work" color="bg-primary/10 text-primary dark:text-blue-400" isPositive={true} />
                <StatCard title="Total Candidates" value={totalCandidates} change="+5.2%" icon="group" color="bg-primary/10 text-primary dark:text-purple-400" isPositive={true} />
                <StatCard title="Avg. Time-to-Hire" value="18 Days" change="-2 days" icon="schedule" color="bg-primary/10 text-primary dark:text-red-400" isPositive={false} />
                <StatCard title="System Health" value="Optimal" icon="speed" color="bg-primary/10 text-primary dark:text-green-400" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-white/5 rounded-xl border border-primary/10 dark:border-white/10 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-primary/5 dark:border-white/10 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-primary dark:text-white">System Performance (Last 24h)</h3>
                        <select className="text-xs font-semibold bg-primary/5 dark:bg-white/5 border-none rounded py-1 px-3 text-primary dark:text-white focus:ring-0">
                            <option>Uptime Score</option>
                            <option>Request Volume</option>
                        </select>
                    </div>
                    <div className="p-6">
                        <div className="h-[250px] w-full flex items-end gap-2 px-2 pb-2">
                            {[75, 80, 66, 83, 50, 100, 75, 80, 83, 75, 100, 80, 66, 33, 83].map((h, i) => (
                                <div key={i} className="w-full bg-primary/20 dark:bg-primary/40 rounded-t transition-all hover:bg-primary/50" style={{ height: `${h}%` }}></div>
                            ))}
                        </div>
                        <div className="flex justify-between text-[10px] text-primary/40 dark:text-slate-500 font-bold uppercase mt-4 px-2">
                            <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-white/5 rounded-xl border border-primary/10 dark:border-white/10 shadow-sm flex flex-col">
                    <div className="p-6 border-b border-primary/5 dark:border-white/10">
                        <h3 className="text-lg font-bold text-primary dark:text-white">Recent Admin Activity</h3>
                    </div>
                    <div className="p-4 flex-1 space-y-4">
                        {[
                            { name: 'Sarah Koenig', role: 'Recruiter Admin', status: 'online', initial: 'SK' },
                            { name: 'James Miller', role: 'Compliance Officer', status: 'offline', initial: 'JM' },
                            { name: 'Linda Wu', role: 'Global Admin', status: 'online', initial: 'LW' }
                        ].map((adm, i) => (
                            <div key={i} className="flex items-center gap-3 p-2 hover:bg-primary/5 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
                                <div className="size-8 rounded bg-primary/10 dark:bg-primary/20 flex items-center justify-center font-bold text-primary dark:text-primary-light text-xs">{adm.initial}</div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-sm font-semibold text-primary dark:text-white truncate">{adm.name}</p>
                                    <p className="text-xs text-primary/60 dark:text-slate-400">{adm.role}</p>
                                </div>
                                <div className={clsx("size-2 rounded-full", adm.status === 'online' ? "bg-green-500" : "bg-slate-300")} />
                            </div>
                        ))}
                    </div>
                    <div className="p-4 bg-primary/5 dark:bg-white/5">
                        <button className="w-full bg-primary dark:bg-white dark:text-primary text-white text-sm font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all">
                            <span className="material-symbols-outlined text-sm">person_add</span>
                            Invite New Team Member
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-white/5 rounded-xl border border-primary/10 dark:border-white/10 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-primary/5 dark:border-white/10 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-primary dark:text-white">Recent Security Audit Logs</h3>
                    <Link to="#" className="text-sm font-bold text-primary dark:text-blue-400 hover:underline">View Full Audit Trail</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-primary/[0.02] dark:bg-white/5 border-b border-primary/5 dark:border-white/10">
                            <tr className="text-xs font-bold text-primary/40 dark:text-slate-500 uppercase tracking-wider">
                                <th className="px-6 py-4">Administrator</th>
                                <th className="px-6 py-4">Action</th>
                                <th className="px-6 py-4">Entity</th>
                                <th className="px-6 py-4">Timestamp</th>
                                <th className="px-6 py-4 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-primary/5 dark:divide-white/10">
                            {[
                                { user: user?.name, action: 'Signed In', entity: 'Session: Web', time: 'Just now', status: 'Success' },
                                { user: 'Sarah Koenig', action: 'Updated Security Policy', entity: 'Role: Recruiter', time: '2h ago', status: 'Success' },
                                { user: 'System Auth', action: 'Failed Login Attempt', entity: 'User: j_miller', time: '5h ago', status: 'Warning' }
                            ].map((row, i) => (
                                <tr key={i} className="hover:bg-primary/[0.01] dark:hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 text-sm font-semibold text-primary dark:text-white">{row.user}</td>
                                    <td className="px-6 py-4 text-sm text-primary/60 dark:text-slate-400">{row.action}</td>
                                    <td className="px-6 py-4 text-sm text-primary/60 dark:text-slate-400 font-mono italic">{row.entity}</td>
                                    <td className="px-6 py-4 text-sm text-primary/60 dark:text-slate-400">{row.time}</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={clsx(
                                            "text-[10px] font-bold uppercase px-2 py-1 rounded-full",
                                            row.status === 'Success' ? "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400" : "bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400"
                                        )}>{row.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

const RecruiterDashboard = ({ requirements, candidates, interviews, user }: any) => {
    const activeJobs = requirements?.filter((r: any) => r.status !== 'CLOSED' && r.status !== 'DRAFT').length || 0
    const totalCandidates = candidates?.length || 0
    const interviewsToday = interviews?.filter((i: any) => i.status === 'SCHEDULED').length || 0

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Welcome back, {user?.name?.split(' ')[0]}</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Here's your hiring pipeline overview for today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Assigned Requirements" value={activeJobs} change="+2 this week" icon="assignment" color="bg-primary/10 text-primary" isPositive={true} />
                <StatCard title="Active Candidates" value={totalCandidates} change="+8% growth" icon="plumbing" color="bg-blue-500/10 text-blue-500" isPositive={true} />
                <StatCard title="Interviews Today" value={interviewsToday} change="Next in 30m" icon="video_chat" color="bg-purple-500/10 text-purple-500" isPositive={true} />
                <StatCard title="Avg. Time-to-Hire" value="18 days" change="-2 days vs avg" icon="timer" color="bg-emerald-500/10 text-emerald-500" isPositive={false} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
                            <h3 className="text-lg font-bold">SLA & Urgency Tracking</h3>
                            <Link to="/requirements" className="text-sm text-primary font-semibold hover:underline">View All</Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-white/5">
                                    <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        <th className="px-6 py-3">Role</th>
                                        <th className="px-6 py-3">Priority</th>
                                        <th className="px-6 py-3">SLA Status</th>
                                        <th className="px-6 py-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-white/10 text-sm">
                                    {requirements?.slice(0, 3).map((req: any, i: number) => (
                                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-semibold">{req.role}</p>
                                                <p className="text-xs text-slate-500 italic">{req.department} • {req.location}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={clsx(
                                                    "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tight",
                                                    req.priority === 'CRITICAL' ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"
                                                )}>{req.priority || 'NORMAL'}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={clsx("size-2 rounded-full", req.status === 'OPEN' ? 'bg-green-500' : 'bg-primary')}></span>
                                                    <span className="text-xs font-medium">{req.status === 'OPEN' ? 'On Track' : '3 days rem'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Link to={`/requirements/${req.id}`} className="text-primary hover:text-primary/70 transition-colors">
                                                    <span className="material-symbols-outlined">chevron_right</span>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-white/5 p-6 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                        <h3 className="text-lg font-bold mb-6">Candidate Pipeline Summary</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Sourced', count: 15, pct: 31, color: 'bg-slate-400', border: 'border-slate-300' },
                                { label: 'Screening', count: 10, pct: 21, color: 'bg-primary', border: 'border-primary' },
                                { label: 'Shortlisted', count: 8, pct: 16, color: 'bg-blue-500', border: 'border-blue-500' },
                                { label: 'Offer', count: 2, pct: 4, color: 'bg-green-500', border: 'border-green-500' }
                            ].map((stat, i) => (
                                <div key={i} className={clsx("bg-slate-50 dark:bg-white/5 p-4 rounded-xl border-l-4 shadow-sm", stat.border)}>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                                    <div className="flex items-end justify-between mt-1">
                                        <span className="text-2xl font-black">{stat.count}</span>
                                        <span className="text-[9px] text-slate-500 font-bold uppercase">{stat.pct}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-white/10 h-1 mt-3 rounded-full overflow-hidden">
                                        <div className={clsx("h-full transition-all duration-1000", stat.color)} style={{ width: `${stat.pct}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-white dark:bg-white/5 p-6 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                        <h3 className="text-lg font-bold mb-6">Today's Agenda</h3>
                        <div className="space-y-4">
                            {interviews?.slice(0, 3).map((interview: any, i: number) => (
                                <div key={i} className="flex gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all group border border-transparent hover:border-primary/20">
                                    <div className="flex flex-col items-center justify-center bg-slate-100 dark:bg-white/10 rounded-lg min-w-[50px] h-[50px] shadow-sm">
                                        <span className="text-xs font-bold text-primary">09:30</span>
                                        <span className="text-[9px] font-black text-slate-500 uppercase">AM</span>
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-sm font-bold truncate">{candidates?.find((c: any) => c.id === interview.candidateId)?.name || 'Candidate'}</p>
                                        <p className="text-[10px] text-slate-500 truncate">{interview.type} • Round 1</p>
                                        <div className="flex gap-2 mt-2">
                                            <button className="text-[10px] font-bold text-white bg-primary px-3 py-1 rounded-lg hover:opacity-90 transition-opacity">Join</button>
                                            <button className="text-[10px] font-bold text-slate-500 bg-slate-200 dark:bg-white/10 px-3 py-1 rounded-lg hover:bg-slate-300 transition-colors">Profile</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-6 py-3 border border-dashed border-slate-300 dark:border-white/20 rounded-xl text-[10px] font-bold text-slate-500 hover:border-primary hover:text-primary transition-all uppercase tracking-widest">
                            View Full Calendar
                        </button>
                    </div>

                    <div className="bg-white dark:bg-white/5 p-6 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                        <h3 className="text-lg font-bold mb-6">Recent Activity</h3>
                        <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-slate-200 dark:before:bg-white/10">
                            {candidates?.slice(0, 4).map((c: any, i: number) => (
                                <div key={i} className="relative pl-6">
                                    <span className="absolute left-0 top-1 size-4 rounded-full bg-primary border-4 border-white dark:border-background-dark shadow-sm"></span>
                                    <p className="text-xs leading-relaxed">
                                        <span className="font-bold">{c.name}</span> was moved to <span className="text-primary font-bold">{c.status}</span>
                                    </p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight mt-1">{i + 1}h ago</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const Dashboard = () => {
    const { user } = useAuth()
    const role = user?.role || 'RECRUITER'
    const isAdminOrHR = ['ADMIN', 'HR_MANAGER'].includes(role)

    const { data: requirements } = useQuery({ queryKey: ['requirements'], queryFn: api.requirements.list })
    const { data: candidates } = useQuery({ queryKey: ['candidates'], queryFn: api.candidates.list })
    const { data: interviews } = useQuery({ queryKey: ['interviews'], queryFn: api.interviews.list })
    const { data: offers } = useQuery({ queryKey: ['offers'], queryFn: api.offers.list })

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {isAdminOrHR ? (
                <AdminDashboard
                    requirements={requirements}
                    candidates={candidates}
                    interviews={interviews}
                    offers={offers}
                    user={user}
                />
            ) : (
                <RecruiterDashboard
                    requirements={requirements}
                    candidates={candidates}
                    interviews={interviews}
                    user={user}
                />
            )}
        </div>
    )
}

export default Dashboard
