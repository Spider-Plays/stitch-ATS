import { prisma } from './prisma.js'

/** Internal staff roles configurable in User Management → Role access */
export const CONFIGURABLE_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'HR_HEAD',
  'HR_MANAGER',
  'RECRUITER',
  'TEAM_LEAD',
  'HIRING_MANAGER',
  'INTERVIEWER',
] as const

export type ConfigurableRole = (typeof CONFIGURABLE_ROLES)[number]

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

/** Default page access (matches original sidebar / route behavior) */
export const DEFAULT_ROLE_PAGES: Record<ConfigurableRole, PageKey[]> = {
  SUPER_ADMIN: [...PAGE_KEYS],
  ADMIN: PAGE_KEYS.filter((k) => k !== 'admin_users'),
  HR_HEAD: [
    'dashboard',
    'requirements',
    'vendors',
    'candidates',
    'pipeline',
    'interviews',
    'offers',
    'notifications',
    'settings',
  ],
  HR_MANAGER: [
    'dashboard',
    'requirements',
    'vendors',
    'candidates',
    'pipeline',
    'interviews',
    'offers',
    'notifications',
    'settings',
  ],
  RECRUITER: [
    'dashboard',
    'requirements',
    'vendors',
    'candidates',
    'pipeline',
    'interviews',
    'notifications',
    'settings',
  ],
  TEAM_LEAD: [
    'dashboard',
    'requirements',
    'vendors',
    'candidates',
    'pipeline',
    'interviews',
    'offers',
    'notifications',
    'settings',
  ],
  HIRING_MANAGER: ['dashboard', 'requirements', 'notifications', 'settings'],
  INTERVIEWER: ['dashboard', 'candidates', 'interviews', 'notifications', 'settings'],
}

function parsePages(raw: string | null | undefined): PageKey[] {
  try {
    const arr = JSON.parse(raw || '[]')
    if (!Array.isArray(arr)) return []
    return arr.filter((p): p is PageKey => PAGE_KEYS.includes(p as PageKey))
  } catch {
    return []
  }
}

export function sanitizePages(pages: string[]): PageKey[] {
  const unique = [...new Set(pages.filter((p) => PAGE_KEYS.includes(p as PageKey)))] as PageKey[]
  return unique
}

export function defaultPagesForRole(role: string): PageKey[] {
  if (role in DEFAULT_ROLE_PAGES) {
    return [...DEFAULT_ROLE_PAGES[role as ConfigurableRole]]
  }
  return ['dashboard', 'notifications', 'settings']
}

function finalizePagesForRole(role: string, pages: PageKey[]): PageKey[] {
  let result = [...pages]
  if (role === 'SUPER_ADMIN' && !result.includes('admin_users')) {
    result.push('admin_users')
  }
  if (role !== 'SUPER_ADMIN') {
    result = result.filter((p) => p !== 'admin_users')
  }
  if (role === 'INTERVIEWER' && !result.includes('candidates')) {
    result.push('candidates')
  }
  return result
}

export async function getAllowedPagesForRole(role: string): Promise<PageKey[]> {
  if (role === 'SUPER_ADMIN') {
    return [...PAGE_KEYS]
  }

  if (role === 'CANDIDATE' || role === 'VENDOR' || role === 'EMPLOYEE') {
    return []
  }

  const row = await prisma.rolePageAccess.findUnique({ where: { role } })
  let pages: PageKey[]
  if (row) {
    const parsed = parsePages(row.pages)
    pages = parsed.length > 0 ? parsed : defaultPagesForRole(role)
  } else {
    pages = defaultPagesForRole(role)
  }

  return finalizePagesForRole(role, pages)
}

export async function getAllRolePageAccess(): Promise<
  Record<string, { pages: PageKey[]; updatedAt?: string }>
> {
  const rows = await prisma.rolePageAccess.findMany()
  const byRole = new Map(rows.map((r) => [r.role, r]))

  const result: Record<string, { pages: PageKey[]; updatedAt?: string }> = {}
  for (const role of CONFIGURABLE_ROLES) {
    if (role === 'SUPER_ADMIN') {
      result[role] = { pages: [...PAGE_KEYS] }
      continue
    }
    const row = byRole.get(role)
    const raw = row?.pages ? parsePages(row.pages) : defaultPagesForRole(role)
    result[role] = {
      pages: finalizePagesForRole(role, raw),
      updatedAt: row?.updatedAt.toISOString(),
    }
  }
  return result
}

export async function setRolePageAccess(role: string, pages: PageKey[]): Promise<PageKey[]> {
  if (role === 'SUPER_ADMIN') {
    return [...PAGE_KEYS]
  }

  let sanitized = sanitizePages(pages)
  sanitized = sanitized.filter((p) => p !== 'admin_users')
  if (sanitized.length === 0) {
    throw new Error('At least one page must be enabled')
  }

  await prisma.rolePageAccess.upsert({
    where: { role },
    create: { role, pages: JSON.stringify(sanitized) },
    update: { pages: JSON.stringify(sanitized) },
  })

  return sanitized
}

export function pathnameToPageKey(pathname: string): PageKey | null {
  if (pathname === '/' || pathname.startsWith('/dashboard')) return 'dashboard'
  if (pathname.startsWith('/requirements')) return 'requirements'
  if (pathname.startsWith('/vendors')) return 'vendors'
  if (pathname.startsWith('/candidates')) return 'candidates'
  if (pathname.startsWith('/pipeline')) return 'pipeline'
  if (pathname.startsWith('/interviews')) return 'interviews'
  if (pathname.startsWith('/offers')) return 'offers'
  if (pathname.startsWith('/admin/users')) return 'admin_users'
  if (pathname.startsWith('/admin')) return null
  if (pathname.startsWith('/notifications')) return 'notifications'
  if (pathname.startsWith('/settings')) return 'settings'
  return null
}
