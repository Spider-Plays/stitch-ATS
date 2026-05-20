import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { mapUser } from '../utils/mappers.js'
import { requireAuth, requireActiveUser, requireRoles } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth, requireActiveUser)

router.get(
  '/',
  requireRoles('ADMIN', 'HR_HEAD', 'HR_MANAGER', 'RECRUITER', 'TEAM_LEAD', 'HIRING_MANAGER', 'INTERVIEWER'),
  async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } })
  res.json(users.map(mapUser))
})

router.get('/:id', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } })
  if (!user) return res.status(404).json({ error: 'Not found' })
  res.json(mapUser(user))
})

router.patch('/:id/role', requireRoles('ADMIN'), async (req, res) => {
  const { role } = z.object({ role: z.string() }).parse(req.body)
  if (req.params.id === req.auth!.userId) {
    return res.status(400).json({ error: 'Cannot change your own role' })
  }
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { role },
  })
  res.json(mapUser(user))
})

router.patch('/:id/status', requireRoles('ADMIN'), async (req, res) => {
  const { status } = z.object({ status: z.enum(['ACTIVE', 'DISABLED']) }).parse(req.body)
  if (req.params.id === req.auth!.userId) {
    return res.status(400).json({ error: 'Cannot change your own status' })
  }
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { status },
  })
  res.json(mapUser(user))
})

export default router
