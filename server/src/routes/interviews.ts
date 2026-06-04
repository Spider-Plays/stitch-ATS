import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { mapInterview } from '../utils/mappers.js'
import { requireAuth, requireActiveUser, requireRoles } from '../middleware/auth.js'
import { logActivity, logCandidateInterviewActivity } from '../services/activityLog.js'
import { INTERNAL_ROLES, INTERVIEW_SCHEDULERS } from '../lib/roles.js'
import { sendInterviewScheduledEmail, sendInterviewUpdatedEmail } from '../services/email.js'
import {
  assertCanScheduleStage,
  assertCandidateInInterviewStage,
  assertInterviewerIdsAllowedForStage,
  ensureInterviewPlan,
  ScheduleStageError,
} from '../lib/interviewPlan.js'
import {
  assertCanViewCandidate,
  buildInterviewListWhere,
  CandidateAccessError,
} from '../lib/candidateAccess.js'
import { findResumeFile } from '../lib/resumeStorage.js'
import fs from 'fs/promises'

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

  const stageIds = [...new Set(normalized.map((r) => r.planStageId).filter(Boolean))] as string[]

  const [candidates, feedbackRows, planStages] = await Promise.all([
    prisma.candidate.findMany({
      where: { id: { in: candidateIds } },
      select: {
        id: true,
        name: true,
        role: true,
        email: true,
        resumeUrl: true,
        resumeFileName: true,
      },
    }),
    interviewIds.length > 0
      ? prisma.feedback.findMany({
          where: { interviewId: { in: interviewIds } },
          orderBy: { createdAt: 'desc' },
        })
      : Promise.resolve([]),
    stageIds.length > 0
      ? prisma.interviewPlanStage.findMany({ where: { id: { in: stageIds } } })
      : Promise.resolve([]),
  ])

  const candidateById = new Map(candidates.map((c) => [c.id, c]))
  const stageById = new Map(planStages.map((s) => [s.id, s]))
  const latestFeedbackByInterview = new Map<string, (typeof feedbackRows)[0]>()
  for (const fb of feedbackRows) {
    if (!latestFeedbackByInterview.has(fb.interviewId)) {
      latestFeedbackByInterview.set(fb.interviewId, fb)
    }
  }

  return normalized.map((row) => {
    const c = candidateById.get(row.candidateId)
    const fb = latestFeedbackByInterview.get(row.id)
    const stage = row.planStageId ? stageById.get(row.planStageId) : undefined
    return {
      ...mapInterview(row),
      stageName: stage?.name,
      stageOrder: stage?.order,
      candidateName: c?.name,
      candidateRole: c?.role,
      candidateEmail: c?.email,
      candidateHasResume: !!(c?.resumeUrl || c?.resumeFileName),
      hasFeedback: !!fb,
      feedbackRecommendation: fb?.recommendation,
    }
  })
}

router.get('/', async (req, res) => {
  const listWhere = await buildInterviewListWhere(req.auth!)
  const rows = await prisma.interview.findMany({
    where: listWhere,
    orderBy: { scheduledAt: 'desc' },
  })
  res.json(await enrichInterviews(rows))
})

router.get('/by-candidate/:candidateId', async (req, res) => {
  try {
    await assertCanViewCandidate(req.auth!, req.params.candidateId)
  } catch (err) {
    if (err instanceof CandidateAccessError) {
      return res.status(403).json({ error: err.message })
    }
    throw err
  }
  const rows = await prisma.interview.findMany({
    where: { candidateId: req.params.candidateId },
    orderBy: { scheduledAt: 'desc' },
  })
  res.json(await enrichInterviews(rows))
})

