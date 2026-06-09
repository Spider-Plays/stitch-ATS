import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { ListSearchBar } from '@/components/ui/ListSearchBar'
import { matchesAnySearch } from '@/lib/textSearch'
import { EmptyState } from '@/components/ui/EmptyState'
import clsx from 'clsx'
import './submissions.css'

const VendorSubmissions = () => {
  const [search, setSearch] = useState('')
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['vendor-portal-submissions'],
    queryFn: api.vendorPortal.getSubmissions,
  })

  const filtered = useMemo(
    () =>
      submissions.filter((c) =>
        matchesAnySearch([c.name, c.email, c.status, c.jobTitle, c.role], search)
      ),
    [submissions, search]
  )

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">My submissions</h1>
        <p className="text-sm text-slate-500 mt-1">Candidates you have submitted to assigned jobs.</p>
      </div>

      <ListSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search by name, email, job, or status..."
      />

      {isLoading ? (
        <p className="text-center py-12 text-slate-500">Loading...</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="group"
          title={search ? 'No matches' : 'No submissions yet'}
          description={
            search ? 'Try a different search.' : 'Submit candidates from your assigned jobs.'
          }
        />
      ) : (
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Candidate</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Job</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/10">
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-900 dark:text-white">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.email}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.jobTitle ?? c.role}</td>
                  <td className="px-4 py-3">
                    <span
                      className={clsx(
                        'px-2 py-0.5 rounded text-[10px] font-bold uppercase border',
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

export default VendorSubmissions
