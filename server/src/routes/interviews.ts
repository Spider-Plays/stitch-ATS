import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { mapInterview } from '../utils/mappers.js'
import { requireAuth, requireActiveUser, requireRoles } from '../middleware/auth.js'
import { logActivity } from '../services/activityLog.js'
import { INTERNAL_ROLES, INTERVIEW_SCHEDULERS } from '../lib/roles.js'
import { sendInterviewScheduledEmail, sendInterviewUpdatedEmail } from '../services/email.js'

const router = Router()
router.use(requireAuth, requireActiveUser, requireRoles(...INTERNAL_ROLES))

function interviewEndTime(scheduledAt: Date, durationMinutes: number | null): Date {
  const end = new Date(scheduledAt)
  end.setMinutes(end.getMinutes() + (durationMinutes ?? 60))
  return end
}

async function markPastScheduledAsCompleted(
  rows: Awaited<ReturnType<typeof prisma.interview.findMany>>
) {
  const now = new Date()
  const toComplete = rows.filter(
    (r) =>
      r.status === 'SCHEDULED' && interviewEndTime(r.scheduledAt, r.duration) <= now
  )
  if (toComplete.length === 0) return rows

  await prisma.interview.updateMany({
    where: { id: { in: toComplete.map((r) => r.id) } },
    data: { status: 'COMPLETED' },
  })

  const completedIds = new Set(toComplete.map((r) => r.id))
  return rows.map((r) =>
    completedIds.has(r.id) ? { ...r, status: 'COMPLETED' } : r
  )
}

async function enrichInterviews(rows: Awaited<ReturnType<typeof prisma.interview.findMany>>) {
  const normalized = await markPastScheduledAsCompleted(rows)
  const interviewIds = normalized.map((r) => r.id)
  const candidateIds = [...new Set(normalized.map((r) => r.candidateId))]

  const [candidates, feedbackRows] = await Promise.all([
    prisma.candidate.findMany({
      where: { id: { in: candidateIds } },
      select: { id: true, name: true, role: true, email: true },
    }),
    interviewIds.length > 0
      ? prisma.feedback.findMany({
          where: { interviewId: { in: interviewIds } },
          orderBy: { createdAt: 'desc' },
        })
      : Promise.resolve([]),
  ])

  const candidateById = new Map(candidates.map((c) => [c.id, c]))
  const latestFeedbackByInterview = new Map<string, (typeof feedbackRows)[0]>()
  for (const fb of feedbackRows) {
    if (!latestFeedbackByInterview.has(fb.interviewId)) {
      latestFeedbackByInterview.set(fb.interviewId, fb)
    }
  }

  return normalized.map((row) => {
    const c = candidateById.get(row.candidateId)
    const fb = latestFeedbackByInterview.get(row.id)
    return {
      ...mapInterview(row),
      candidateName: c?.name,
      candidateRole: c?.role,
      candidateEmail: c?.email,
      hasFeedback: !!fb,
      feedbackRecommendation: fb?.recommendation,
    }
  })
}

router.get('/', async (_req, res) => {
  const rows = await prisma.interview.findMany({ orderBy: { scheduledAt: 'desc' } })
  res.json(await enrichInterviews(rows))
})

router.get('/by-candidate/:candidateId', async (req, res) => {
  const rows = await prisma.interview.findMany({
    where: { candidateId: req.params.candidateId },
    orderBy: { scheduledAt: 'desc' },
  })
  res.json(await enrichInterviews(rows))
})

router.get('/:id', async (req, res) => {
  const row = await prisma.interview.findUnique({ where: { id: req.params.id } })
  if (!row) return res.status(404).json({ error: 'Not found' })
  const [enriched] = await enrichInterviews([row])
  res.json(enriched)
})

