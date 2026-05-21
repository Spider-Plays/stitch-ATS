import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { env } from '../config/env.js'
import { mapUser } from '../utils/mappers.js'
import { getAllowedPagesForRole } from '../lib/pageAccess.js'
import { requireAuth, requireActiveUser } from '../middleware/auth.js'
import { sendPasswordResetEmail } from '../services/email.js'

const router = Router()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

router.post('/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid credentials' })

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    })
    if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }
    if (user.status === 'DISABLED') {
      return res.status(403).json({ error: 'Account disabled' })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    })

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      env.jwtSecret,
      { expiresIn: '7d' }
    )

    const allowedPages = await getAllowedPagesForRole(user.role)
    res.json({ token, user: mapUser(user), allowedPages })
  } catch (err) {
    next(err)
  }
})

router.get('/me', requireAuth, requireActiveUser, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } })
  if (!user) return res.status(404).json({ error: 'User not found' })
  const allowedPages = await getAllowedPagesForRole(user.role)
  res.json({ ...mapUser(user), allowedPages })
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
})

router.post('/change-password', requireAuth, requireActiveUser, async (req, res) => {
  const parsed = changePasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0]?.message || 'Invalid input' })
  }

  const { currentPassword, newPassword } = parsed.data
  if (currentPassword === newPassword) {
    return res.status(400).json({ error: 'New password must be different from your current password' })
  }

  const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } })
  if (!user) return res.status(404).json({ error: 'User not found' })

  const valid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!valid) return res.status(401).json({ error: 'Current password is incorrect' })

  const passwordHash = await bcrypt.hash(newPassword, 10)
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  })

  const token = jwt.sign(
    { userId: updated.id, email: updated.email, role: updated.role },
    env.jwtSecret,
    { expiresIn: '7d' }
  )

  res.json({ token, user: mapUser(updated) })
})

router.post('/forgot-password', async (req, res) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body)
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  })

  if (user && user.status === 'ACTIVE') {
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000)
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpires: expires },
    })
    const resetUrl = `${env.clientOrigin.replace(/\/$/, '')}/login?reset=${token}`
    await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl })
  }

  res.json({ ok: true, message: 'If that email exists, a reset link was sent.' })
})

router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = z
    .object({
      token: z.string().min(1),
      newPassword: z.string().min(8),
    })
    .parse(req.body)

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpires: { gt: new Date() },
    },
  })
  if (!user) return res.status(400).json({ error: 'Invalid or expired reset link' })

  const passwordHash = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  })

  res.json({ ok: true, message: 'Password updated. You can sign in now.' })
})

export default router
