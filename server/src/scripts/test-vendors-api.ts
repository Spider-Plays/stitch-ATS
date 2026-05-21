import { prisma } from '../lib/prisma.js'
import { mapVendor } from '../lib/mapVendor.js'

async function main() {
  const vendors = await prisma.vendor.findMany({ orderBy: { createdAt: 'desc' } })
  const enriched = await Promise.all(
    vendors.map(async (v) => {
      const [userCount, submissionCount, assignmentCount] = await Promise.all([
        prisma.user.count({ where: { vendorId: v.id, role: 'VENDOR' } }),
        prisma.candidate.count({ where: { vendorId: v.id } }),
        prisma.vendorRequirement.count({ where: { vendorId: v.id } }),
      ])
      return mapVendor(v, { userCount, submissionCount, assignmentCount })
    })
  )
  console.log(JSON.stringify(enriched.slice(0, 2), null, 2))
  console.log('total', enriched.length)
}

main()
  .catch((e) => {
    console.error('FAILED', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
