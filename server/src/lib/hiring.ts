import { prisma } from './prisma.js'

/** Keep requirement.filled in sync with HIRED candidates for that req */
export async function syncRequirementFilled(requirementId: string): Promise<void> {
  const hired = await prisma.candidate.count({
    where: { requirementId, status: 'HIRED' },
  })
  await prisma.requirement.update({
    where: { id: requirementId },
    data: { filled: hired, updatedAt: new Date() },
  })
}
