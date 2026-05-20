import express from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import requirementRoutes from './routes/requirements.js'
import candidateRoutes from './routes/candidates.js'
import interviewRoutes from './routes/interviews.js'
import offerRoutes from './routes/offers.js'
import feedbackRoutes from './routes/feedback.js'
import activityLogRoutes from './routes/activityLogs.js'

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

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/requirements', requirementRoutes)
app.use('/api/candidates', candidateRoutes)
app.use('/api/interviews', interviewRoutes)
app.use('/api/offers', offerRoutes)
app.use('/api/feedback', feedbackRoutes)
app.use('/api/activity-logs', activityLogRoutes)

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  if (err && typeof err === 'object' && 'issues' in err) {
    return res.status(400).json({ error: 'Validation failed' })
  }
  res.status(500).json({ error: 'Internal server error' })
})
