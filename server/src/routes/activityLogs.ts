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

export default router
