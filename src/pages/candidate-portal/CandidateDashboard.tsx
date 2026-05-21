import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../services/api'
import { Mail, Briefcase, Calendar, FileText, MapPin, AlertCircle } from 'lucide-react'
import { EmptyState } from '../../components/ui/EmptyState'
import clsx from 'clsx'

const CandidateDashboard = () => {
    const { user } = useAuth()

    const { data, isLoading } = useQuery({
        queryKey: ['portal-me'],
        queryFn: api.portal.getMe,
    })

    const { data: openPositions = [] } = useQuery({
        queryKey: ['portal-positions'],
        queryFn: api.portal.getOpenPositions,
    })

    if (isLoading) {
        return <div className="p-12 text-center text-slate-500">Loading your portal...</div>
    }

    if (!data?.linked) {
        return (
            <div className="max-w-3xl mx-auto p-8 space-y-8">
                <section className="bg-white dark:bg-white/5 rounded-2xl border border-primary/10 dark:border-white/10 p-6">
                    <h2 className="font-bold text-lg text-primary dark:text-white mb-4 flex items-center gap-2">
                        <Briefcase size={20} /> Open positions
                    </h2>
                    {openPositions.length === 0 ? (
                        <EmptyState
                            icon="work"
                            title="No open roles"
                            description="Check back later for new opportunities."
                        />
                    ) : (
                        <ul className="space-y-3">
                            {openPositions.map((job) => (
                                <li key={job.id}>
                                    <Link
                                        to={`/portal/jobs/${job.id}`}
                                        className="block p-4 rounded-xl border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:border-primary/30 hover:bg-primary/[0.03] transition-colors"
                                    >
                                        <p className="text-[10px] font-bold uppercase text-primary/50">{job.jobCode}</p>
                                        <p className="font-bold text-primary dark:text-white mt-0.5">{job.title}</p>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {job.client ? `${job.client} · ` : ''}
                                            {job.department}
                                            {job.location ? ` · ${job.location}` : ''}
                                        </p>
                                        {job.description && (
                                            <p className="text-xs text-slate-500 mt-2 line-clamp-2">{job.description}</p>
                                        )}
                                        <span className="inline-block mt-2 text-xs font-bold text-primary">View details & apply →</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
                <EmptyState
                    icon="person"
                    title="No application linked"
                    description={data?.message || 'Your recruiter has not linked an application to this account yet.'}
                />
                <p className="text-center text-sm text-slate-500">Signed in as {user?.email}</p>
            </div>
        )
    }

    const { candidate, requirement, requirementHidden, requirementMessage, interviews, offers } = data

    return (
        <div className="max-w-[1440px] mx-auto w-full p-4 md:p-8 space-y-8">
            <div className="bg-white dark:bg-white/5 rounded-2xl border border-primary/10 dark:border-white/10 p-6 shadow-sm">
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                    <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-2xl">
                        {candidate.name.charAt(0)}
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-primary dark:text-white">{candidate.name}</h1>
                        <p className="text-primary/70 font-medium mt-1">{candidate.role}</p>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-primary/60">
                            <span className="flex items-center gap-1">
                                <Mail size={14} /> {candidate.email}
                            </span>
                            {requirement && (
                                <span className="flex items-center gap-1">
                                    <Briefcase size={14} /> {requirement.title}
                                </span>
                            )}
                        </div>
                        {requirementHidden && requirementMessage && (
                            <p className="flex items-start gap-2 mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 max-w-lg">
                                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                {requirementMessage}
                            </p>
                        )}
                        <span
                            className={clsx(
                                'inline-block mt-3 px-3 py-1 rounded-full text-xs font-bold uppercase',
                                candidate.status === 'HIRED'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : candidate.status === 'REJECTED'
                                      ? 'bg-rose-100 text-rose-700'
                                      : 'bg-blue-100 text-blue-700'
                            )}
                        >
                            {candidate.status}
                        </span>
                    </div>
                </div>
            </div>

            {requirement && (
                <section className="bg-white dark:bg-white/5 rounded-2xl border border-primary/10 p-6">
                    <h2 className="font-bold text-lg mb-3 text-primary dark:text-white">Your application</h2>
                    {requirement.jobCode && (
                        <p className="text-xs font-bold uppercase text-primary/50">Req ID: {requirement.jobCode}</p>
                    )}
                    <p className="font-bold">{requirement.title}</p>
                    <p className="text-sm text-slate-500 mt-1">
                        {requirement.client ? `${requirement.client} · ` : ''}
                        {requirement.department}
                        {requirement.location ? ` · ${requirement.location}` : ''}
                    </p>
                    {requirement.description && (
                        <p className="text-sm text-slate-600 mt-4 whitespace-pre-wrap">{requirement.description}</p>
                    )}
                </section>
            )}

            <section className="bg-white dark:bg-white/5 rounded-2xl border border-primary/10 p-6">
                <h2 className="font-bold text-lg text-primary dark:text-white mb-4 flex items-center gap-2">
                    <Briefcase size={20} /> Open positions
                </h2>
                {openPositions.length === 0 ? (
                    <EmptyState
                        icon="work"
                        title="No open roles"
                        description="There are no positions listed on the portal right now."
                    />
                ) : (
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {openPositions.map((job) => (
                            <li key={job.id}>
                                <Link
                                    to={`/portal/jobs/${job.id}`}
                                    className={clsx(
                                        'block p-4 rounded-xl border transition-colors',
                                        requirement?.id === job.id
                                            ? 'border-primary bg-primary/5'
                                            : 'border-slate-100 bg-slate-50 dark:bg-white/5 hover:border-primary/30'
                                    )}
                                >
                                    <p className="text-[10px] font-bold uppercase text-primary/50">{job.jobCode}</p>
                                    <p className="font-bold text-primary dark:text-white mt-0.5">{job.title}</p>
                                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                        <MapPin size={14} />
                                        {job.client ? `${job.client} · ` : ''}
                                        {job.department}
                                        {job.location ? ` · ${job.location}` : ''}
                                    </p>
                                    {requirement?.id === job.id ? (
                                        <span className="inline-block mt-2 text-[10px] font-bold uppercase text-primary">
                                            Your current application
                                        </span>
                                    ) : (
                                        <span className="inline-block mt-2 text-xs font-bold text-primary">View & apply →</span>
                                    )}
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className="bg-white dark:bg-white/5 rounded-2xl border border-primary/10 p-6">
                    <h2 className="font-bold text-lg flex items-center gap-2 mb-4">
                        <Calendar size={20} className="text-primary" />
                        Interviews ({interviews.length})
                    </h2>
                    {interviews.length === 0 ? (
                        <EmptyState icon="event" title="No interviews" description="Scheduled interviews will appear here." />
                    ) : (
                        <ul className="space-y-3">
                            {interviews.map((iv) => (
                                <li key={iv.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 text-sm">
                                    <p className="font-bold">{iv.type}</p>
                                    <p className="text-slate-500">{new Date(iv.scheduledAt).toLocaleString()}</p>
                                    <p className="text-xs text-slate-400 mt-1">{iv.status}</p>
                                    {iv.meetingLink && (
                                        <a href={iv.meetingLink} target="_blank" rel="noreferrer" className="text-primary font-bold text-xs mt-2 inline-block">
                                            Join meeting
                                        </a>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="bg-white dark:bg-white/5 rounded-2xl border border-primary/10 p-6">
                    <h2 className="font-bold text-lg flex items-center gap-2 mb-4">
                        <FileText size={20} className="text-primary" />
                        Offers ({offers.length})
                    </h2>
                    {offers.length === 0 ? (
                        <EmptyState icon="work" title="No offers" description="Offers will appear when extended." />
                    ) : (
                        <ul className="space-y-3">
                            {offers.map((o) => (
                                <li key={o.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 text-sm">
                                    <p className="font-bold">Base salary: {o.baseSalary.toLocaleString()}</p>
                                    <p className="text-xs text-slate-500 mt-1">Status: {o.status}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    )
}

export default CandidateDashboard
