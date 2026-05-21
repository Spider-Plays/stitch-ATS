import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { mapActivityLog } from '../utils/mappers.js'
import { requireAuth, requireActiveUser } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth, requireActiveUser)

router.get('/', async (req, res) => {
  const limit = Number(req.query.limit) || 100
  const rows = await prisma.activityLog.findMany({
    orderBy: { timestamp: 'desc' },
    take: limit,
  })
  res.json(rows.map(mapActivityLog))
})

router.get('/entity/:entityId', async (req, res) => {
  const limit = Number(req.query.limit) || 50
  const rows = await prisma.activityLog.findMany({
    where: { entityId: req.params.entityId },
    orderBy: { timestamp: 'desc' },
    take: limit,
  })
  res.json(rows.map(mapActivityLog))
})

router.post('/', async (req, res) => {
  const body = req.body as {
    entityType: string
    entityId: string
    action: string
    details?: unknown
  }
  if (!body.entityType || !body.entityId || !body.action) {
    return res.status(400).json({ error: 'entityType, entityId, and action are required' })
  }
  const { logActivity } = await import('../services/activityLog.js')
  await logActivity({
    entityType: body.entityType,
    entityId: body.entityId,
    action: body.action,
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
    details: body.details,
  })
  res.status(201).json({ ok: true })
})

export default router
