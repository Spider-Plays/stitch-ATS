import bcrypt from 'bcryptjs'
import { prisma } from './lib/prisma.js'
import { SEED_USERS } from './config/users.js'

const DEV_VENDOR_CODE = 'DEV-VENDOR'

async function upsertDevUser(u: (typeof SEED_USERS)[number], vendorId?: string) {
  const passwordHash = await bcrypt.hash(u.password, 10)
  await prisma.user.upsert({
    where: { email: u.email.toLowerCase() },
    update: {
      name: u.name,
      role: u.role,
      department: 'department' in u ? u.department : undefined,
      passwordHash,
      status: 'ACTIVE',
      ...(vendorId !== undefined && { vendorId }),
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
      ...(vendorId !== undefined && { vendorId }),
    },
  })
}

async function main() {
  if (SEED_USERS.length === 0) {
    console.log('No seed users configured. Run npm run db:bootstrap to create an admin.')
    return
  }
  console.log('Seeding database...')

  const devVendor = await prisma.vendor.upsert({
    where: { code: DEV_VENDOR_CODE },
    update: { name: 'Dev Staffing Co', status: 'ACTIVE', email: 'dev-vendor-org@local.test' },
    create: {
      name: 'Dev Staffing Co',
      code: DEV_VENDOR_CODE,
      email: 'dev-vendor-org@local.test',
      status: 'ACTIVE',
      contactName: 'Dev Vendor Contact',
    },
  })

  const sampleVendors = [
    { name: 'Apex Talent Partners', code: 'APEX', email: 'contact@apextalent.test', contactName: 'Priya Sharma', status: 'ACTIVE' },
    { name: 'Nexus Recruit Solutions', code: 'NEXUS', email: 'hello@nexusrecruit.test', contactName: 'Rahul Mehta', status: 'ACTIVE' },
    { name: 'Horizon Staffing Co', code: 'HORIZON', email: 'ops@horizonstaff.test', contactName: 'Anita Desai', status: 'ACTIVE' },
    { name: 'Summit HR Agency', code: 'SUMMIT', email: 'recruit@summitagency.test', contactName: 'Vikram Singh', status: 'INACTIVE' },
  ] as const

  for (const v of sampleVendors) {
    await prisma.vendor.upsert({
      where: { code: v.code },
      update: { name: v.name, email: v.email, contactName: v.contactName, status: v.status },
      create: { ...v, phone: null, website: null, address: null, notes: null },
    })
  }

  for (const u of SEED_USERS) {
    await upsertDevUser(u, u.role === 'VENDOR' ? devVendor.id : undefined)
  }
  console.log(`Seeded ${SEED_USERS.length} users and ${sampleVendors.length + 1} vendors.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
