import { prisma } from '../lib/prisma.js'

async function main() {
  console.log('Clearing all application data...')
  await prisma.$transaction([
    prisma.activityLog.deleteMany(),
    prisma.feedback.deleteMany(),
    prisma.offer.deleteMany(),
    prisma.interview.deleteMany(),
    prisma.candidate.deleteMany(),
    prisma.requirement.deleteMany(),
    prisma.user.deleteMany(),
  ])
  console.log('Database cleared.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
