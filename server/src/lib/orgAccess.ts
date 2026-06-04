/** Full operational access (all data); Administration section remains ADMIN-only. */
export const ORG_WIDE_ACCESS_ROLES = [
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
  return role === 'ADMIN'
}
