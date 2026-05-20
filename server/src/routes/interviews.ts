import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { mapInterview } from '../utils/mappers.js'
import { requireAuth, requireActiveUser } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth, requireActiveUser)

router.get('/', async (_req, res) => {
  const rows = await prisma.interview.findMany({ orderBy: { scheduledAt: 'desc' } })
  res.json(rows.map(mapInterview))
})

router.get('/by-candidate/:candidateId', async (req, res) => {
  const rows = await prisma.interview.findMany({
    where: { candidateId: req.params.candidateId },
    orderBy: { scheduledAt: 'desc' },
  })
  res.json(rows.map(mapInterview))
})

router.get('/:id', async (req, res) => {
  const row = await prisma.interview.findUnique({ where: { id: req.params.id } })
  if (!row) return res.status(404).json({ error: 'Not found' })
  res.json(mapInterview(row))
})

router.post('/', async (req, res) => {
  const body = req.body
  const row = await prisma.interview.create({
    data: {
      candidateId: body.candidateId,
      requirementId: body.requirementId,
      scheduledAt: new Date(body.scheduledAt),
      interviewerIds: JSON.stringify(body.interviewerIds ?? []),
      type: body.type,
      status: body.status ?? 'SCHEDULED',
      meetingLink: body.meetingLink,
      duration: body.duration,
      location: body.location,
      description: body.description,
    },
  })
  res.status(201).json(mapInterview(row))
})

router.patch('/:id', async (req, res) => {
  const body = req.body
  const data: Record<string, unknown> = { ...body }
  if (body.scheduledAt) data.scheduledAt = new Date(body.scheduledAt)
  if (body.interviewerIds) data.interviewerIds = JSON.stringify(body.interviewerIds)
  const row = await prisma.interview.update({ where: { id: req.params.id }, data })
  res.json(mapInterview(row))
})

router.patch('/:id/status', async (req, res) => {
  const row = await prisma.interview.update({
    where: { id: req.params.id },
    data: { status: req.body.status },
  })
  res.json(mapInterview(row))
})

export default router
