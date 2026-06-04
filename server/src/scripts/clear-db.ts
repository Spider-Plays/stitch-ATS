import { prisma } from '../lib/prisma.js'

async function main() {
  console.log('Clearing all application data...')

  await prisma.$transaction([
    prisma.activityLog.deleteMany(),
    prisma.feedback.deleteMany(),
    prisma.offer.deleteMany(),
    prisma.interview.deleteMany(),
    prisma.interviewPlanStage.deleteMany(),
    prisma.interviewPlan.deleteMany(),
    prisma.candidate.deleteMany(),
    prisma.vendorRequirement.deleteMany(),
    prisma.vendor.deleteMany(),
    prisma.skillCatalog.deleteMany(),
    prisma.departmentCatalog.deleteMany(),
    prisma.clientCatalog.deleteMany(),
    prisma.interviewPanelLevel.deleteMany(),
    prisma.requirement.deleteMany(),
    prisma.rolePageAccess.deleteMany(),
    prisma.user.deleteMany(),
  ])

  const counts = await Promise.all([
    prisma.user.count(),
    prisma.requirement.count(),
    prisma.candidate.count(),
    prisma.vendor.count(),
  ])

  if (counts.some((n) => n > 0)) {
    throw new Error(`Clear incomplete: ${counts.join(', ')} remaining in core tables`)
  }

  console.log('Database cleared — all tables are empty.')
  console.log('Run `npm run db:bootstrap` or `npm run db:seed` to create login accounts again.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
