import { INTERNAL_ROLES } from './roles.js'

/** Roles allowed to use the employee referral portal API and UI */
export const REFERRAL_PORTAL_ROLES = ['EMPLOYEE', ...INTERNAL_ROLES] as const

export type ReferralPortalRole = (typeof REFERRAL_PORTAL_ROLES)[number]

export function isReferralPortalRole(role: string): role is ReferralPortalRole {
  return (REFERRAL_PORTAL_ROLES as readonly string[]).includes(role)
}
