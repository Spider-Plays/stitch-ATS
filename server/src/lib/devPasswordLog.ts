import { env } from '../config/env.js'

/** Never log passwords in production — use email delivery instead. */
export function logTemporaryPassword(context: string, email: string, password: string) {
  if (env.isProduction) return
  console.info(`[dev-only] ${context} for ${email}: ${password}`)
}
