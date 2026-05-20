import bcrypt from 'bcryptjs'
import { prisma } from './lib/prisma.js'
import { SEED_USERS } from './config/users.js'

async function main() {
  console.log('Seeding database...')
  for (const u of SEED_USERS) {
    const passwordHash = await bcrypt.hash(u.password, 10)
    await prisma.user.upsert({
      where: { email: u.email.toLowerCase() },
      update: {
        name: u.name,
        role: u.role,
        department: 'department' in u ? u.department : undefined,
        passwordHash,
        status: 'ACTIVE',
      },
      create: {
        email: u.email.toLowerCase(),
        passwordHash,
        name: u.name,
        role: u.role,
        department: 'department' in u ? u.department : undefined,
        status: 'ACTIVE',
        permissions: '[]',
        themePreference: 'system',
        authProvider: 'local',
      },
    })
  }
  console.log(`Seeded ${SEED_USERS.length} users.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
