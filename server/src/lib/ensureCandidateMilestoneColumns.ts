import { prisma } from './prisma.js'

/**
 * Adds offer/joining milestone columns when the Prisma schema is ahead of the DB
 * (e.g. after pulling changes without running migrate).
 */
export async function ensureCandidateMilestoneColumns(): Promise<void> {
  const statements = [
    'ALTER TABLE "Candidate" ADD COLUMN IF NOT EXISTS "offerDate" TIMESTAMP(3)',
    'ALTER TABLE "Candidate" ADD COLUMN IF NOT EXISTS "offerMonth" TEXT',
    'ALTER TABLE "Candidate" ADD COLUMN IF NOT EXISTS "offerQuarter" TEXT',
    'ALTER TABLE "Candidate" ADD COLUMN IF NOT EXISTS "expectedJoiningDate" TIMESTAMP(3)',
    'ALTER TABLE "Candidate" ADD COLUMN IF NOT EXISTS "joiningDate" TIMESTAMP(3)',
    'ALTER TABLE "Candidate" ADD COLUMN IF NOT EXISTS "joiningMonth" TEXT',
    'ALTER TABLE "Candidate" ADD COLUMN IF NOT EXISTS "joiningQuarter" TEXT',
  ]

  for (const sql of statements) {
    await prisma.$executeRawUnsafe(sql)
  }
}
