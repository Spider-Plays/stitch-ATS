import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload } from 'lucide-react'
import clsx from 'clsx'
import type { VendorDetail } from '../../../types'
import type { CandidateStatus } from '../../../types'
import { candidateStatusClass, candidateStatusLabel } from '../../../lib/candidatePage'

type VendorProfileSubmissionsProps = {
  vendor: VendorDetail
}

export function VendorProfileSubmissions({ vendor }: VendorProfileSubmissionsProps) {
  const navigate = useNavigate()

  if (vendor.submissions.length === 0) {
    return (
      <div className="py-8 text-center space-y-2">
        <Upload size={32} className="mx-auto text-primary/25 dark:text-white/25" />
        <p className="text-sm font-medium text-primary/50 dark:text-white/50">
          No candidates submitted yet.
        </p>
        <p className="text-xs text-muted-foreground">
          Submissions from the vendor portal will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm min-w-[480px]">
        <thead>
          <tr className="text-left text-xs font-bold text-primary/50 dark:text-white/50 uppercase tracking-wider">
            <th className="pb-3 pr-4 pl-1">Candidate</th>
            <th className="pb-3 pr-4">Job</th>
            <th className="pb-3 pr-4">Submitted</th>
            <th className="pb-3">Stage</th>
          </tr>
        </thead>
        <tbody>
          {vendor.submissions.map((s) => (
            <tr
              key={s.id}
              className="border-t border-primary/5 dark:border-white/5 hover:bg-primary/[0.02] dark:hover:bg-white/5 cursor-pointer"
              onClick={() => navigate(`/candidates/${s.id}`)}
            >
              <td className="py-3 pr-4 pl-1">
                <p className="font-bold text-primary dark:text-white">{s.name}</p>
                <p className="text-xs text-primary/50 dark:text-white/50">{s.email}</p>
              </td>
              <td className="py-3 pr-4 text-primary/70 dark:text-white/70">
                {s.jobTitle ?? '—'}
              </td>
              <td className="py-3 pr-4 text-primary/60 dark:text-white/60 tabular-nums text-xs">
                {new Date(s.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </td>
              <td className="py-3">
                <span
                  className={clsx(
                    'inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border',
                    candidateStatusClass(s.status as CandidateStatus)
                  )}
                >
                  {candidateStatusLabel(s.status as CandidateStatus)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
