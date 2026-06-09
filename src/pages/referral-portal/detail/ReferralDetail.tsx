import React from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { Gift } from 'lucide-react'
import clsx from 'clsx'
import './detail.css'

const ReferralDetail = () => {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading } = useQuery({
    queryKey: ['referral-portal-referral', id],
    queryFn: () => api.referralPortal.getReferral(id!),
    enabled: !!id,
  })

  if (isLoading) return <div className="p-12 text-center text-slate-500">Loading…</div>
  if (!data) return <div className="p-12 text-center">Referral not found</div>

  const { candidate, timeline, referralRelationship, referralNotes, referralBonusAmount } = data

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-6 space-y-4">
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">{candidate.name}</h1>
            <p className="text-sm text-slate-500">{candidate.email}</p>
          </div>
          <span
            className={clsx(
              'px-3 py-1 rounded-lg text-xs font-bold uppercase border h-fit',
              (candidate.status === 'HIRED' || candidate.status === 'JOINED') &&
                'bg-emerald-50 text-emerald-800 border-emerald-200',
              candidate.status === 'REJECTED' && 'bg-red-50 text-red-700 border-red-200',
              candidate.status !== 'HIRED' &&
                candidate.status !== 'JOINED' &&
                candidate.status !== 'REJECTED' &&
                'bg-slate-100 text-slate-700 border-slate-200'
            )}
          >
            {candidate.status}
          </span>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-[10px] font-bold uppercase text-slate-400">Role</dt>
            <dd className="font-medium">{candidate.jobTitle ?? candidate.role}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase text-slate-400">Relationship</dt>
            <dd className="font-medium">{referralRelationship ?? '—'}</dd>
          </div>
          {candidate.matchScore != null && (
            <div>
              <dt className="text-[10px] font-bold uppercase text-slate-400">Match score</dt>
              <dd className="font-medium">{Math.round(candidate.matchScore)}%</dd>
            </div>
          )}
          {referralBonusAmount ? (
            <div className="flex items-center gap-2">
              <Gift size={16} className="text-amber-600" />
              <div>
                <dt className="text-[10px] font-bold uppercase text-amber-700">Referral bonus</dt>
                <dd className="font-black text-amber-800">
                  ₹{referralBonusAmount.toLocaleString('en-IN')} on successful hire
                </dd>
              </div>
            </div>
          ) : null}
        </dl>

        {referralNotes && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 text-sm">
            <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Your notes</p>
            <p className="text-slate-700 dark:text-white/80">{referralNotes}</p>
          </div>
        )}
      </div>

      <section className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-6">
        <h2 className="font-bold text-lg mb-4">Activity timeline</h2>
        {timeline.length === 0 ? (
          <p className="text-sm text-slate-500">No activity logged yet.</p>
        ) : (
          <ul className="space-y-4 border-l-2 border-violet-200 dark:border-violet-500/30 ml-2 pl-6">
            {timeline.map((ev, i) => (
              <li key={`${ev.timestamp}-${i}`} className="relative">
                <span className="absolute -left-[1.65rem] top-1 size-3 rounded-full bg-violet-500 ring-4 ring-violet-100 dark:ring-violet-900" />
                <p className="text-xs font-bold text-slate-400">
                  {new Date(ev.timestamp).toLocaleString()}
                </p>
                <p className="font-bold text-slate-900 dark:text-white">{ev.action.replace(/_/g, ' ')}</p>
                {ev.performerName && (
                  <p className="text-xs text-slate-500">by {ev.performerName}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default ReferralDetail
