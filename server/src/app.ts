import express from 'express'
import 'express-async-errors'
import cors from 'cors'
import { Prisma } from '@prisma/client'
import { env } from './config/env.js'
import { prisma } from './lib/prisma.js'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import requirementRoutes from './routes/requirements.js'
import candidateRoutes from './routes/candidates.js'
import interviewRoutes from './routes/interviews.js'
import offerRoutes from './routes/offers.js'
import feedbackRoutes from './routes/feedback.js'
import activityLogRoutes from './routes/activityLogs.js'
import searchRoutes from './routes/search.js'
import portalRoutes from './routes/portal.js'
import vendorRoutes from './routes/vendors.js'
import vendorPortalRoutes from './routes/vendorPortal.js'
import skillRoutes from './routes/skills.js'
import roleAccessRoutes from './routes/roleAccess.js'

export const app = express()

app.use(cors({ origin: env.clientOrigin, credentials: true }))
app.use(express.json())

app.get('/', (_req, res) => {
  res.json({
    service: 'Stitch ATS',
    health: '/api/health',
    hint: 'Open your Netlify site for the app UI — this URL is the API only.',
  })
})

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ ok: true, database: 'connected' })
  } catch {
    res.status(503).json({ ok: false, database: 'unavailable' })
  }
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/requirements', requirementRoutes)
app.use('/api/candidates', candidateRoutes)
app.use('/api/interviews', interviewRoutes)
app.use('/api/offers', offerRoutes)
app.use('/api/feedback', feedbackRoutes)
app.use('/api/activity-logs', activityLogRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/portal', portalRoutes)
app.use('/api/vendors', vendorRoutes)
app.use('/api/vendor-portal', vendorPortalRoutes)
app.use('/api/skills', skillRoutes)
app.use('/api/role-access', roleAccessRoutes)

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  const prismaConnCodes = new Set(['P1000', 'P1001', 'P1002', 'P1008', 'P1011', 'P1017'])
  if (
    err instanceof Prisma.PrismaClientInitializationError ||
    (err instanceof Prisma.PrismaClientKnownRequestError &&
      prismaConnCodes.has(err.code))
  ) {
    return res.status(503).json({
      error:
        'Database unavailable. Wake your Neon project in the console or check DATABASE_URL in server/.env.',
    })
  }
  if (err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large (max 5 MB)' })
  }
  if (err instanceof Error && err.message.includes('Only PDF')) {
    return res.status(400).json({ error: err.message })
  }
  if (err && typeof err === 'object' && 'issues' in err) {
    return res.status(400).json({ error: 'Validation failed' })
  }
  res.status(500).json({ error: 'Internal server error' })
})
