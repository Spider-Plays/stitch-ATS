import type { Vendor, VendorStatus } from '@/types'

export type VendorFilter = VendorStatus | 'ALL'

export const VENDOR_FILTERS: { id: VendorFilter; label: string }[] = [
  { id: 'ALL', label: 'All vendors' },
  { id: 'ACTIVE', label: 'Active' },
  { id: 'INACTIVE', label: 'Inactive' },
  { id: 'SUSPENDED', label: 'Suspended' },
]

export function vendorStatusLabel(status: VendorStatus): string {
  return status.charAt(0) + status.slice(1).toLowerCase()
}

export function vendorStatusClass(status: VendorStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-500/30'
    case 'INACTIVE':
      return 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/60 border-slate-200/80 dark:border-white/10'
    case 'SUSPENDED':
      return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300 border-red-200/80 dark:border-red-500/30'
    default:
      return 'bg-primary/10 text-primary dark:text-white/80 border-primary/15 dark:border-white/10'
  }
}

export function vendorSearchFields(v: Vendor): (string | undefined | null)[] {
  return [v.name, v.code, v.email, v.contactName, v.phone, v.status]
}

export function vendorStats(vendors: Vendor[]) {
  const withSubmissions = vendors.filter((v) => (v.submissionCount ?? 0) > 0).length
  const withAssignments = vendors.filter((v) => (v.assignmentCount ?? 0) > 0).length
  return {
    total: vendors.length,
    active: vendors.filter((v) => v.status === 'ACTIVE').length,
    inactive: vendors.filter((v) => v.status === 'INACTIVE').length,
    suspended: vendors.filter((v) => v.status === 'SUSPENDED').length,
    withSubmissions,
    withAssignments,
    totalSubmissions: vendors.reduce((n, v) => n + (v.submissionCount ?? 0), 0),
  }
}

export function filterVendors(vendors: Vendor[], filter: VendorFilter) {
  if (filter === 'ALL') return vendors
  return vendors.filter((v) => v.status === filter)
}

export function sortVendors(vendors: Vendor[]) {
  const order: Record<VendorStatus, number> = {
    ACTIVE: 0,
    INACTIVE: 1,
    SUSPENDED: 2,
  }
  return [...vendors].sort((a, b) => {
    const statusDiff = order[a.status] - order[b.status]
    if (statusDiff !== 0) return statusDiff
    return b.name.localeCompare(a.name)
  })
}

export function groupVendorsByStatus(vendors: Vendor[]) {
  const groups: { key: VendorStatus; title: string; items: Vendor[] }[] = [
    { key: 'ACTIVE', title: 'Active vendors', items: [] },
    { key: 'INACTIVE', title: 'Inactive', items: [] },
    { key: 'SUSPENDED', title: 'Suspended', items: [] },
  ]
  for (const v of vendors) {
    const g = groups.find((x) => x.key === v.status)
    if (g) g.items.push(v)
  }
  return groups.filter((g) => g.items.length > 0)
}

/** Vendors with recent submission activity — useful spotlight */
export function topSubmittingVendors(vendors: Vendor[], limit = 3) {
  return [...vendors]
    .filter((v) => (v.submissionCount ?? 0) > 0 && v.status === 'ACTIVE')
    .sort((a, b) => (b.submissionCount ?? 0) - (a.submissionCount ?? 0))
    .slice(0, limit)
}
