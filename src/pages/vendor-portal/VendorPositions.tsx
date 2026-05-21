import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { EmptyState } from '../../components/ui/EmptyState'

const VendorPositions = () => {
  const { data: positions = [], isLoading } = useQuery({
    queryKey: ['vendor-portal-positions'],
    queryFn: api.vendorPortal.getPositions,
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Assigned jobs</h1>
        <p className="text-sm text-slate-500 mt-1">
          LIVE positions your organization can submit candidates for.
        </p>
      </div>

      {isLoading ? (
        <p className="text-center text-slate-500 py-12">Loading...</p>
      ) : positions.length === 0 ? (
        <EmptyState
          icon="work"
          title="No jobs assigned"
          description="Your HR team has not assigned any open roles to your vendor account yet."
        />
      ) : (
        <ul className="space-y-3">
          {positions.map((job) => (
            <li key={job.id}>
              <Link
                to={`/vendor-portal/positions/${job.id}`}
                className="block p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-emerald-300 transition-colors"
              >
                <p className="text-[10px] font-bold uppercase text-emerald-700">{job.jobCode}</p>
                <p className="font-bold text-lg text-slate-900 dark:text-white mt-1">{job.title}</p>
                <p className="text-sm text-slate-500 mt-1">
                  {job.client ? `${job.client} · ` : ''}
                  {job.department}
                  {job.location ? ` · ${job.location}` : ''}
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  {job.openings - job.filled} opening(s) remaining
                </p>
                <span className="inline-block mt-3 text-xs font-bold text-emerald-700">
                  Submit candidate →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default VendorPositions
