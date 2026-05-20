import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { mapRequirement } from '../utils/mappers.js'
import { requireAuth, requireActiveUser } from '../middleware/auth.js'
import { logActivity } from '../services/activityLog.js'

const router = Router()
router.use(requireAuth, requireActiveUser)

router.get('/', async (_req, res) => {
  const rows = await prisma.requirement.findMany({ orderBy: { createdAt: 'desc' } })
  res.json(rows.map(mapRequirement))
})

router.get('/pending', async (_req, res) => {
  const rows = await prisma.requirement.findMany({
    where: { status: 'PENDING_APPROVAL' },
    orderBy: { createdAt: 'desc' },
  })
  res.json(rows.map(mapRequirement))
})

router.get('/:id', async (req, res) => {
  const row = await prisma.requirement.findUnique({ where: { id: req.params.id } })
  if (!row) return res.status(404).json({ error: 'Not found' })
  res.json(mapRequirement(row))
})

router.post('/', async (req, res) => {
  const body = req.body
  const timestamp = new Date()
  const row = await prisma.requirement.create({
    data: {
      title: body.title,
      department: body.department,
      hiringManager: body.hiringManager,
      status: 'PENDING_APPROVAL',
      openings: body.openings,
      filled: 0,
      priority: body.priority,
      location: body.location,
      description: body.description,
      createdBy: body.createdBy ?? req.auth!.userId,
      createdByRole: body.createdByRole ?? req.auth!.role,
      recruiters: '[]',
      approval: JSON.stringify({ decision: 'PENDING' }),
      approvalHistory: JSON.stringify([
        {
          action: 'REQUESTED',
          by: body.createdBy ?? req.auth!.userId,
          at: timestamp.toISOString(),
          role: body.createdByRole ?? req.auth!.role,
        },
      ]),
      versions: '[]',
      currentVersion: 1,
    },
  })
  await logActivity({
    entityType: 'REQUIREMENT',
    entityId: row.id,
    action: 'CREATED',
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
    details: { title: body.title },
  })
  res.status(201).json(mapRequirement(row))
})

router.patch('/:id', async (req, res) => {
  const existing = await prisma.requirement.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Not found' })

  const data = req.body
  const versions = JSON.parse(existing.versions || '[]')
  const timestamp = new Date().toISOString()
  versions.push({
    version: existing.currentVersion,
    changedBy: req.auth!.userId,
    changedAt: timestamp,
    changes: data,
  })

  const row = await prisma.requirement.update({
    where: { id: req.params.id },
    data: {
      ...pickRequirementFields(data),
      updatedAt: new Date(),
      currentVersion: existing.currentVersion + 1,
      versions: JSON.stringify(versions),
    },
  })
  await logActivity({
    entityType: 'REQUIREMENT',
    entityId: row.id,
    action: 'UPDATED',
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
    details: Object.keys(data),
  })
  res.json(mapRequirement(row))
})

router.patch('/:id/status', async (req, res) => {
  const { status } = req.body
  const row = await prisma.requirement.update({
    where: { id: req.params.id },
    data: { status, updatedAt: new Date() },
  })
  res.json(mapRequirement(row))
})

router.post('/:id/approve', async (req, res) => {
  const existing = await prisma.requirement.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Not found' })
  const timestamp = new Date().toISOString()
  const history = JSON.parse(existing.approvalHistory || '[]')
  history.push({ action: 'APPROVED', by: req.auth!.userId, at: timestamp, role: req.auth!.role })
  const row = await prisma.requirement.update({
    where: { id: req.params.id },
    data: {
      status: 'LIVE',
      approval: JSON.stringify({ decision: 'APPROVED', decidedBy: req.auth!.userId, decidedAt: timestamp }),
      approvalHistory: JSON.stringify(history),
      updatedAt: new Date(),
    },
  })
  await logActivity({ entityType: 'REQUIREMENT', entityId: row.id, action: 'APPROVED', performedBy: req.auth!.userId, performerRole: req.auth!.role })
  res.json(mapRequirement(row))
})

router.post('/:id/reject', async (req, res) => {
  const existing = await prisma.requirement.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Not found' })
  const timestamp = new Date().toISOString()
  const history = JSON.parse(existing.approvalHistory || '[]')
  history.push({ action: 'REJECTED', by: req.auth!.userId, at: timestamp, role: req.auth!.role })
  const row = await prisma.requirement.update({
    where: { id: req.params.id },
    data: {
      status: 'REJECTED',
      approval: JSON.stringify({ decision: 'REJECTED', decidedBy: req.auth!.userId, decidedAt: timestamp }),
      approvalHistory: JSON.stringify(history),
      updatedAt: new Date(),
    },
  })
  await logActivity({ entityType: 'REQUIREMENT', entityId: row.id, action: 'REJECTED', performedBy: req.auth!.userId, performerRole: req.auth!.role })
  res.json(mapRequirement(row))
})

router.post('/:id/assign-recruiter', async (req, res) => {
  const { recruiterId } = req.body
  const existing = await prisma.requirement.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Not found' })
  const recruiters: string[] = JSON.parse(existing.recruiters || '[]')
  if (recruiters.includes(recruiterId)) return res.json(mapRequirement(existing))
  recruiters.push(recruiterId)
  const row = await prisma.requirement.update({
    where: { id: req.params.id },
    data: { recruiters: JSON.stringify(recruiters), updatedAt: new Date() },
  })
  await logActivity({
    entityType: 'REQUIREMENT',
    entityId: row.id,
    action: 'RECRUITER_ASSIGNED',
    performedBy: req.auth!.userId,
    details: { recruiterId },
  })
  res.json(mapRequirement(row))
})

function pickRequirementFields(data: Record<string, unknown>) {
  const allowed = ['title', 'department', 'hiringManager', 'status', 'openings', 'filled', 'priority', 'location', 'description']
  const out: Record<string, unknown> = {}
  for (const k of allowed) {
    if (data[k] !== undefined) out[k] = data[k]
  }
  return out
}

export default router
