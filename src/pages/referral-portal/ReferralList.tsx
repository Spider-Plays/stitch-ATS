import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { ListSearchBar } from '../../components/ui/ListSearchBar'
import { matchesAnySearch } from '../../lib/textSearch'
import { EmptyState } from '../../components/ui/EmptyState'
import clsx from 'clsx'

const ReferralList = () => {
  const [search, setSearch] = useState('')
  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ['referral-portal-referrals'],
    queryFn: api.referralPortal.getReferrals,
  })

  const filtered = useMemo(
    () =>
      referrals.filter((c) =>
        matchesAnySearch(
          [c.name, c.email, c.status, c.jobTitle, c.role, c.referralRelationship],
          search
        )
      ),
    [referrals, search]
  )

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">My referrals</h1>
          <p className="text-sm text-slate-500 mt-1">
            Everyone you have referred — track status and hiring progress.
          </p>
        </div>
        <Link
          to="/referral-portal/jobs"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700"
        >
          Refer someone new
        </Link>
      </div>

      <ListSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search by name, email, job, or status…"
      />

      {isLoading ? (
        <p className="text-center py-12 text-slate-500">Loading…</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="group"
          title={search ? 'No matches' : 'No referrals yet'}
          description={
            search
              ? 'Try a different search.'
              : 'Browse open roles and submit your first referral.'
          }
        />
      ) : (
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                  Candidate
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                  Job
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                  Relationship
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                  Submitted
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/10">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-violet-50/50 dark:hover:bg-violet-500/5">
                  <td className="px-4 py-3">
                    <Link
                      to={`/referral-portal/referrals/${c.id}`}
                      className="font-bold text-slate-900 dark:text-white hover:text-violet-700"
                    >
                      {c.name}
                    </Link>
                    <p className="text-xs text-slate-500">{c.email}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.jobTitle ?? c.role}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {c.referralRelationship ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={clsx(
                        'px-2 py-0.5 rounded text-[10px] font-bold uppercase border',
                        (c.status === 'HIRED' || c.status === 'JOINED') &&
                          'bg-emerald-50 text-emerald-800 border-emerald-200',
                        c.status === 'REJECTED' && 'bg-red-50 text-red-700 border-red-200',
                        c.status !== 'HIRED' &&
                          c.status !== 'JOINED' &&
                          c.status !== 'REJECTED' &&
                          'bg-slate-100 text-slate-700 border-slate-200'
                      )}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default ReferralList
