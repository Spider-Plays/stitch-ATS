import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Calendar, Clock, Video, MapPin, User, CheckCircle, XCircle, MoreVertical, Plus, Star, ExternalLink } from 'lucide-react'
import { api } from '../../services/api'
import clsx from 'clsx'

const Interviews = () => {
    const { data: interviews = [], isLoading } = useQuery({
        queryKey: ['interviews'],
        queryFn: api.interviews.list
    })

    const upcomingInterviews = interviews.filter(i => new Date(i.scheduledAt) > new Date())
    const pastInterviews = interviews.filter(i => new Date(i.scheduledAt) <= new Date())

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-primary dark:text-white tracking-tight">Interviews</h1>
                    <p className="text-primary/60 dark:text-white/60 font-medium mt-1">Manage your interview schedule and feedback.</p>
                </div>
                <Link to="/interviews/new">
                    <button className="flex items-center gap-2 px-6 py-3 bg-primary dark:bg-white text-white dark:text-primary rounded-xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 dark:shadow-none">
                        <Plus size={18} />
                        <span>Schedule Interview</span>
                    </button>
                </Link>
            </div>

            {/* Upcoming Interviews */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-primary/10 dark:bg-white/10 rounded-lg text-primary dark:text-white">
                        <Calendar size={20} />
                    </div>
                    <h2 className="text-xl font-bold text-primary dark:text-white">Upcoming Schedule</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {upcomingInterviews.length > 0 ? upcomingInterviews.map(interview => (
                        <div key={interview.id} className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-primary/10 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-xl bg-primary/10 dark:bg-white/10 flex items-center justify-center font-bold text-primary dark:text-white">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-primary dark:text-white leading-tight">Candidate Name</h3>
                                        <p className="text-xs font-medium text-primary/60 dark:text-white/60">Role Name</p>
                                    </div>
                                </div>
                                <span className={clsx(
                                    "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
                                    interview.type === 'TECHNICAL' ? "bg-blue-100 text-blue-700 border-blue-200" :
                                        interview.type === 'CULTURAL' ? "bg-purple-100 text-purple-700 border-purple-200" :
                                            "bg-slate-100 text-slate-700 border-slate-200"
                                )}>{interview.type}</span>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-2 text-sm text-primary/70 dark:text-white/70">
                                    <Clock size={16} className="text-primary/40 dark:text-white/40" />
                                    <span className="font-medium">{new Date(interview.scheduledAt).toLocaleString()} ({interview.duration}m)</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-primary/70 dark:text-white/70">
                                    {interview.meetingLink ? <Video size={16} className="text-primary/40 dark:text-white/40" /> : <MapPin size={16} className="text-primary/40 dark:text-white/40" />}
                                    <span className="font-medium truncate">{interview.meetingLink ? 'Video Call' : interview.location || 'TBD'}</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {interview.meetingLink && (
                                    <a href={interview.meetingLink} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary dark:bg-white text-white dark:text-primary rounded-xl font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all">
                                        <ExternalLink size={14} /> Join
                                    </a>
                                )}
                                <Link to={`/candidates/${interview.candidateId}`} className="px-3 py-2.5 bg-primary/5 dark:bg-white/5 text-primary dark:text-white rounded-xl hover:bg-primary/10 dark:hover:bg-white/10 transition-all">
                                    <User size={18} />
                                </Link>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full p-12 text-center bg-primary/[0.02] dark:bg-white/[0.02] rounded-2xl border border-dashed border-primary/10 dark:border-white/10">
                            <p className="text-primary/40 dark:text-white/40 font-medium">No upcoming interviews scheduled.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Past Interviews */}
            <section>
                <div className="flex items-center gap-2 mb-4 mt-8">
                    <div className="p-2 bg-primary/10 dark:bg-white/10 rounded-lg text-primary dark:text-white">
                        <CheckCircle size={20} />
                    </div>
                    <h2 className="text-xl font-bold text-primary dark:text-white">Past Interviews</h2>
                </div>

                <div className="bg-white dark:bg-white/5 rounded-2xl border border-primary/10 dark:border-white/10 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-primary/[0.02] dark:bg-white/[0.02] border-b border-primary/10 dark:border-white/10">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-primary/50 dark:text-white/50 uppercase tracking-wider">Candidate</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-primary/50 dark:text-white/50 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-primary/50 dark:text-white/50 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-primary/50 dark:text-white/50 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-primary/50 dark:text-white/50 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-primary/5 dark:divide-white/5">
                            {pastInterviews.map(interview => (
                                <tr key={interview.id} className="hover:bg-primary/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-primary dark:text-white text-sm">Candidate Name</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-medium text-primary/70 dark:text-white/70">{interview.type}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-medium text-primary/70 dark:text-white/70">{new Date(interview.scheduledAt).toLocaleDateString()}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded-md bg-green-100 text-green-700 border border-green-200 text-[10px] font-bold uppercase tracking-wider">Completed</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link to={`/interviews/${interview.id}/feedback`}>
                                            <button className="text-xs font-bold text-primary hover:underline dark:text-white">Submit Feedback</button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {pastInterviews.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-primary/40 dark:text-white/40 text-sm">
                                        No past interviews found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    )
}

export default Interviews
