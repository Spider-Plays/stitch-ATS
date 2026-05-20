import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { env } from '../config/env.js'
import { mapUser } from '../utils/mappers.js'
import { requireAuth, requireActiveUser } from '../middleware/auth.js'

const router = Router()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

router.post('/login', async (req, res) => {
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

  res.json({ token, user: mapUser(user) })
})

router.get('/me', requireAuth, requireActiveUser, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } })
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json(mapUser(user))
})

export default router
