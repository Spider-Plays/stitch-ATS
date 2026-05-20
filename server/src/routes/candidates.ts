import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { mapCandidate } from '../utils/mappers.js'
import { requireAuth, requireActiveUser } from '../middleware/auth.js'
import { logActivity } from '../services/activityLog.js'

const router = Router()
router.use(requireAuth, requireActiveUser)

router.get('/', async (_req, res) => {
  const rows = await prisma.candidate.findMany({ orderBy: { appliedDate: 'desc' } })
  res.json(rows.map(mapCandidate))
})

router.get('/by-requirement/:requirementId', async (req, res) => {
  const rows = await prisma.candidate.findMany({
    where: { requirementId: req.params.requirementId },
    orderBy: { appliedDate: 'desc' },
  })
  res.json(rows.map(mapCandidate))
})

router.get('/:id', async (req, res) => {
  const row = await prisma.candidate.findUnique({ where: { id: req.params.id } })
  if (!row) return res.status(404).json({ error: 'Not found' })
  res.json(mapCandidate(row))
})

router.post('/', async (req, res) => {
  const body = req.body
  const row = await prisma.candidate.create({
    data: {
      name: body.name,
      email: body.email,
      role: body.role,
      status: body.status ?? 'APPLIED',
      matchScore: body.matchScore ?? 0,
      source: body.source ?? 'Direct',
      requirementId: body.requirementId,
      jobTitle: body.jobTitle,
      avatar: body.avatar,
      resumeUrl: body.resumeUrl,
      phone: body.phone,
      location: body.location,
      linkedIn: body.linkedIn,
      portfolio: body.portfolio,
      totalExperience: body.totalExperience,
      currentCompany: body.currentCompany,
      currentCTC: body.currentCTC,
      expectedCTC: body.expectedCTC,
      noticePeriod: body.noticePeriod,
    },
  })
  await logActivity({
    entityType: 'CANDIDATE',
    entityId: row.id,
    action: 'CREATED',
    performedBy: req.auth!.userId,
    details: { name: body.name, role: body.role },
  })
  res.status(201).json(mapCandidate(row))
})

router.patch('/:id', async (req, res) => {
  const b = req.body
  const row = await prisma.candidate.update({
    where: { id: req.params.id },
    data: {
      ...(b.name !== undefined && { name: b.name }),
      ...(b.email !== undefined && { email: b.email }),
      ...(b.role !== undefined && { role: b.role }),
      ...(b.status !== undefined && { status: b.status }),
      ...(b.matchScore !== undefined && { matchScore: b.matchScore }),
      ...(b.source !== undefined && { source: b.source }),
      ...(b.requirementId !== undefined && { requirementId: b.requirementId }),
      ...(b.jobTitle !== undefined && { jobTitle: b.jobTitle }),
      ...(b.avatar !== undefined && { avatar: b.avatar }),
      ...(b.resumeUrl !== undefined && { resumeUrl: b.resumeUrl }),
      ...(b.phone !== undefined && { phone: b.phone }),
      ...(b.location !== undefined && { location: b.location }),
      ...(b.linkedIn !== undefined && { linkedIn: b.linkedIn }),
      ...(b.portfolio !== undefined && { portfolio: b.portfolio }),
      ...(b.totalExperience !== undefined && { totalExperience: b.totalExperience }),
      ...(b.currentCompany !== undefined && { currentCompany: b.currentCompany }),
      ...(b.currentCTC !== undefined && { currentCTC: b.currentCTC }),
      ...(b.expectedCTC !== undefined && { expectedCTC: b.expectedCTC }),
      ...(b.noticePeriod !== undefined && { noticePeriod: b.noticePeriod }),
      updatedAt: new Date(),
    },
  })
  await logActivity({
    entityType: 'CANDIDATE',
    entityId: row.id,
    action: 'UPDATED',
    performedBy: req.auth!.userId,
    details: Object.keys(req.body),
  })
  res.json(mapCandidate(row))
})

router.patch('/:id/status', async (req, res) => {
  const { status } = req.body
  const row = await prisma.candidate.update({
    where: { id: req.params.id },
    data: { status, updatedAt: new Date() },
  })
  await logActivity({
    entityType: 'CANDIDATE',
    entityId: row.id,
    action: 'STATUS_CHANGED',
    performedBy: req.auth!.userId,
    details: { newStatus: status },
  })
  res.json(mapCandidate(row))
})

export default router
