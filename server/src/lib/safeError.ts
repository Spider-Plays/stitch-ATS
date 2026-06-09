import { env } from '../config/env.js'

export function clientErrorMessage(err: unknown, devFallback = 'Internal server error'): string {
  if (env.isProduction) return 'Internal server error'
  if (err instanceof Error && err.message) return err.message
  return devFallback
}

export function emailDeliveryErrorMessage(detail?: string): string {
  if (env.isProduction) return 'Email delivery failed'
  return detail ? `Email delivery failed: ${detail}` : 'Email delivery failed'
}

export const EMAIL_NOT_CONFIGURED_WARNING =
  'Email is not configured. Set RESEND_API_KEY to deliver passwords securely.'

export const EMAIL_NOT_CONFIGURED_DEV_HINT =
  'Email is not configured. Temporary password was logged to the API server console (dev only).'
