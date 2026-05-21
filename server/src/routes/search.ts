import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { mapCandidate, mapRequirement, mapUser, mapInterview } from '../utils/mappers.js'
import { requireAuth, requireActiveUser, requireRoles } from '../middleware/auth.js'
import { INTERNAL_ROLES } from '../lib/roles.js'

const router = Router()
router.use(requireAuth, requireActiveUser, requireRoles(...INTERNAL_ROLES))

router.get('/', async (req, res) => {
  const q = String(req.query.q || '').trim()
  if (q.length < 2) {
    return res.json({ candidates: [], requirements: [], users: [], interviews: [] })
  }

  const [candidates, requirements, users, matchingCandidates] = await Promise.all([
    prisma.candidate.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { role: { contains: q, mode: 'insensitive' } },
          { jobTitle: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 8,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.requirement.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { department: { contains: q, mode: 'insensitive' } },
          { hiringManager: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 8,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.user.findMany({
      where: {
        role: { not: 'CANDIDATE' },
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { department: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 5,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.candidate.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, role: true },
      take: 15,
    }),
  ])

  const candidateIds = matchingCandidates.map((c) => c.id)
  const candidateById = new Map(matchingCandidates.map((c) => [c.id, c]))

  const interviewRows =
    candidateIds.length > 0
      ? await prisma.interview.findMany({
          where: { candidateId: { in: candidateIds } },
          take: 5,
          orderBy: { scheduledAt: 'desc' },
        })
      : []

  const interviews = interviewRows.map((row) => {
    const cand = candidateById.get(row.candidateId)
    return {
      ...mapInterview(row),
      candidateName: cand?.name,
      candidateRole: cand?.role,
    }
  })

  res.json({
    candidates: candidates.map(mapCandidate),
    requirements: requirements.map(mapRequirement),
    users: users.map(mapUser),
    interviews,
  })
})

export default router
