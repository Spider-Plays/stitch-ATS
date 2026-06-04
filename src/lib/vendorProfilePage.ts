import type { VendorDetail, VendorStatus } from '../types'

export const VENDOR_PROFILE_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'jobs', label: 'Assigned jobs' },
  { id: 'users', label: 'Portal users' },
  { id: 'submissions', label: 'Submissions' },
] as const

export type VendorProfileTab = (typeof VENDOR_PROFILE_TABS)[number]['id']

export function sanitizeVendorProfileTab(tab: string | null): VendorProfileTab {
  if (tab === 'jobs' || tab === 'users' || tab === 'submissions') return tab
  return 'overview'
}

export const VENDOR_PROFILE_INPUT =
  'w-full px-4 py-2.5 rounded-xl border border-primary/10 dark:border-white/10 bg-white dark:bg-white/[0.02] text-sm font-medium text-primary dark:text-white placeholder:text-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-shadow'

export const VENDOR_PROFILE_LABEL =
  'block text-[10px] font-bold text-primary/50 dark:text-white/50 uppercase tracking-wider mb-1.5'

export function vendorInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
}

export function vendorProfileStats(vendor: VendorDetail) {
  return {
    users: vendor.users.length,
    jobs: vendor.assignments.length,
    submissions: vendor.submissions.length,
    activeSubmissions: vendor.submissions.filter(
      (s) => !['REJECTED', 'HIRED'].includes(s.status)
    ).length,
  }
}

export const VENDOR_STATUS_OPTIONS: { value: VendorStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'SUSPENDED', label: 'Suspended' },
]
