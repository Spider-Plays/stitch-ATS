/** Full operational access (all data); Administration section remains ADMIN-only. */
export const ORG_WIDE_ACCESS_ROLES = [
  'ADMIN',
  'HR_HEAD',
  'HR_MANAGER',
  'TEAM_LEAD',
] as const

export function hasOrgWideAccess(role?: string | null): boolean {
  return ORG_WIDE_ACCESS_ROLES.includes(role as (typeof ORG_WIDE_ACCESS_ROLES)[number])
}
