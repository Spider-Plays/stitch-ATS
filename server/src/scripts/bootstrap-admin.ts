import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  const name = process.env.ADMIN_NAME?.trim() || 'Administrator'

  if (!email || !password) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables.')
    process.exit(1)
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role: 'ADMIN', status: 'ACTIVE', department: 'Operations' },
    create: {
      email,
      passwordHash,
      name,
      role: 'ADMIN',
      department: 'Operations',
      status: 'ACTIVE',
      permissions: '[]',
      themePreference: 'system',
      authProvider: 'local',
    },
  })

  console.log(`Admin ready: ${user.email}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
