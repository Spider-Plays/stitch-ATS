import { DEV_USERS } from './devUsers.js'
import { env } from './env.js'

/** Dev test users — only available outside production. Use db:bootstrap for prod admins. */
export const SEED_USERS: readonly {
  email: string
  password: string
  name: string
  role: string
  department?: string
}[] = env.isProduction ? [] : DEV_USERS
