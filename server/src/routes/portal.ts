import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { mapCandidate, mapInterview, mapOffer, mapRequirement } from '../utils/mappers.js'
import { requireAuth, requireActiveUser, requireRoles } from '../middleware/auth.js'
import { logActivity } from '../services/activityLog.js'

const router = Router()
router.use(requireAuth, requireActiveUser, requireRoles('CANDIDATE'))

function portalRequirementVisible(
  requirement: { status: string; visibleToCandidates: boolean } | null
) {
  if (!requirement) return false
  return requirement.status === 'LIVE' && requirement.visibleToCandidates
}

function mapPortalPosition(r: {
  id: string
  jobCode: string | null
  client: string | null
  title: string
  department: string
  location: string | null
  priority: string | null
  openings: number
  filled: number
  description: string | null
  updatedAt: Date
}) {
  return {
    id: r.id,
    jobCode: r.jobCode ?? r.id.slice(-8).toUpperCase(),
    client: r.client ?? undefined,
    title: r.title,
    department: r.department,
    location: r.location ?? undefined,
    priority: r.priority ?? undefined,
    openings: r.openings,
    filled: r.filled,
    description: r.description ?? undefined,
    updatedAt: r.updatedAt.toISOString(),
  }
}

router.get('/positions', async (_req, res) => {
  const rows = await prisma.requirement.findMany({
    where: { status: 'LIVE', visibleToCandidates: true },
    orderBy: { updatedAt: 'desc' },
  })
  res.json(rows.map(mapPortalPosition))
})

router.get('/positions/:id', async (req, res) => {
  const row = await prisma.requirement.findUnique({ where: { id: req.params.id } })
  if (!row || !portalRequirementVisible(row)) {
    return res.status(404).json({ error: 'Position not found or not available' })
  }
  res.json(mapPortalPosition(row))
})

router.post('/positions/:id/apply', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } })
  if (!user) return res.status(404).json({ error: 'User not found' })

  const requirement = await prisma.requirement.findUnique({ where: { id: req.params.id } })
  if (!requirement || !portalRequirementVisible(requirement)) {
    return res.status(404).json({ error: 'Position not found or not open for applications' })
  }

  const email = user.email.toLowerCase()
  const existing = await prisma.candidate.findFirst({
    where: {
      email: { equals: email, mode: 'insensitive' },
      requirementId: requirement.id,
    },
  })

  if (existing) {
    return res.json({
      alreadyApplied: true,
      candidate: mapCandidate(existing, { requirement }),
    })
  }

  const row = await prisma.candidate.create({
    data: {
      name: user.name,
      email: user.email,
      role: requirement.title,
      status: 'APPLIED',
      matchScore: 0,
      source: 'Candidate Portal',
      requirementId: requirement.id,
      jobTitle: requirement.title,
      phone: user.phoneNumber ?? null,
    },
  })

  await logActivity({
    entityType: 'CANDIDATE',
    entityId: row.id,
    action: 'APPLIED',
    performedBy: user.id,
    performerName: user.name,
    performerRole: user.role,
    details: {
      requirementId: requirement.id,
      jobCode: requirement.jobCode,
      title: requirement.title,
    },
  })

  res.status(201).json({
    alreadyApplied: false,
    candidate: mapCandidate(row, { requirement }),
  })
})

router.get('/me', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } })
  if (!user) return res.status(404).json({ error: 'User not found' })

  const candidate = await prisma.candidate.findFirst({
    where: { email: { equals: user.email, mode: 'insensitive' } },
    orderBy: { updatedAt: 'desc' },
  })

  if (!candidate) {
    return res.json({
      linked: false,
      message: 'Browse open positions below and apply to get started.',
      user: { name: user.name, email: user.email },
    })
  }

  const [interviews, offers, linkedRequirement] = await Promise.all([
    prisma.interview.findMany({
      where: { candidateId: candidate.id },
      orderBy: { scheduledAt: 'desc' },
    }),
    prisma.offer.findMany({
      where: { candidateId: candidate.id },
      orderBy: { createdAt: 'desc' },
    }),
    candidate.requirementId
      ? prisma.requirement.findUnique({ where: { id: candidate.requirementId } })
      : null,
  ])

  const requirementVisible = portalRequirementVisible(linkedRequirement)
  let requirementMessage: string | undefined
  if (linkedRequirement && !requirementVisible) {
    if (linkedRequirement.status === 'ON_HOLD') {
      requirementMessage = 'This position is temporarily on hold.'
    } else if (!linkedRequirement.visibleToCandidates) {
      requirementMessage = 'Job details for your application are not shown on the portal.'
    } else {
      requirementMessage = 'This position is not currently listed on the candidate portal.'
    }
  }

  res.json({
    linked: true,
    candidate: mapCandidate(candidate, { requirement: linkedRequirement }),
    requirement: requirementVisible && linkedRequirement ? mapRequirement(linkedRequirement) : null,
    requirementHidden: !!linkedRequirement && !requirementVisible,
    requirementMessage,
    interviews: interviews.map(mapInterview),
    offers: offers.map(mapOffer),
  })
})

export default router
