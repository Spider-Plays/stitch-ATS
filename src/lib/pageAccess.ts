export const PAGE_KEYS = [
  'dashboard',
  'requirements',
  'vendors',
  'candidates',
  'pipeline',
  'interviews',
  'offers',
  'admin_users',
  'notifications',
  'settings',
] as const

export type PageKey = (typeof PAGE_KEYS)[number]

export const CONFIGURABLE_ROLES = [
  'ADMIN',
  'HR_HEAD',
  'HR_MANAGER',
  'RECRUITER',
  'TEAM_LEAD',
  'HIRING_MANAGER',
  'INTERVIEWER',
] as const

export type ConfigurableRole = (typeof CONFIGURABLE_ROLES)[number]

export const PAGE_DEFINITIONS: { key: PageKey; label: string; description: string }[] = [
  { key: 'dashboard', label: 'Dashboard', description: 'Home dashboard and overview' },
  { key: 'requirements', label: 'Requirements', description: 'Job requirements list and detail' },
  { key: 'vendors', label: 'Vendors', description: 'Vendor management' },
  { key: 'candidates', label: 'Candidates', description: 'Candidate profiles and add candidate' },
  { key: 'pipeline', label: 'Pipeline', description: 'Hiring pipeline by requirement' },
  { key: 'interviews', label: 'Interviews', description: 'Schedule and manage interviews' },
  { key: 'offers', label: 'Offers', description: 'Offer letters and approvals' },
  { key: 'admin_users', label: 'User Management', description: 'Admin user administration' },
  { key: 'notifications', label: 'Notifications', description: 'In-app notifications' },
  { key: 'settings', label: 'Settings', description: 'Account and app settings' },
]

export function canAccessPage(allowedPages: PageKey[] | undefined, page: PageKey): boolean {
  if (!allowedPages?.length) return false
  return allowedPages.includes(page)
}

export function pathnameToPageKey(pathname: string): PageKey | null {
  if (pathname === '/' || pathname.startsWith('/dashboard')) return 'dashboard'
  if (pathname.startsWith('/requirements')) return 'requirements'
  if (pathname.startsWith('/vendors')) return 'vendors'
  if (pathname.startsWith('/candidates')) return 'candidates'
  if (pathname.startsWith('/pipeline')) return 'pipeline'
  if (pathname.startsWith('/interviews')) return 'interviews'
  if (pathname.startsWith('/offers')) return 'offers'
  if (pathname.startsWith('/admin')) return 'admin_users'
  if (pathname.startsWith('/notifications')) return 'notifications'
  if (pathname.startsWith('/settings')) return 'settings'
  return null
}

export function firstAllowedPath(allowedPages: PageKey[]): string {
  const order: PageKey[] = [
    'dashboard',
    'requirements',
    'candidates',
    'interviews',
    'vendors',
    'pipeline',
    'offers',
    'admin_users',
    'notifications',
    'settings',
  ]
  for (const key of order) {
    if (allowedPages.includes(key)) {
      if (key === 'dashboard') return '/dashboard'
      if (key === 'admin_users') return '/admin'
      return `/${key}`
    }
  }
  return '/dashboard'
}
