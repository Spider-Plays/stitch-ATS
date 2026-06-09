import { firstAllowedPath, type PageKey } from '@/permissions'

export type DevLoginSession = {
  user: { role: string }
  allowedPages: PageKey[]
}

/** Where to send the user after a successful dev quick-login. */
export function resolveDevLoginRedirect(
  session: DevLoginSession,
  clickedRole?: string
): string {
  const role = session.user.role
  if (role === 'CANDIDATE' || clickedRole === 'CANDIDATE') return '/portal/dashboard'
  if (role === 'VENDOR' || clickedRole === 'VENDOR') return '/vendor-portal/dashboard'
  if (role === 'EMPLOYEE' || clickedRole === 'EMPLOYEE') return '/referral-portal/dashboard'
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') return '/admin'
  if (session.allowedPages.length > 0) return firstAllowedPath(session.allowedPages)
  return '/dashboard'
}
