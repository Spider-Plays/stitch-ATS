import { firstAllowedPath, PageKey, isAdminRole } from '@/permissions'
import type { User } from '@/types'

/** Where to send a user immediately after sign-in (or when already authenticated). */
export function postAuthPath(user: User, allowedPages: PageKey[] = [], from = '/'): string {
  if (user.mustChangePassword) return '/set-password'

  if (user.role === 'CANDIDATE') return '/portal/dashboard'
  if (user.role === 'EMPLOYEE') return '/referral-portal/dashboard'
  if (user.role === 'VENDOR') return '/vendor-portal/dashboard'
  if (allowedPages.length > 0) return firstAllowedPath(allowedPages)
  if (isAdminRole(user.role)) return '/admin'
  return from === '/' ? '/dashboard' : from
}
