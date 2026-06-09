import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { Briefcase, Users, ArrowRight } from 'lucide-react'
import clsx from 'clsx'
import './dashboard.css'

const VendorDashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['vendor-portal-me'],
    queryFn: api.vendorPortal.getMe,
  })

  if (isLoading) {
    return <div className="p-12 text-center text-slate-500">Loading vendor portal...</div>
  }

  if (!data) {
    return (
      <div className="max-w-lg mx-auto p-12 text-center">
        <p className="text-slate-600">Unable to load vendor account. Contact your HR administrator.</p>
      </div>
    )
  }

  const { vendor, stats, recentSubmissions } = data

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Welcome, {data.user.name}
        </h1>
        <p className="text-slate-500 mt-1 font-medium">
          {vendor.name}
          {vendor.code ? ` · ${vendor.code}` : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-3 text-emerald-600 mb-2">
            <Briefcase size={22} />
            <span className="text-xs font-bold uppercase tracking-wider">Assigned jobs</span>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.assignedJobs}</p>
          <Link
            to="/vendor-portal/positions"
            className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-emerald-700 hover:underline"
          >
            View jobs <ArrowRight size={14} />
          </Link>
        </div>
        <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-3 text-primary mb-2">
            <Users size={22} />
            <span className="text-xs font-bold uppercase tracking-wider">Submissions</span>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.totalSubmissions}</p>
          <Link
            to="/vendor-portal/submissions"
            className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-primary hover:underline"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">By status</p>
          {stats.statusBreakdown.length === 0 ? (
            <p className="text-sm text-slate-400">No submissions yet</p>
          ) : (
            <ul className="space-y-1">
              {stats.statusBreakdown.map((s) => (
                <li key={s.status} className="flex justify-between text-sm font-medium">
                  <span className="text-slate-600">{s.status}</span>
                  <span className="font-bold">{s.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <section className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-6">
        <h2 className="font-bold text-lg text-slate-900 dark:text-white mb-4">Recent submissions</h2>
        {recentSubmissions.length === 0 ? (
          <p className="text-sm text-slate-500">
            No candidates submitted yet.{' '}
            <Link to="/vendor-portal/positions" className="font-bold text-emerald-700 hover:underline">
              Browse assigned jobs
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-white/10">
            {recentSubmissions.map((s) => (
              <li key={s.id} className="py-3 flex justify-between items-center gap-4">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{s.name}</p>
                  <p className="text-xs text-slate-500">
                    {s.jobTitle ?? '—'}
                    {s.jobCode ? ` · ${s.jobCode}` : ''}
                  </p>
                </div>
                <span
                  className={clsx(
                    'px-2 py-1 rounded-md text-[10px] font-bold uppercase border',
                    'bg-slate-100 text-slate-700 border-slate-200'
                  )}
                >
                  {s.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default VendorDashboard
