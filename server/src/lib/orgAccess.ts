/** Full operational access (all data); Administration section remains admin-only. */
export const ORG_WIDE_ACCESS_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'HR_HEAD',
  'HR_MANAGER',
  'TEAM_LEAD',
] as const

export type OrgWideAccessRole = (typeof ORG_WIDE_ACCESS_ROLES)[number]

export function hasOrgWideAccess(role: string): boolean {
  return (ORG_WIDE_ACCESS_ROLES as readonly string[]).includes(role)
}

export function isAdminRole(role: string): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
}

export function isSuperAdminRole(role: string): boolean {
  return role === 'SUPER_ADMIN'
}

export function canManageUsers(role: string): boolean {
  return isSuperAdminRole(role)
}
