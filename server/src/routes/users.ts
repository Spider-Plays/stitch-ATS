import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { mapUser } from '../utils/mappers.js'
import { requireAuth, requireActiveUser, requireRoles } from '../middleware/auth.js'
import { generateTempPassword } from '../lib/password.js'
import { sendInviteEmail, sendAdminPasswordEmail } from '../services/email.js'
import { sanitizeFeatureTags } from '../lib/userTags.js'

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
  'VENDOR',
  'EMPLOYEE',
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
      department: z.string().max(120).optional(),
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
      department: body.department?.trim() || null,
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

router.patch('/me', async (req, res) => {
  const body = z
    .object({
      name: z.string().min(1).optional(),
      phoneNumber: z.string().optional(),
      address: z.string().optional(),
      themePreference: z.enum(['light', 'dark', 'system']).optional(),
      avatar: z.string().url().optional().or(z.literal('')),
    })
    .parse(req.body)

  const user = await prisma.user.update({
    where: { id: req.auth!.userId },
    data: {
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.phoneNumber !== undefined && { phoneNumber: body.phoneNumber || null }),
      ...(body.address !== undefined && { address: body.address || null }),
      ...(body.themePreference !== undefined && { themePreference: body.themePreference }),
      ...(body.avatar !== undefined && { avatar: body.avatar || null }),
    },
  })
  res.json(mapUser(user))
})

router.get('/:id/login-history', requireRoles('ADMIN'), async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } })
  if (!user) return res.status(404).json({ error: 'Not found' })

  const entries = await prisma.loginHistory.findMany({
    where: { userId: req.params.id },
    orderBy: { loggedInAt: 'desc' },
    take: 200,
  })

  res.json(
    entries.map((e) => ({
      id: e.id,
      userId: e.userId,
      loggedInAt: e.loggedInAt.toISOString(),
      ipAddress: e.ipAddress ?? undefined,
      userAgent: e.userAgent ?? undefined,
    }))
  )
})

router.get('/:id', requireRoles('ADMIN'), async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } })
  if (!user) return res.status(404).json({ error: 'Not found' })
  res.json(mapUser(user))
})

router.patch('/:id', requireRoles('ADMIN'), async (req, res) => {
  const body = z
    .object({
      name: z.string().min(1).optional(),
      department: z.string().max(120).optional().nullable(),
      phoneNumber: z.string().max(40).optional().nullable(),
      address: z.string().max(500).optional().nullable(),
    })
    .parse(req.body)

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: {
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.department !== undefined && {
        department: body.department?.trim() || null,
      }),
      ...(body.phoneNumber !== undefined && {
        phoneNumber: body.phoneNumber?.trim() || null,
      }),
      ...(body.address !== undefined && {
        address: body.address?.trim() || null,
      }),
    },
  })
  res.json(mapUser(user))
})

router.post('/:id/reset-password', requireRoles('ADMIN'), async (req, res) => {
  const body = z
    .object({
      newPassword: z.string().min(8).optional(),
      generateTemporary: z.boolean().optional(),
      sendEmail: z.boolean().optional().default(true),
    })
    .refine((d) => Boolean(d.newPassword || d.generateTemporary), {
      message: 'Provide newPassword or set generateTemporary to true',
    })
    .parse(req.body)

  const target = await prisma.user.findUnique({ where: { id: req.params.id } })
  if (!target) return res.status(404).json({ error: 'User not found' })

  const plainPassword = body.generateTemporary ? generateTempPassword() : body.newPassword!
  const passwordHash = await bcrypt.hash(plainPassword, 10)

  await prisma.user.update({
    where: { id: target.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  })

  let emailSent = false
  let emailWarning: string | undefined
  if (body.sendEmail) {
    const emailResult = await sendAdminPasswordEmail({
      to: target.email,
      name: target.name,
      password: plainPassword,
      setByAdmin: true,
    })
    emailSent = emailResult.sent
    if (!emailResult.sent) {
      if (emailResult.reason === 'error') {
        emailWarning = emailResult.message
      } else if (emailResult.reason === 'not_configured') {
        emailWarning = 'Email is not configured; share the password with the user manually.'
      }
    }
  }

  res.json({
    ok: true,
    emailSent,
    ...(emailWarning ? { emailWarning } : {}),
    ...(!emailSent && body.generateTemporary ? { temporaryPassword: plainPassword } : {}),
  })
})

router.patch('/:id/tags', requireRoles('ADMIN'), async (req, res) => {
  const { tags } = z.object({ tags: z.array(z.string()) }).parse(req.body)
  const sanitized = sanitizeFeatureTags(tags)
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { permissions: JSON.stringify(sanitized) },
  })
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
