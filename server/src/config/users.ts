/** Optional seed users — leave empty for a clean database. Use `npm run db:bootstrap` to create the first admin. */
export const SEED_USERS: readonly {
  email: string
  password: string
  name: string
  role: string
  department?: string
}[] = []