router.post('/', requireRoles(...INTERVIEW_SCHEDULERS), async (req, res) => {
  const body = req.body
  const row = await prisma.interview.create({
    data: {
      candidateId: body.candidateId,
      requirementId: body.requirementId,
      scheduledAt: new Date(body.scheduledAt),
      interviewerIds: JSON.stringify(body.interviewerIds ?? []),
      type: body.type,
      status: body.status ?? 'SCHEDULED',
      meetingLink: body.meetingLink,
      duration: body.duration,
      location: body.location,
      description: body.description,
    },
  })

  const candidate = await prisma.candidate.findUnique({ where: { id: body.candidateId } })
  if (candidate?.email) {
    await sendInterviewScheduledEmail({
      to: candidate.email,
      candidateName: candidate.name,
      type: row.type,
      scheduledAt: row.scheduledAt.toLocaleString(),
      meetingLink: row.meetingLink ?? undefined,
    })
  }

  await logActivity({
    entityType: 'INTERVIEW',
    entityId: row.id,
    action: 'SCHEDULED',
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
    details: { candidateId: body.candidateId, type: body.type },
  })

  const [enriched] = await enrichInterviews([row])
  res.status(201).json(enriched)
})

router.patch('/:id', requireRoles(...INTERVIEW_SCHEDULERS), async (req, res) => {
  const existing = await prisma.interview.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Not found' })

  const feedbackCount = await prisma.feedback.count({ where: { interviewId: req.params.id } })
  if (feedbackCount > 0) {
    return res.status(403).json({ error: 'Interview cannot be edited after feedback has been submitted' })
  }

  const body = req.body
  const data: Record<string, unknown> = {}

  if (body.candidateId !== undefined) data.candidateId = body.candidateId
  if (body.requirementId !== undefined) data.requirementId = body.requirementId
  if (body.scheduledAt !== undefined) data.scheduledAt = new Date(body.scheduledAt)
  if (body.interviewerIds !== undefined) {
    data.interviewerIds = JSON.stringify(body.interviewerIds)
  }
  if (body.type !== undefined) data.type = body.type
  if (body.status !== undefined) data.status = body.status
  if (body.meetingLink !== undefined) data.meetingLink = body.meetingLink || null
  if (body.duration !== undefined) data.duration = body.duration
  if (body.location !== undefined) data.location = body.location || null
  if (body.description !== undefined) data.description = body.description || null

  const row = await prisma.interview.update({ where: { id: req.params.id }, data })

  const rescheduled =
    body.scheduledAt !== undefined &&
    new Date(body.scheduledAt).getTime() !== existing.scheduledAt.getTime()

  const candidate = await prisma.candidate.findUnique({ where: { id: row.candidateId } })
  if (candidate?.email && (rescheduled || body.meetingLink !== undefined || body.type !== undefined)) {
    await sendInterviewUpdatedEmail({
      to: candidate.email,
      candidateName: candidate.name,
      type: row.type,
      scheduledAt: row.scheduledAt.toLocaleString(),
      meetingLink: row.meetingLink ?? undefined,
      rescheduled,
    })
  }

  await logActivity({
    entityType: 'INTERVIEW',
    entityId: row.id,
    action: rescheduled ? 'RESCHEDULED' : 'UPDATED',
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
    details: rescheduled
      ? { scheduledAt: row.scheduledAt.toISOString() }
      : undefined,
  })

  const [enriched] = await enrichInterviews([row])
  res.json(enriched)
})

router.patch('/:id/status', requireRoles(...INTERVIEW_SCHEDULERS), async (req, res) => {
  const row = await prisma.interview.update({
    where: { id: req.params.id },
    data: { status: req.body.status },
  })
  await logActivity({
    entityType: 'INTERVIEW',
    entityId: row.id,
    action: 'STATUS_CHANGED',
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
    details: { status: req.body.status },
  })
  const [enriched] = await enrichInterviews([row])
  res.json(enriched)
})

router.delete('/:id', requireRoles('ADMIN'), async (req, res) => {
  await prisma.interview.delete({ where: { id: req.params.id } })
  res.status(204).send()
})

export default router
