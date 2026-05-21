import { DEV_USERS } from './devUsers.js'

/** Dev test users — remove devUsers.ts and set to [] when done testing. */
export const SEED_USERS: readonly {
  email: string
  password: string
  name: string
  role: string
  department?: string
}[] = DEV_USERS
