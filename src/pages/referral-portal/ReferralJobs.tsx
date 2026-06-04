import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { ListSearchBar } from '../../components/ui/ListSearchBar'
import { AppSelect } from '../../components/ui/AppSelect'
import { EmptyState } from '../../components/ui/EmptyState'
import { Gift, MapPin } from 'lucide-react'

const ReferralJobs = () => {
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('')

  const { data: departments = [] } = useQuery({
    queryKey: ['referral-portal-departments'],
    queryFn: api.referralPortal.getDepartments,
  })

  const { data: positions = [], isLoading } = useQuery({
    queryKey: ['referral-portal-positions', search, department],
    queryFn: () =>
      api.referralPortal.getPositions({
        q: search.trim() || undefined,
        department: department || undefined,
      }),
  })

  const sorted = useMemo(
    () =>
      [...positions].sort((a, b) => {
        const bonusDiff = (b.referralBonusAmount ?? 0) - (a.referralBonusAmount ?? 0)
        if (bonusDiff !== 0) return bonusDiff
        return b.openingsRemaining - a.openingsRemaining
      }),
    [positions]
  )

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Open roles</h1>
        <p className="text-sm text-slate-500 mt-1">
          LIVE positions accepting employee referrals. Bonus shown when configured by HR.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <ListSearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by title, skills, client, or job code…"
          />
        </div>
        {departments.length > 0 && (
          <AppSelect
            className="min-w-[160px]"
            value={department}
            onChange={setDepartment}
            options={[
              { value: '', label: 'All departments' },
              ...departments.map((d) => ({ value: d, label: d })),
            ]}
            aria-label="Filter by department"
          />
        )}
      </div>

      {isLoading ? (
        <p className="text-center text-slate-500 py-12">Loading open roles…</p>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon="work"
          title="No open roles"
          description="There are no referral-eligible jobs right now. Check back soon or contact HR."
        />
      ) : (
        <ul className="space-y-3">
          {sorted.map((job) => (
            <li key={job.id}>
              <Link
                to={`/referral-portal/jobs/${job.id}`}
                className="block p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-violet-300 dark:hover:border-violet-500/40 transition-colors group"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-violet-700">{job.jobCode}</p>
                    <p className="font-bold text-lg text-slate-900 dark:text-white mt-1 group-hover:text-violet-700 transition-colors">
                      {job.title}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      {job.client ? `${job.client} · ` : ''}
                      {job.department}
                    </p>
                  </div>
                  {job.referralBonusAmount ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30">
                      <Gift size={14} className="text-amber-700" />
                      <span className="text-xs font-black text-amber-800 dark:text-amber-200">
                        ₹{job.referralBonusAmount.toLocaleString('en-IN')} bonus
                      </span>
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500">
                  {job.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={12} /> {job.location}
                    </span>
                  )}
                  {job.workMode && <span>{job.workMode}</span>}
                  {job.salaryBand && <span>{job.salaryBand}</span>}
                  <span className="font-bold text-violet-700">
                    {job.openingsRemaining} opening{job.openingsRemaining !== 1 ? 's' : ''} left
                  </span>
                </div>
                {job.primarySkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {job.primarySkills.slice(0, 6).map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-500/10 text-[10px] font-bold text-violet-800 dark:text-violet-200"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                <span className="inline-block mt-3 text-xs font-bold text-violet-700">
                  Refer someone →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ReferralJobs
