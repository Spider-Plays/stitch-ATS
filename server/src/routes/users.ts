import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { mapUser } from '../utils/mappers.js'
import { requireAuth, requireActiveUser, requireRoles } from '../middleware/auth.js'
import { generateTempPassword } from '../lib/password.js'
import { sendInviteEmail } from '../services/email.js'

const router = Router()
router.use(requireAuth, requireActiveUser)

const inviteRoles = [
  'ADMIN',
  'HR_HEAD',
  'HR_MANAGER',
  'RECRUITER',
  'TEAM_LEAD',
  'HIRING_MANAGER',
  'INTERVIEWER',
  'CANDIDATE',
] as const

router.get(
  '/',
  requireRoles('ADMIN', 'HR_HEAD', 'HR_MANAGER', 'RECRUITER', 'TEAM_LEAD', 'HIRING_MANAGER', 'INTERVIEWER'),
  async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } })
  res.json(users.map(mapUser))
})

router.post('/invite', requireRoles('ADMIN'), async (req, res) => {
  const body = z
    .object({
      email: z.string().email(),
      name: z.string().min(1).optional(),
      role: z.enum(inviteRoles),
    })
    .parse(req.body)

  const email = body.email.toLowerCase()
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return res.status(409).json({ error: 'A user with this email already exists' })

  const tempPassword = generateTempPassword()
  const passwordHash = await bcrypt.hash(tempPassword, 10)
  const name = body.name?.trim() || email.split('@')[0]

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role: body.role,
      status: 'ACTIVE',
      permissions: '[]',
      themePreference: 'system',
      authProvider: 'local',
    },
  })

  const emailResult = await sendInviteEmail({
    to: email,
    name,
    role: body.role,
    tempPassword,
  })

  if (!emailResult.sent && emailResult.reason === 'error') {
    await prisma.user.delete({ where: { id: user.id } })
    return res.status(502).json({ error: `Invite email failed: ${emailResult.message}` })
  }

  res.status(201).json({
    user: mapUser(user),
    emailSent: emailResult.sent,
    ...(emailResult.sent === false && emailResult.reason === 'not_configured'
      ? { temporaryPassword: tempPassword }
      : {}),
  })
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