router.get('/:id/candidate-resume', async (req, res) => {
  try {
    const interview = await prisma.interview.findUnique({ where: { id: req.params.id } })
    if (!interview) return res.status(404).json({ error: 'Interview not found' })

    await assertCanViewCandidate(req.auth!, interview.candidateId)

    const row = await prisma.candidate.findUnique({ where: { id: interview.candidateId } })
    if (!row) return res.status(404).json({ error: 'Candidate not found' })
    if (!row.resumeFileName) return res.status(404).json({ error: 'No resume uploaded' })

    const stored = await findResumeFile(row.id)
    if (!stored) return res.status(404).json({ error: 'Resume file missing' })

    const buffer = await fs.readFile(stored.filePath)
    res.setHeader('Content-Type', row.resumeMimeType || stored.mime)
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(row.resumeFileName)}"`
    )
    res.send(buffer)
  } catch (err) {
    if (err instanceof CandidateAccessError) {
      return res.status(403).json({ error: err.message })
    }
    console.error('Interview candidate resume failed:', err)
    res.status(500).json({ error: 'Failed to load resume' })
  }
})

router.get('/:id', async (req, res) => {
  const row = await prisma.interview.findUnique({ where: { id: req.params.id } })
  if (!row) return res.status(404).json({ error: 'Not found' })
  try {
    await assertCanViewCandidate(req.auth!, row.candidateId)
  } catch (err) {
    if (err instanceof CandidateAccessError) {
      return res.status(403).json({ error: err.message })
    }
    throw err
  }
  const [enriched] = await enrichInterviews([row])
  res.json(enriched)
})

router.post('/', requireRoles(...INTERVIEW_SCHEDULERS), async (req, res) => {
  const body = req.body
  const planStageId = typeof body.planStageId === 'string' ? body.planStageId : ''
  if (!planStageId) {
    return res.status(400).json({ error: 'Interview stage is required' })
  }

  try {
    const { stage } = await assertCanScheduleStage(
      body.requirementId,
      body.candidateId,
      planStageId
    )
    const interviewerIds = Array.isArray(body.interviewerIds) ? body.interviewerIds : []
    if (interviewerIds.length === 0) {
      return res.status(400).json({ error: 'Select at least one interviewer' })
    }
    await assertInterviewerIdsAllowedForStage(stage.order, interviewerIds, stage.name)

    const interviewType = body.type ?? stage.interviewType

    const row = await prisma.interview.create({
      data: {
        candidateId: body.candidateId,
        requirementId: body.requirementId,
        planStageId,
        scheduledAt: new Date(body.scheduledAt),
        interviewerIds: JSON.stringify(interviewerIds),
        type: interviewType,
        status: body.status ?? 'SCHEDULED',
        meetingLink: body.meetingLink,
        duration: body.duration ?? stage.defaultDuration,
        location: body.location,
        description: body.description,
      },
    })

    await sendScheduledAndRespond(res, row, body, req)
  } catch (err) {
    if (err instanceof ScheduleStageError) {
      return res.status(err.statusCode).json({ error: err.message })
    }
    throw err
  }
})

async function sendScheduledAndRespond(
  res: import('express').Response,
  row: Awaited<ReturnType<typeof prisma.interview.create>>,
  body: Record<string, unknown>,
  req: import('express').Request & { auth?: { userId: string; role: string } }
) {

  const candidate = await prisma.candidate.findUnique({
    where: { id: String(body.candidateId) },
  })
  if (candidate?.email) {
    await sendInterviewScheduledEmail({
      to: candidate.email,
      candidateName: candidate.name,
      type: row.type,
      scheduledAt: row.scheduledAt.toLocaleString(),
      meetingLink: row.meetingLink ?? undefined,
    })
  }

  const stage = row.planStageId
    ? await prisma.interviewPlanStage.findUnique({ where: { id: row.planStageId } })
    : null

  await logActivity({
    entityType: 'INTERVIEW',
    entityId: row.id,
    action: 'SCHEDULED',
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
    details: { candidateId: body.candidateId, type: row.type, planStageId: row.planStageId },
  })

  await logCandidateInterviewActivity({
    candidateId: String(body.candidateId),
    interviewId: row.id,
    action: 'INTERVIEW_SCHEDULED',
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
    details: {
      stageName: stage?.name ?? row.type.replace(/_/g, ' '),
      scheduledAt: row.scheduledAt.toISOString(),
      type: row.type,
    },
  })

  const [enriched] = await enrichInterviews([row])
  res.status(201).json(enriched)
}

