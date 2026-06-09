import { prisma } from '../lib/prisma.js'

const email = process.argv[2]?.trim().toLowerCase()
const role = process.argv[3]?.trim()

async function main() {
  if (!email || !role) {
    console.error('Usage: tsx src/scripts/set-user-role.ts <email> <role>')
    process.exit(1)
  }

  const user = await prisma.user.update({
    where: { email },
    data: { role },
  })

  console.log(`Updated ${user.email} -> ${user.role}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
