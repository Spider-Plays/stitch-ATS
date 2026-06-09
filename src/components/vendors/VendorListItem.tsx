import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase,
  ChevronRight,
  Mail,
  Store,
  Upload,
  Users,
} from 'lucide-react'
import clsx from 'clsx'
import type { Vendor } from '../../types'
import { vendorStatusClass, vendorStatusLabel } from '@/pages/vendors/_shared/vendor.utils'
import { ActionsMenu, type ActionMenuItem } from '../ui/ActionsMenu'

export type VendorMenuItem = {
  id: string
  label: string
  onClick: () => void
  hidden?: boolean
  variant?: 'danger'
}

interface VendorListItemProps {
  vendor: Vendor
  menuItems?: VendorMenuItem[]
  variant?: 'default' | 'highlight'
}

export function VendorListItem({ vendor, menuItems = [], variant = 'default' }: VendorListItemProps) {
  const navigate = useNavigate()
  const jobs = vendor.assignmentCount ?? 0
  const submissions = vendor.submissionCount ?? 0
  const users = vendor.userCount ?? 0

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/vendors/${vendor.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          navigate(`/vendors/${vendor.id}`)
        }
      }}
      className={clsx(
        'group rounded-2xl border p-4 md:p-5 transition-all cursor-pointer',
        'app-card hover:shadow-md hover:border-primary/20 dark:hover:border-white/20',
        variant === 'highlight'
          ? 'border-emerald-300/60 dark:border-emerald-500/40 ring-1 ring-emerald-200/50 dark:ring-emerald-500/20'
          : 'border-primary/10 dark:border-white/10 shadow-sm'
      )}
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <div
            className={clsx(
              'shrink-0 p-3 rounded-xl',
              vendor.status === 'ACTIVE'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                : vendor.status === 'SUSPENDED'
                  ? 'bg-red-500/10 text-red-700 dark:text-red-300'
                  : 'bg-primary/10 dark:bg-white/10 text-primary dark:text-white'
            )}
          >
            <Store size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-base font-bold text-primary dark:text-white truncate group-hover:underline decoration-primary/30">
                {vendor.name}
              </h3>
              {vendor.code && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-primary/5 dark:bg-white/10 text-primary/70 dark:text-white/60">
                  {vendor.code}
                </span>
              )}
              <span
                className={clsx(
                  'shrink-0 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border',
                  vendorStatusClass(vendor.status)
                )}
              >
                {vendorStatusLabel(vendor.status)}
              </span>
              {variant === 'highlight' && submissions > 0 && (
                <span className="shrink-0 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                  Top submitter
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-primary/55 dark:text-white/55">
              <span className="inline-flex items-center gap-1 min-w-0">
                <Mail size={12} className="shrink-0" />
                <span className="truncate">{vendor.email}</span>
              </span>
              {vendor.contactName && (
                <span className="inline-flex items-center gap-1">
                  <Users size={12} />
                  {vendor.contactName}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 lg:gap-6 shrink-0">
          <div className="flex gap-4 text-xs font-bold text-primary/50 dark:text-white/50">
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Briefcase size={14} />
              {jobs} {jobs === 1 ? 'job' : 'jobs'}
            </span>
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Upload size={14} />
              {submissions} {submissions === 1 ? 'submission' : 'submissions'}
            </span>
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Users size={14} />
              {users} {users === 1 ? 'user' : 'users'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {menuItems.length > 0 && (
              <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                <ActionsMenu
                  items={menuItems as ActionMenuItem[]}
                  aria-label={`Actions for ${vendor.name}`}
                />
              </div>
            )}
            <ChevronRight
              size={20}
              className="text-primary/30 dark:text-white/30 group-hover:text-primary dark:group-hover:text-white transition-colors"
            />
          </div>
        </div>
      </div>
    </article>
  )
}