router.patch('/:id', requireRoles(...INTERVIEW_SCHEDULERS), async (req, res) => {
  const existing = await prisma.interview.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Not found' })

  const feedbackCount = await prisma.feedback.count({ where: { interviewId: req.params.id } })
  if (feedbackCount > 0) {
    return res.status(403).json({ error: 'Interview cannot be edited after feedback has been submitted' })
  }

  const body = req.body

  const nextCandidateId = body.candidateId ?? existing.candidateId
  const nextRequirementId = body.requirementId ?? existing.requirementId
  const nextPlanStageId = body.planStageId ?? existing.planStageId

  if (nextPlanStageId && (nextPlanStageId !== existing.planStageId || nextCandidateId !== existing.candidateId)) {
    try {
      await assertCanScheduleStage(
        nextRequirementId,
        nextCandidateId,
        nextPlanStageId,
        req.params.id
      )
    } catch (err) {
      if (err instanceof ScheduleStageError) {
        return res.status(err.statusCode).json({ error: err.message })
      }
      throw err
    }
  } else if (!nextPlanStageId && existing.planStageId) {
    return res.status(400).json({ error: 'Interview stage is required' })
  }

  try {
    await assertCandidateInInterviewStage(nextCandidateId)
  } catch (err) {
    if (err instanceof ScheduleStageError) {
      return res.status(err.statusCode).json({ error: err.message })
    }
    throw err
  }

  const stageForPanel = nextPlanStageId
    ? await prisma.interviewPlanStage.findUnique({ where: { id: nextPlanStageId } })
    : null

  if (body.interviewerIds !== undefined && stageForPanel) {
    const interviewerIds = Array.isArray(body.interviewerIds) ? body.interviewerIds : []
    if (interviewerIds.length === 0) {
      return res.status(400).json({ error: 'Select at least one interviewer' })
    }
    try {
      await assertInterviewerIdsAllowedForStage(
        stageForPanel.order,
        interviewerIds,
        stageForPanel.name
      )
    } catch (err) {
      if (err instanceof ScheduleStageError) {
        return res.status(err.statusCode).json({ error: err.message })
      }
      throw err
    }
  }

  const data: Record<string, unknown> = {}

  if (body.candidateId !== undefined) data.candidateId = body.candidateId
  if (body.requirementId !== undefined) data.requirementId = body.requirementId
  if (body.planStageId !== undefined) data.planStageId = body.planStageId
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

  const stage = row.planStageId
    ? await prisma.interviewPlanStage.findUnique({ where: { id: row.planStageId } })
    : null

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

  await logCandidateInterviewActivity({
    candidateId: row.candidateId,
    interviewId: row.id,
    action: rescheduled ? 'INTERVIEW_RESCHEDULED' : 'INTERVIEW_UPDATED',
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
    details: {
      stageName: stage?.name,
      scheduledAt: row.scheduledAt.toISOString(),
      type: row.type,
    },
  })

  const [enriched] = await enrichInterviews([row])
  res.json(enriched)
})

router.patch('/:id/status', requireRoles(...INTERVIEW_SCHEDULERS), async (req, res) => {
  const existing = await prisma.interview.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Not found' })

  const row = await prisma.interview.update({
    where: { id: req.params.id },
    data: { status: req.body.status },
  })

  const stage = row.planStageId
    ? await prisma.interviewPlanStage.findUnique({ where: { id: row.planStageId } })
    : null

  await logActivity({
    entityType: 'INTERVIEW',
    entityId: row.id,
    action: 'STATUS_CHANGED',
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
    details: { status: req.body.status },
  })

  const status = String(req.body.status ?? '')
  if (status === 'CANCELLED') {
    await logCandidateInterviewActivity({
      candidateId: row.candidateId,
      interviewId: row.id,
      action: 'INTERVIEW_CANCELLED',
      performedBy: req.auth!.userId,
      performerRole: req.auth!.role,
      details: {
        stageName: stage?.name,
        scheduledAt: row.scheduledAt.toISOString(),
        type: row.type,
      },
    })
  }
  const [enriched] = await enrichInterviews([row])
  res.json(enriched)
})

router.delete('/:id', requireRoles('ADMIN'), async (req, res) => {
  await prisma.interview.delete({ where: { id: req.params.id } })
  res.status(204).send()
})

export default router
