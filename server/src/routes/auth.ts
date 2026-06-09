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
import { authRateLimiter } from '../middleware/rateLimit.js'
import { sendPasswordResetEmail } from '../services/email.js'
import { recordUserLogin } from '../lib/recordLogin.js'

const router = Router()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const registerCandidateSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

router.post('/register-candidate', authRateLimiter, async (req, res, next) => {
  try {
    const parsed = registerCandidateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.errors[0]?.message || 'Invalid registration data',
      })
    }

    const email = parsed.data.email.toLowerCase()
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' })
    }

    const name = `${parsed.data.firstName.trim()} ${parsed.data.lastName.trim()}`.trim()
    const passwordHash = await bcrypt.hash(parsed.data.password, 10)
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: 'CANDIDATE',
        status: 'ACTIVE',
        department: 'Candidate',
      },
    })

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      env.jwtSecret,
      { expiresIn: '7d' }
    )

    const allowedPages = await getAllowedPagesForRole(user.role)
    res.status(201).json({ token, user: mapUser(user), allowedPages })
  } catch (err) {
    next(err)
  }
})

router.post('/login', authRateLimiter, async (req, res, next) => {
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

    await recordUserLogin(user.id, req)

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
    data: {
      passwordHash,
      mustChangePassword: false,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  })

  const token = jwt.sign(
    { userId: updated.id, email: updated.email, role: updated.role },
    env.jwtSecret,
    { expiresIn: '7d' }
  )

  const allowedPages = await getAllowedPagesForRole(updated.role)
  res.json({ token, user: mapUser(updated), allowedPages })
})

router.post('/forgot-password', authRateLimiter, async (req, res) => {
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
    const loginPath =
      user.role === 'CANDIDATE' ? '/portal/login' : '/login'
    const resetUrl = `${env.clientOrigin.replace(/\/$/, '')}${loginPath}?reset=${token}`
    await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl })
  }

  res.json({ ok: true, message: 'If that email exists, a reset link was sent.' })
})

router.post('/reset-password', authRateLimiter, async (req, res) => {
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
      mustChangePassword: false,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  })

  res.json({ ok: true, message: 'Password updated. You can sign in now.' })
})

export default router
