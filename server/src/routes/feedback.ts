import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { mapFeedback } from '../utils/mappers.js'
import { requireAuth, requireActiveUser, requireRoles } from '../middleware/auth.js'
import { logActivity, logCandidateInterviewActivity } from '../services/activityLog.js'
import { INTERNAL_ROLES } from '../lib/roles.js'
import {
  assertCanViewCandidate,
  CandidateAccessError,
} from '../lib/candidateAccess.js'
import { buildFeedbackReportHtml } from '../lib/feedbackReport.js'

const router = Router()
router.use(requireAuth, requireActiveUser, requireRoles(...INTERNAL_ROLES))

const VALID_RECOMMENDATIONS = [
  'STRONG_HIRE',
  'HIRE',
  'ON_HOLD',
  'NO_HIRE',
  'STRONG_NO_HIRE',
] as const

router.get('/by-interview/:interviewId', async (req, res) => {
  const rows = await prisma.feedback.findMany({
    where: { interviewId: req.params.interviewId },
    orderBy: { createdAt: 'desc' },
  })
  const userIds = [...new Set(rows.map((r) => r.interviewerId))]
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  })
  const names = new Map(users.map((u) => [u.id, u.name]))
  res.json(
    rows.map((r) => ({
      ...mapFeedback(r),
      interviewerName: names.get(r.interviewerId),
    }))
  )
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
  const rows = await prisma.feedback.findMany({
    where: { candidateId: req.params.candidateId },
    orderBy: { createdAt: 'desc' },
  })
  res.json(rows.map(mapFeedback))
})

router.get('/:id/download', async (req, res) => {
  const feedback = await prisma.feedback.findUnique({ where: { id: req.params.id } })
  if (!feedback) return res.status(404).json({ error: 'Not found' })

  try {
    await assertCanViewCandidate(req.auth!, feedback.candidateId)
  } catch (err) {
    if (err instanceof CandidateAccessError) {
      return res.status(403).json({ error: err.message })
    }
    throw err
  }

  const [interview, candidate, interviewer] = await Promise.all([
    prisma.interview.findUnique({ where: { id: feedback.interviewId } }),
    prisma.candidate.findUnique({ where: { id: feedback.candidateId } }),
    prisma.user.findUnique({ where: { id: feedback.interviewerId } }),
  ])

  const html = buildFeedbackReportHtml(feedback, {
    candidateName: candidate?.name ?? 'Unknown',
    candidateRole: candidate?.role,
    interviewType: interview?.type ?? 'Interview',
    interviewDate: interview
      ? new Date(interview.scheduledAt).toLocaleString()
      : new Date(feedback.createdAt).toLocaleString(),
    interviewerName: interviewer?.name ?? 'Interviewer',
    jobTitle: candidate?.jobTitle ?? candidate?.role,
  })

  const safeName = (candidate?.name ?? 'feedback').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_')
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="Interview_Feedback_${safeName}.html"`
  )
  res.send(html)
})

router.get('/:id', async (req, res) => {
  const row = await prisma.feedback.findUnique({ where: { id: req.params.id } })
  if (!row) return res.status(404).json({ error: 'Not found' })
  try {
    await assertCanViewCandidate(req.auth!, row.candidateId)
  } catch (err) {
    if (err instanceof CandidateAccessError) {
      return res.status(403).json({ error: err.message })
    }
    throw err
  }
  const interviewer = await prisma.user.findUnique({ where: { id: row.interviewerId } })
  res.json({
    ...mapFeedback(row),
    interviewerName: interviewer?.name,
  })
})

router.post('/', async (req, res) => {
  const body = req.body
  const recommendation = VALID_RECOMMENDATIONS.includes(body.recommendation)
    ? body.recommendation
    : 'HIRE'

  const formData =
    typeof body.formData === 'string'
      ? body.formData
      : JSON.stringify(body.formData ?? {})

  const row = await prisma.feedback.create({
    data: {
      interviewId: body.interviewId,
      interviewerId: body.interviewerId ?? req.auth!.userId,
      candidateId: body.candidateId,
      rating: Number(body.rating) || 0,
      technicalRating: body.technicalRating != null ? Number(body.technicalRating) : null,
      communicationRating:
        body.communicationRating != null ? Number(body.communicationRating) : null,
      comments: String(body.comments ?? ''),
      recommendation,
      formData,
    },
  })

  const interview = await prisma.interview.findUnique({ where: { id: body.interviewId } })
  if (interview && interview.status === 'SCHEDULED') {
    await prisma.interview.update({
      where: { id: body.interviewId },
      data: { status: 'COMPLETED' },
    })
  }

  await logActivity({
    entityType: 'INTERVIEW',
    entityId: body.interviewId,
    action: 'FEEDBACK_SUBMITTED',
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
    details: { rating: row.rating, recommendation: row.recommendation },
  })

  const interviewer = await prisma.user.findUnique({ where: { id: row.interviewerId } })
  res.status(201).json({
    ...mapFeedback(row),
    interviewerName: interviewer?.name,
  })
})

router.delete('/:id', requireRoles('ADMIN'), async (req, res) => {
  const row = await prisma.feedback.findUnique({ where: { id: req.params.id } })
  if (!row) return res.status(404).json({ error: 'Feedback not found' })

  const interview = await prisma.interview.findUnique({ where: { id: row.interviewId } })
  const stage = interview?.planStageId
    ? await prisma.interviewPlanStage.findUnique({ where: { id: interview.planStageId } })
    : null

  await prisma.feedback.delete({ where: { id: row.id } })

  const remaining = await prisma.feedback.count({ where: { interviewId: row.interviewId } })
  if (remaining === 0 && interview?.status === 'COMPLETED') {
    await prisma.interview.update({
      where: { id: row.interviewId },
      data: { status: 'SCHEDULED' },
    })
  }

  await logActivity({
    entityType: 'INTERVIEW',
    entityId: row.interviewId,
    action: 'FEEDBACK_DELETED',
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
    details: { feedbackId: row.id, recommendation: row.recommendation },
  })

  await logCandidateInterviewActivity({
    candidateId: row.candidateId,
    interviewId: row.interviewId,
    action: 'INTERVIEW_FEEDBACK_DELETED',
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
    details: {
      stageName: stage?.name,
      recommendation: row.recommendation,
    },
  })

  res.status(204).send()
})

export default router
