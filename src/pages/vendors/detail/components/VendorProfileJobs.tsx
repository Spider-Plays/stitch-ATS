import React from 'react'
import { Link } from 'react-router-dom'
import { Briefcase } from 'lucide-react'
import type { Requirement, VendorDetail } from '@/types'
import { Button } from '@/components/ui/Button'

type VendorProfileJobsProps = {
  vendor: VendorDetail
  liveJobs: Requirement[]
  selectedJobs: string[]
  setSelectedJobs: React.Dispatch<React.SetStateAction<string[]>>
  onAssign: () => void
  onUnassign: (requirementId: string) => void
  assignPending: boolean
  unassignPending: boolean
}

export function VendorProfileJobs({
  vendor,
  liveJobs,
  selectedJobs,
  setSelectedJobs,
  onAssign,
  onUnassign,
  assignPending,
  unassignPending,
}: VendorProfileJobsProps) {
  const assignedIds = new Set(vendor.assignments.map((a) => a.requirementId))
  const unassignedLive = liveJobs.filter((j) => !assignedIds.has(j.id))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-bold text-primary dark:text-white mb-1">Assign LIVE jobs</h2>
        <p className="text-sm text-primary/50 dark:text-white/50 mb-4">
          Assigned roles appear in the vendor portal. Job visibility for vendors is enabled when
          assigned.
        </p>
        <div className="max-h-48 overflow-y-auto space-y-2 border border-primary/10 dark:border-white/10 rounded-xl p-3 bg-primary/[0.02] dark:bg-black/20">
          {unassignedLive.map((j) => (
            <label
              key={j.id}
              className="flex items-center gap-2 text-sm font-medium cursor-pointer text-primary dark:text-white"
            >
              <input
                type="checkbox"
                checked={selectedJobs.includes(j.id)}
                onChange={(e) =>
                  setSelectedJobs((prev) =>
                    e.target.checked ? [...prev, j.id] : prev.filter((x) => x !== j.id)
                  )
                }
                className="rounded"
              />
              <span>
                {j.title}{' '}
                <span className="text-muted-foreground">
                  ({j.jobCode ?? j.id.slice(-6)})
                </span>
              </span>
            </label>
          ))}
          {unassignedLive.length === 0 && (
            <p className="text-sm text-muted-foreground py-2">
              All LIVE jobs are already assigned or none are available.
            </p>
          )}
        </div>
        <Button
          type="button"
          className="mt-3"
          disabled={selectedJobs.length === 0 || assignPending}
          isLoading={assignPending}
          onClick={onAssign}
        >
          Assign selected ({selectedJobs.length})
        </Button>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Briefcase size={18} className="text-primary dark:text-white" />
          <h2 className="text-sm font-bold text-primary dark:text-white">
            Current assignments ({vendor.assignments.length})
          </h2>
        </div>
        {vendor.assignments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No jobs assigned yet.</p>
        ) : (
          <ul className="divide-y divide-primary/5 dark:divide-white/5 rounded-xl border border-primary/10 dark:border-white/10 overflow-hidden">
            {vendor.assignments.map((a) => (
              <li
                key={a.id}
                className="py-3 px-4 flex justify-between items-center gap-4 bg-white dark:bg-white/[0.02] hover:bg-primary/[0.02] dark:hover:bg-white/5"
              >
                <div className="min-w-0">
                  <Link
                    to={`/requirements/${a.requirementId}`}
                    className="font-bold text-sm text-primary dark:text-white hover:underline truncate block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {a.title}
                  </Link>
                  <p className="text-xs text-primary/50 dark:text-white/50">
                    {a.jobCode} · {a.status}
                    {a.department ? ` · ${a.department}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onUnassign(a.requirementId)}
                  disabled={unassignPending}
                  className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline shrink-0"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
