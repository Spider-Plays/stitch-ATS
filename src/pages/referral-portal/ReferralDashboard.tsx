import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import {
  Briefcase,
  Users,
  Trophy,
  TrendingUp,
  Copy,
  Check,
  ArrowRight,
  Gift,
} from 'lucide-react'
import clsx from 'clsx'

const ReferralDashboard = () => {
  const [copied, setCopied] = useState(false)
  const { data, isLoading } = useQuery({
    queryKey: ['referral-portal-me'],
    queryFn: api.referralPortal.getMe,
  })

  const copyCode = async () => {
    if (!data?.referralCode) return
    await navigator.clipboard.writeText(data.referralCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return <div className="p-12 text-center text-slate-500">Loading referral portal…</div>
  }

  if (!data) {
    return (
      <div className="max-w-lg mx-auto p-12 text-center">
        <p className="text-slate-600">Unable to load your referral account. Contact HR.</p>
      </div>
    )
  }

  const { user, stats, recentReferrals, referralCode } = data

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Welcome back, {user.name.split(' ')[0]}
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            {user.department ? `${user.department} · ` : ''}
            Refer talent and track every step to hire
          </p>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20">
          <div>
            <p className="text-[10px] font-bold uppercase text-violet-600 tracking-wider">
              Your referral code
            </p>
            <p className="font-mono font-black text-lg text-violet-900 dark:text-violet-100">
              {referralCode}
            </p>
          </div>
          <button
            type="button"
            onClick={copyCode}
            className="p-2.5 rounded-xl bg-white dark:bg-white/10 border border-violet-200 dark:border-violet-500/30 hover:bg-violet-100 transition-colors"
            title="Copy code"
          >
            {copied ? <Check size={18} className="text-emerald-600" /> : <Copy size={18} />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Briefcase className="text-violet-600" size={22} />}
          label="Open roles"
          value={stats.openJobs}
          href="/referral-portal/jobs"
          linkLabel="Browse jobs"
        />
        <StatCard
          icon={<Users className="text-indigo-600" size={22} />}
          label="Total referrals"
          value={stats.totalReferrals}
          href="/referral-portal/referrals"
          linkLabel="View all"
        />
        <StatCard
          icon={<TrendingUp className="text-fuchsia-600" size={22} />}
          label="In pipeline"
          value={stats.inPipeline}
        />
        <StatCard
          icon={<Trophy className="text-amber-600" size={22} />}
          label="Successful hires"
          value={stats.hired}
          sub={
            stats.potentialBonus > 0
              ? `₹${stats.potentialBonus.toLocaleString('en-IN')} bonus earned`
              : undefined
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg text-slate-900 dark:text-white">Recent referrals</h2>
            <Link
              to="/referral-portal/referrals"
              className="text-xs font-bold text-violet-700 hover:underline inline-flex items-center gap-1"
            >
              See all <ArrowRight size={14} />
            </Link>
          </div>
          {recentReferrals.length === 0 ? (
            <p className="text-sm text-slate-500">
              You have not referred anyone yet.{' '}
              <Link to="/referral-portal/jobs" className="font-bold text-violet-700 hover:underline">
                Find an open role
              </Link>
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-white/10">
              {recentReferrals.map((r) => (
                <li key={r.id} className="py-3 flex justify-between items-center gap-4">
                  <div>
                    <Link
                      to={`/referral-portal/referrals/${r.id}`}
                      className="font-bold text-slate-900 dark:text-white hover:text-violet-700"
                    >
                      {r.name}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {r.jobTitle ?? '—'}
                      {r.jobCode ? ` · ${r.jobCode}` : ''}
                      {r.referralRelationship ? ` · ${r.referralRelationship}` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <StatusBadge status={r.status} />
                    {r.bonusAmount ? (
                      <p className="text-[10px] font-bold text-amber-700 mt-1">
                        ₹{r.bonusAmount.toLocaleString('en-IN')} bonus
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-4">
          <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
            <Gift size={28} className="mb-3 opacity-90" />
            <h3 className="font-bold text-lg">Referral rewards</h3>
            <p className="text-sm text-violet-100 mt-2">
              Earn bonuses when your referral is hired. Bonus amounts vary by role.
            </p>
            <Link
              to="/referral-portal/program"
              className="inline-block mt-4 text-xs font-bold bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg"
            >
              View program details →
            </Link>
          </div>

          {stats.statusBreakdown.length > 0 && (
            <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-5">
              <p className="text-[10px] font-bold uppercase text-slate-400 mb-3">By status</p>
              <ul className="space-y-2">
                {stats.statusBreakdown.map((s) => (
                  <li key={s.status} className="flex justify-between text-sm font-medium">
                    <span className="text-slate-600">{s.status}</span>
                    <span className="font-bold">{s.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  href,
  linkLabel,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: number
  href?: string
  linkLabel?: string
  sub?: string
}) {
  return (
    <div className="bg-white dark:bg-white/5 p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{value}</p>
      {sub && <p className="text-xs text-amber-700 font-bold mt-1">{sub}</p>}
      {href && linkLabel && (
        <Link
          to={href}
          className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-violet-700 hover:underline"
        >
          {linkLabel} <ArrowRight size={14} />
        </Link>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const hired = status === 'HIRED' || status === 'JOINED'
  const rejected = status === 'REJECTED'
  return (
    <span
      className={clsx(
        'px-2 py-1 rounded-md text-[10px] font-bold uppercase border',
        hired && 'bg-emerald-50 text-emerald-800 border-emerald-200',
        rejected && 'bg-red-50 text-red-700 border-red-200',
        !hired && !rejected && 'bg-slate-100 text-slate-700 border-slate-200'
      )}
    >
      {status}
    </span>
  )
}

export default ReferralDashboard
