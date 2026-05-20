import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { mapOffer } from '../utils/mappers.js'
import { requireAuth, requireActiveUser } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth, requireActiveUser)

router.get('/', async (_req, res) => {
  const rows = await prisma.offer.findMany({ orderBy: { createdAt: 'desc' } })
  res.json(rows.map(mapOffer))
})

router.get('/by-candidate/:candidateId', async (req, res) => {
  const rows = await prisma.offer.findMany({
    where: { candidateId: req.params.candidateId },
    orderBy: { createdAt: 'desc' },
  })
  res.json(rows.map(mapOffer))
})

router.get('/:id', async (req, res) => {
  const row = await prisma.offer.findUnique({ where: { id: req.params.id } })
  if (!row) return res.status(404).json({ error: 'Not found' })
  res.json(mapOffer(row))
})

router.post('/', async (req, res) => {
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
  res.status(201).json(mapOffer(row))
})

router.patch('/:id', async (req, res) => {
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
  res.json(mapOffer(row))
})

router.patch('/:id/status', async (req, res) => {
  const row = await prisma.offer.update({
    where: { id: req.params.id },
    data: { status: req.body.status, updatedAt: new Date() },
  })
  res.json(mapOffer(row))
})

export default router
