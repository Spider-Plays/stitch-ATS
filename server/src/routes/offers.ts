import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { mapOffer } from '../utils/mappers.js'
import { requireAuth, requireActiveUser, requireRoles } from '../middleware/auth.js'
import { logActivity } from '../services/activityLog.js'
import { INTERNAL_ROLES, OFFER_ROLES } from '../lib/roles.js'
import {
  assertCanViewCandidate,
  buildOfferListWhere,
  CandidateAccessError,
} from '../lib/candidateAccess.js'
import { sendOfferSentEmail } from '../services/email.js'

const router = Router()
router.use(requireAuth, requireActiveUser, requireRoles(...INTERNAL_ROLES))

router.get('/', async (req, res) => {
  const listWhere = await buildOfferListWhere(req.auth!)
  const rows = await prisma.offer.findMany({
    where: listWhere,
    orderBy: { createdAt: 'desc' },
  })
  res.json(rows.map(mapOffer))
})

router.get('/by-candidate/:candidateId', async (req, res) => {
  try {
    await assertCanViewCandidate(req.auth!, req.params.candidateId)
  } catch (err) {
    if (err instanceof CandidateAccessError) {
      return res.status(403).json({ error: err.message })
    }
    throw err
  }
  const rows = await prisma.offer.findMany({
    where: { candidateId: req.params.candidateId },
    orderBy: { createdAt: 'desc' },
  })
  res.json(rows.map(mapOffer))
})

router.get('/:id', async (req, res) => {
  const row = await prisma.offer.findUnique({ where: { id: req.params.id } })
  if (!row) return res.status(404).json({ error: 'Not found' })
  try {
    await assertCanViewCandidate(req.auth!, row.candidateId)
  } catch (err) {
    if (err instanceof CandidateAccessError) {
      return res.status(403).json({ error: err.message })
    }
    throw err
  }
  res.json(mapOffer(row))
})

router.post('/', requireRoles(...OFFER_ROLES), async (req, res) => {
  const body = req.body
  const createdAt = new Date().toISOString()
  const row = await prisma.offer.create({
    data: {
      candidateId: body.candidateId,
      requirementId: body.requirementId,
      baseSalary: body.baseSalary,
      equity: body.equity,
      bonus: body.bonus,
      status: 'DRAFT',
      letterContent: body.letterContent,
      createdBy: body.createdBy ?? req.auth!.userId,
      history: JSON.stringify([
        {
          id: crypto.randomUUID(),
          date: createdAt,
          action: 'CREATED',
          description: 'Offer draft created',
          userId: body.createdBy ?? req.auth!.userId,
        },
      ]),
    },
  })
  await logActivity({
    entityType: 'OFFER',
    entityId: row.id,
    action: 'CREATED',
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
    details: { candidateId: body.candidateId },
  })
  res.status(201).json(mapOffer(row))
})

router.patch('/:id', requireRoles(...OFFER_ROLES), async (req, res) => {
  const existing = await prisma.offer.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Not found' })

  const { status, baseSalary, equity, bonus, letterContent } = req.body
  let history = JSON.parse(existing.history || '[]')
  if (status) {
    history = [
      ...history,
      {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        action: 'STATUS_CHANGE',
        description: `Status changed from ${existing.status} to ${status}`,
        userId: req.auth!.userId,
      },
    ]
  }

  const row = await prisma.offer.update({
    where: { id: req.params.id },
    data: {
      ...(status !== undefined && { status }),
      ...(baseSalary !== undefined && { baseSalary }),
      ...(equity !== undefined && { equity }),
      ...(bonus !== undefined && { bonus }),
      ...(letterContent !== undefined && { letterContent }),
      history: JSON.stringify(history),
      updatedAt: new Date(),
    },
  })

  if (status === 'SENT') {
    const candidate = await prisma.candidate.findUnique({ where: { id: row.candidateId } })
    if (candidate?.email) {
      await sendOfferSentEmail({
        to: candidate.email,
        candidateName: candidate.name,
        baseSalary: row.baseSalary,
      })
    }
  }

  await logActivity({
    entityType: 'OFFER',
    entityId: row.id,
    action: status ? 'STATUS_CHANGED' : 'UPDATED',
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
    details: { status },
  })
  res.json(mapOffer(row))
})

router.patch('/:id/status', requireRoles(...OFFER_ROLES), async (req, res) => {
  const existing = await prisma.offer.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Not found' })

  const status = req.body.status as string
  const history = [
    ...JSON.parse(existing.history || '[]'),
    {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      action: 'STATUS_CHANGE',
      description: `Status changed to ${status}`,
      userId: req.auth!.userId,
    },
  ]

  const row = await prisma.offer.update({
    where: { id: req.params.id },
    data: { status, history: JSON.stringify(history), updatedAt: new Date() },
  })

  if (status === 'SENT') {
    const candidate = await prisma.candidate.findUnique({ where: { id: row.candidateId } })
    if (candidate?.email) {
      await sendOfferSentEmail({
        to: candidate.email,
        candidateName: candidate.name,
        baseSalary: row.baseSalary,
      })
    }
  }

  await logActivity({
    entityType: 'OFFER',
    entityId: row.id,
    action: 'STATUS_CHANGED',
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
    details: { status },
  })
  res.json(mapOffer(row))
})

router.delete('/:id', requireRoles('ADMIN'), async (req, res) => {
  const existing = await prisma.offer.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Not found' })

  await prisma.offer.delete({ where: { id: req.params.id } })

  await logActivity({
    entityType: 'OFFER',
    entityId: existing.id,
    action: 'DELETED',
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
    details: {
      candidateId: existing.candidateId,
      requirementId: existing.requirementId,
      status: existing.status,
    },
  })

  res.status(204).send()
})

export default router
