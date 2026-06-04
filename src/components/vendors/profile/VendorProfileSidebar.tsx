import React from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, ExternalLink, Upload, Users } from 'lucide-react'
import clsx from 'clsx'
import type { VendorDetail } from '../../../types'
import { vendorProfileStats } from '../../../lib/vendorProfilePage'

type VendorProfileSidebarProps = {
  vendor: VendorDetail
  onOpenJobsTab: () => void
  onOpenUsersTab: () => void
  onOpenSubmissionsTab: () => void
}

export function VendorProfileSidebar({
  vendor,
  onOpenJobsTab,
  onOpenUsersTab,
  onOpenSubmissionsTab,
}: VendorProfileSidebarProps) {
  const stats = vendorProfileStats(vendor)
  const hasActivity = stats.submissions > 0

  return (
    <aside className="w-full lg:w-[340px] shrink-0 flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
      <div
        className={clsx(
          'rounded-2xl border p-5 shadow-sm',
          hasActivity
            ? 'border-emerald-300/60 dark:border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10'
            : 'border-primary/10 dark:border-white/10 bg-white dark:bg-white/5'
        )}
      >
        <h3 className="text-sm font-bold text-primary dark:text-white mb-4">Partner activity</h3>
        <div className="space-y-3">
          {[
            { label: 'Portal users', value: stats.users, icon: Users, onClick: onOpenUsersTab },
            { label: 'Assigned jobs', value: stats.jobs, icon: Briefcase, onClick: onOpenJobsTab },
            {
              label: 'Submissions',
              value: stats.submissions,
              icon: Upload,
              onClick: onOpenSubmissionsTab,
            },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border border-primary/10 dark:border-white/10 bg-white/60 dark:bg-black/20 hover:bg-primary/5 dark:hover:bg-white/10 transition-colors text-left"
            >
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary/50 dark:text-white/50">
                <item.icon size={14} />
                {item.label}
              </span>
              <span className="text-xl font-black tabular-nums text-primary dark:text-white">
                {item.value}
              </span>
            </button>
          ))}
        </div>
        {stats.activeSubmissions > 0 && (
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700/80 dark:text-emerald-300/80 mt-4">
            {stats.activeSubmissions} in active pipeline
          </p>
        )}
      </div>

      {vendor.status === 'ACTIVE' && (
        <div className="rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-primary dark:text-white mb-2">Vendor portal</h3>
          <p className="text-xs text-primary/50 dark:text-white/50 mb-3">
            Partners sign in with their portal account to view assigned jobs and submit candidates.
          </p>
          <p className="text-xs font-medium text-primary/60 dark:text-white/60 flex items-center gap-1.5">
            <ExternalLink size={12} />
            Portal login is separate from staff login
          </p>
        </div>
      )}

      {stats.jobs > 0 && (
        <Link
          to="/requirements"
          className="block rounded-2xl border border-primary/10 dark:border-white/10 bg-primary/[0.03] dark:bg-white/5 p-4 text-center text-xs font-bold uppercase tracking-wider text-primary dark:text-white hover:bg-primary/5 dark:hover:bg-white/10 transition-colors"
        >
          View all requirements
        </Link>
      )}
    </aside>
  )
}
