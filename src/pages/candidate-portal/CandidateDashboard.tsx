import React, { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import {
    MapPin, Mail, Calendar, Share2, Edit, Briefcase,
    GraduationCap, Clock, CheckCircle, Sparkles, MessageSquare,
    Download, UserX
} from 'lucide-react'
import clsx from 'clsx'

const CandidateDashboard = () => {
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState<'PARSED' | 'RESUME' | 'TIMELINE' | 'SKILLS'>('PARSED')

    // Mock data based on template
    const experience = [
        {
            role: 'Senior Software Engineer',
            company: 'TechFlow Systems',
            period: '2020 — Present',
            description: 'Led the development of a microservices-based financial platform, improving scalability by 40%. Mentored junior engineers and implemented CI/CD best practices.',
            skills: ['React', 'Go', 'AWS'],
            current: true
        },
        {
            role: 'Software Engineer',
            company: 'InnovateAI',
            period: '2017 — 2020',
            description: 'Developed and maintained complex web applications using Python and Django. Integrated third-party APIs and optimized database queries.',
            skills: ['Python', 'PostgreSQL', 'Docker'],
            current: false
        }
    ]

    return (
        <div className="max-w-[1440px] mx-auto w-full p-4 md:p-8 animate-in fade-in duration-500">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm text-primary/60 dark:text-white/60 mb-6 font-medium">
                <span className="hover:text-primary dark:hover:text-white cursor-pointer">Candidates</span>
                <span>/</span>
                <span className="text-primary dark:text-white font-bold">{user?.name}</span>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Main Content Area */}
                <div className="flex-1 flex flex-col gap-6">
                    {/* Profile Header Card */}
                    <div className="bg-white dark:bg-white/5 rounded-2xl border border-primary/10 dark:border-white/10 p-6 shadow-sm">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="flex gap-5 items-center">
                                <div className="size-24 rounded-full border-4 border-white dark:border-white/10 shadow-sm overflow-hidden bg-primary/5 dark:bg-white/5">
                                    <img
                                        src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}`}
                                        alt={user?.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-2xl font-black text-primary dark:text-white tracking-tight">{user?.name}</h1>
                                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">Active</span>
                                    </div>
                                    <p className="text-primary/70 dark:text-white/70 font-bold mt-0.5">Senior Software Engineer</p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-primary/60 dark:text-white/60 font-medium">
                                        <div className="flex items-center gap-1">
                                            <MapPin size={14} /> San Francisco, CA
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Mail size={14} /> {user?.email}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar size={14} /> Applied 2 days ago
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 w-full md:w-auto">
                                <button className="flex-1 md:flex-none h-10 px-4 rounded-xl border border-primary/10 dark:border-white/10 bg-white dark:bg-white/5 text-primary dark:text-white text-sm font-bold hover:bg-primary/5 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                                    <Share2 size={16} /> Share
                                </button>
                                <button className="flex-1 md:flex-none h-10 px-4 rounded-xl bg-primary dark:bg-white text-white dark:text-primary text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-primary/20 dark:shadow-none">
                                    <Edit size={16} /> Edit Profile
                                </button>
                            </div>
                        </div>

                        {/* Stats Strip */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-primary/10 dark:border-white/10">
                            <div className="p-4 bg-primary/[0.02] dark:bg-white/[0.02] rounded-xl border border-primary/5 dark:border-white/5">
                                <p className="text-xs font-bold text-primary/50 dark:text-white/50 uppercase tracking-wider">Experience</p>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <p className="text-2xl font-black text-primary dark:text-white">8 Years</p>
                                    <p className="text-emerald-600 dark:text-emerald-400 text-sm font-bold">+2 over req.</p>
                                </div>
                            </div>
                            <div className="p-4 bg-primary/[0.02] dark:bg-white/[0.02] rounded-xl border border-primary/5 dark:border-white/5">
                                <p className="text-xs font-bold text-primary/50 dark:text-white/50 uppercase tracking-wider">Education</p>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <p className="text-2xl font-black text-primary dark:text-white">Masters</p>
                                    <p className="text-primary/60 dark:text-white/60 text-sm font-bold">Comp Sci</p>
                                </div>
                            </div>
                            <div className="p-4 bg-primary/[0.02] dark:bg-white/[0.02] rounded-xl border border-primary/5 dark:border-white/5">
                                <p className="text-xs font-bold text-primary/50 dark:text-white/50 uppercase tracking-wider">Notice Period</p>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <p className="text-2xl font-black text-primary dark:text-white">Immediate</p>
                                    <p className="text-primary/60 dark:text-white/60 text-sm font-bold">Available now</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs Section */}
                    <div className="bg-white dark:bg-white/5 rounded-2xl border border-primary/10 dark:border-white/10 overflow-hidden shadow-sm flex-1">
                        <div className="border-b border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] px-6">
                            <div className="flex gap-8 overflow-x-auto no-scrollbar">
                                {['PARSED', 'RESUME', 'TIMELINE', 'SKILLS'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab as any)}
                                        className={clsx(
                                            "py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-all",
                                            activeTab === tab
                                                ? "border-primary dark:border-white text-primary dark:text-white"
                                                : "border-transparent text-primary/40 dark:text-white/40 hover:text-primary dark:hover:text-white"
                                        )}
                                    >
                                        {tab === 'PARSED' && 'Parsed Data'}
                                        {tab === 'RESUME' && 'Original Resume'}
                                        {tab === 'TIMELINE' && 'Activity Timeline'}
                                        {tab === 'SKILLS' && 'Skills'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="p-6">
                            {activeTab === 'PARSED' && (
                                <div className="space-y-8">
                                    <section>
                                        <div className="flex items-center gap-2 mb-4">
                                            <Briefcase className="text-primary dark:text-white" size={20} />
                                            <h3 className="text-lg font-bold text-primary dark:text-white">Work Experience</h3>
                                        </div>
                                        <div className="space-y-6 relative ml-2">
                                            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-primary/10 dark:bg-white/10"></div>
                                            {experience.map((job, i) => (
                                                <div key={i} className="relative pl-10">
                                                    <div className={clsx(
                                                        "absolute left-0 top-1.5 size-6 rounded-full border-4 border-white dark:border-slate-900 shadow-sm z-10",
                                                        job.current ? "bg-primary dark:bg-white" : "bg-primary/20 dark:bg-white/20"
                                                    )}></div>
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h4 className="font-bold text-primary dark:text-white">{job.role} <span className="text-primary/60 dark:text-white/60">@ {job.company}</span></h4>
                                                        <span className="text-sm font-bold text-primary/40 dark:text-white/40">{job.period}</span>
                                                    </div>
                                                    <p className="text-primary/70 dark:text-white/70 text-sm leading-relaxed mb-3 font-medium">{job.description}</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {job.skills.map(skill => (
                                                            <span key={skill} className="px-2 py-1 bg-primary/5 dark:bg-white/5 rounded-lg text-xs font-bold text-primary/70 dark:text-white/70 border border-primary/5 dark:border-white/5">{skill}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    <section>
                                        <div className="flex items-center gap-2 mb-4">
                                            <GraduationCap className="text-primary dark:text-white" size={20} />
                                            <h3 className="text-lg font-bold text-primary dark:text-white">Education</h3>
                                        </div>
                                        <div className="bg-primary/[0.02] dark:bg-white/[0.02] rounded-xl p-4 border border-primary/5 dark:border-white/5">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-bold text-primary dark:text-white">M.S. in Computer Science</h4>
                                                    <p className="text-primary/60 dark:text-white/60 text-sm font-medium">Stanford University</p>
                                                </div>
                                                <span className="text-sm font-bold text-primary/40 dark:text-white/40">Graduated 2017</span>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            )}
                            {activeTab !== 'PARSED' && (
                                <div className="text-center py-12 text-primary/40 dark:text-white/40 font-bold">
                                    Content for {activeTab} coming soon.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar (AI Assist) */}
                <aside className="w-full lg:w-[380px] flex flex-col gap-6">
                    {/* AI Insight Card */}
                    <div className="bg-primary dark:bg-white text-white dark:text-primary rounded-2xl p-6 shadow-xl shadow-primary/20 dark:shadow-none relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Sparkles size={120} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles className="text-emerald-400 dark:text-emerald-600" size={20} />
                                <h3 className="text-lg font-black">AI Match Insight</h3>
                            </div>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="relative size-20 flex items-center justify-center border-4 border-white/20 dark:border-primary/20 rounded-full">
                                    <span className="text-2xl font-black">92%</span>
                                </div>
                                <div>
                                    <p className="text-emerald-400 dark:text-emerald-600 font-bold text-lg">Strong Match</p>
                                    <p className="text-white/70 dark:text-primary/70 text-sm font-medium">Fits top 5% of applicants</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-white/60 dark:text-primary/60 text-xs font-bold uppercase tracking-widest mb-2">Why they match</p>
                                    <ul className="space-y-2 text-sm font-medium">
                                        <li className="flex gap-2">
                                            <CheckCircle className="text-emerald-400 dark:text-emerald-600 shrink-0" size={16} />
                                            Exceeds core tech stack requirements (React/Go)
                                        </li>
                                        <li className="flex gap-2">
                                            <CheckCircle className="text-emerald-400 dark:text-emerald-600 shrink-0" size={16} />
                                            Proven leadership in high-scale environments
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Validated Skills */}
                    <div className="bg-white dark:bg-white/5 border border-primary/10 dark:border-white/10 rounded-2xl p-6 shadow-sm">
                        <h3 className="font-bold text-primary dark:text-white mb-4 flex items-center gap-2">
                            <CheckCircle size={18} className="text-primary/60 dark:text-white/60" /> Validated Skills
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {['React', 'TypeScript', 'Node.js', 'AWS', 'GraphQL', 'System Design'].map(skill => (
                                <span key={skill} className="px-3 py-1.5 bg-primary/[0.03] dark:bg-white/[0.05] text-primary dark:text-white text-xs font-bold rounded-lg border border-primary/5 dark:border-white/5">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white dark:bg-white/5 border border-primary/10 dark:border-white/10 rounded-2xl p-6 shadow-sm sticky top-[88px]">
                        <h3 className="font-bold text-primary dark:text-white mb-4">Manage Profile</h3>
                        <div className="flex flex-col gap-3">
                            <button className="w-full h-11 bg-primary dark:bg-white text-white dark:text-primary rounded-xl font-bold text-sm hover:opacity-95 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-primary/20 dark:shadow-none">
                                <Clock size={18} /> Update Availability
                            </button>
                            <button className="w-full h-11 bg-primary/5 dark:bg-white/5 text-primary dark:text-white rounded-xl font-bold text-sm hover:bg-primary/10 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                                <MessageSquare size={18} /> Contact Recruiter
                            </button>
                            <button className="w-full h-11 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl font-bold text-sm hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex items-center justify-center gap-2">
                                <UserX size={18} /> Delete Account
                            </button>
                        </div>
                        <div className="mt-4 pt-4 border-t border-primary/10 dark:border-white/10">
                            <button className="w-full text-center text-primary/40 dark:text-white/40 text-xs font-bold hover:text-primary dark:hover:text-white transition-colors flex items-center justify-center gap-1">
                                <Download size={14} /> Download Profile (PDF)
                            </button>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    )
}

export default CandidateDashboard
