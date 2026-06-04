import { prisma } from './prisma.js'
import {
  getAllowedInterviewerIdsForPlanStageOrder,
  getPanelInterviewerIdsByOrder,
  isAdditionalPlanStageOrder,
  panelRestrictionLabel,
} from './interviewPanelCatalog.js'

export const DEFAULT_INTERVIEW_STAGES = [
  { name: 'L1 Interview', interviewType: 'TECHNICAL', defaultDuration: 60 },
  { name: 'L2 Interview', interviewType: 'TECHNICAL', defaultDuration: 60 },
  { name: 'HR Interview', interviewType: 'CULTURAL', defaultDuration: 45 },
] as const

const FAIL_RECOMMENDATIONS = new Set(['NO_HIRE', 'STRONG_NO_HIRE'])

export type StageProgressStatus =
  | 'locked'
  | 'available'
  | 'scheduled'
  | 'awaiting_feedback'
  | 'completed'
  | 'failed'

export function interviewEndTime(scheduledAt: Date, durationMinutes: number | null): Date {
  const end = new Date(scheduledAt)
  end.setMinutes(end.getMinutes() + (durationMinutes ?? 60))
  return end
}

export function isInterviewPastEnd(
  scheduledAt: Date,
  durationMinutes: number | null,
  now = new Date()
): boolean {
  return interviewEndTime(scheduledAt, durationMinutes) <= now
}

export async function ensureInterviewPlan(requirementId: string) {
  const existing = await prisma.interviewPlan.findUnique({
    where: { requirementId },
    include: { stages: { orderBy: { order: 'asc' } } },
  })
  if (existing) return existing

  const stagesData = await Promise.all(
    DEFAULT_INTERVIEW_STAGES.map(async (s, order) => {
      const panelIds = await getPanelInterviewerIdsByOrder(order)
      return {
        order,
        name: s.name,
        interviewType: s.interviewType,
        defaultDuration: s.defaultDuration,
        defaultInterviewerIds: JSON.stringify(panelIds),
      }
    })
  )

  return prisma.interviewPlan.create({
    data: {
      requirementId,
      stages: { create: stagesData },
    },
    include: { stages: { orderBy: { order: 'asc' } } },
  })
}

export async function ensurePlansForAllRequirements() {
  const reqs = await prisma.requirement.findMany({ select: { id: true } })
  for (const r of reqs) {
    await ensureInterviewPlan(r.id)
  }
}

export function mapPlanResponse(
  plan: Awaited<ReturnType<typeof ensureInterviewPlan>>
) {
  return {
    id: plan.id,
    requirementId: plan.requirementId,
    stages: plan.stages.map((s) => ({
      id: s.id,
      order: s.order,
      name: s.name,
      interviewType: s.interviewType,
      defaultDuration: s.defaultDuration,
      defaultInterviewerIds: JSON.parse(s.defaultInterviewerIds || '[]') as string[],
    })),
  }
}

type InterviewRow = {
  id: string
  planStageId: string | null
  scheduledAt: Date
  duration: number | null
  status: string
}

type FeedbackRow = { interviewId: string; recommendation: string }

function latestFeedbackByInterview(feedbackRows: FeedbackRow[]) {
  const map = new Map<string, FeedbackRow>()
  for (const fb of feedbackRows) {
    if (!map.has(fb.interviewId)) map.set(fb.interviewId, fb)
  }
  return map
}

function stageInterviewState(
  interviews: InterviewRow[],
  feedbackByInterview: Map<string, FeedbackRow>,
  now = new Date()
): StageProgressStatus {
  const active = interviews.filter((i) => i.status !== 'CANCELLED')
  if (active.length === 0) return 'available'

  const scheduled = active.find((i) => i.status === 'SCHEDULED' && !isInterviewPastEnd(i.scheduledAt, i.duration, now))
  if (scheduled) return 'scheduled'

  const withFeedback = active.filter((i) => feedbackByInterview.has(i.id))
  if (withFeedback.length > 0) {
    const latest = withFeedback[withFeedback.length - 1]
    const rec = feedbackByInterview.get(latest.id)!.recommendation
    if (FAIL_RECOMMENDATIONS.has(rec)) return 'failed'
    return 'completed'
  }

  const needsFeedback = active.some(
    (i) =>
      i.status === 'COMPLETED' ||
      (i.status === 'SCHEDULED' && isInterviewPastEnd(i.scheduledAt, i.duration, now))
  )
  if (needsFeedback) return 'awaiting_feedback'

  return 'available'
}

export function isStageCompleteForFlow(status: StageProgressStatus): boolean {
  return status === 'completed'
}

export async function getCandidateStageProgress(
  requirementId: string,
  candidateId: string,
  excludeInterviewId?: string
) {
  const plan = await ensureInterviewPlan(requirementId)
  const stages = plan.stages

  const interviews = await prisma.interview.findMany({
    where: { requirementId, candidateId },
    orderBy: { scheduledAt: 'asc' },
  })

  const interviewIds = interviews.map((i) => i.id)
  const feedbackRows =
    interviewIds.length > 0
      ? await prisma.feedback.findMany({
          where: { interviewId: { in: interviewIds } },
          orderBy: { createdAt: 'desc' },
        })
      : []

  const feedbackByInterview = latestFeedbackByInterview(feedbackRows)
  const now = new Date()

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: { status: true },
  })
  const candidateInInterviewStage = candidate?.status === 'INTERVIEW'

  const stageResults: Array<{
    id: string
    order: number
    name: string
    interviewType: string
    defaultDuration: number
    defaultInterviewerIds: string[]
    allowedInterviewerIds: string[]
    usesCombinedPanel: boolean
    panelRestrictionLabel: string
    status: StageProgressStatus
    canSchedule: boolean
    interviewId?: string
  }> = []

  let allPriorComplete = true
  for (const stage of stages) {
    const allowedInterviewerIds = await getAllowedInterviewerIdsForPlanStageOrder(stage.order)
    const stageInterviews = interviews
      .filter((iv) => iv.planStageId === stage.id && iv.id !== excludeInterviewId)
    let status = stageInterviewState(stageInterviews, feedbackByInterview, now)
    if (!allPriorComplete && status === 'available') status = 'locked'

    const activeInterview = stageInterviews.find(
      (iv) =>
        iv.status !== 'CANCELLED' &&
        iv.status === 'SCHEDULED' &&
        !isInterviewPastEnd(iv.scheduledAt, iv.duration, now)
    )
    const awaitingInterview = stageInterviews.find((iv) => {
      if (iv.status === 'CANCELLED') return false
      if (feedbackByInterview.has(iv.id)) return false
      return (
        iv.status === 'COMPLETED' ||
        (iv.status === 'SCHEDULED' && isInterviewPastEnd(iv.scheduledAt, iv.duration, now))
      )
    })

    const canSchedule =
      candidateInInterviewStage &&
      allPriorComplete &&
      status === 'available' &&
      !activeInterview &&
      !awaitingInterview &&
      allowedInterviewerIds.length > 0

    stageResults.push({
      id: stage.id,
      order: stage.order,
      name: stage.name,
      interviewType: stage.interviewType,
      defaultDuration: stage.defaultDuration,
      defaultInterviewerIds: JSON.parse(stage.defaultInterviewerIds || '[]') as string[],
      allowedInterviewerIds,
      usesCombinedPanel: isAdditionalPlanStageOrder(stage.order),
      panelRestrictionLabel: panelRestrictionLabel(stage.order, stage.name),
      status,
      canSchedule,
      interviewId: activeInterview?.id ?? awaitingInterview?.id,
    })

    if (status === 'failed') allPriorComplete = false
    else if (!isStageCompleteForFlow(status)) allPriorComplete = false
  }

  const nextSchedulable = stageResults.find((s) => s.canSchedule)

  return {
    planId: plan.id,
    requirementId,
    candidateId,
    candidateInInterviewStage: candidateInInterviewStage ?? false,
    stages: stageResults,
    nextSchedulableStageId: nextSchedulable?.id ?? null,
  }
}

export async function assertCandidateInInterviewStage(candidateId: string) {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: { status: true, name: true },
  })
  if (!candidate) {
    throw new ScheduleStageError('Candidate not found', 404)
  }
  if (candidate.status !== 'INTERVIEW') {
    throw new ScheduleStageError(
      'Interviews can only be scheduled for candidates in the Interview pipeline stage.',
      403
    )
  }
}

export async function assertInterviewerIdsAllowedForStage(
  stageOrder: number,
  interviewerIds: string[],
  stageName?: string
) {
  const allowed = await getAllowedInterviewerIdsForPlanStageOrder(stageOrder)
  if (allowed.length === 0) {
    const panel = panelRestrictionLabel(stageOrder, stageName ?? 'this stage')
    throw new ScheduleStageError(
      `No interviewers are configured for the ${panel}. Add panel members under Admin → Interview panels.`,
      403
    )
  }
  const allowedSet = new Set(allowed)
  const invalid = interviewerIds.filter((id) => !allowedSet.has(id))
  if (invalid.length > 0) {
    const panel = panelRestrictionLabel(stageOrder, stageName ?? 'this stage')
    throw new ScheduleStageError(
      `Selected interviewer(s) are not on the ${panel}. Choose only panel members for this round.`,
      403
    )
  }
}

export async function assertCanScheduleStage(
  requirementId: string,
  candidateId: string,
  planStageId: string,
  excludeInterviewId?: string
) {
  await assertCandidateInInterviewStage(candidateId)

  const plan = await ensureInterviewPlan(requirementId)
  const stage = plan.stages.find((s) => s.id === planStageId)
  if (!stage) {
    throw new ScheduleStageError('Invalid interview stage for this job', 400)
  }

  const progress = await getCandidateStageProgress(
    requirementId,
    candidateId,
    excludeInterviewId
  )
  const stageProgress = progress.stages.find((s) => s.id === planStageId)
  if (!stageProgress) {
    throw new ScheduleStageError('Stage not found', 400)
  }

  if (excludeInterviewId) {
    return { stage, plan }
  }

  if (!stageProgress.canSchedule) {
    const msg = !progress.candidateInInterviewStage
      ? 'Move the candidate to Interview stage in the pipeline before scheduling.'
      : stageProgress.allowedInterviewerIds.length === 0
        ? `No interviewers are configured for the ${stageProgress.panelRestrictionLabel}.`
        : stageProgress.status === 'locked'
          ? `Complete earlier interview stages before scheduling "${stage.name}".`
          : stageProgress.status === 'scheduled'
            ? `"${stage.name}" is already scheduled.`
            : stageProgress.status === 'awaiting_feedback'
              ? `Submit feedback for "${stage.name}" before scheduling the next stage.`
              : stageProgress.status === 'failed'
                ? `Candidate did not pass "${stage.name}". Cannot schedule later stages.`
                : `Cannot schedule "${stage.name}" at this time.`
    throw new ScheduleStageError(msg, 403)
  }

  return { stage, plan }
}

export class ScheduleStageError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message)
    this.name = 'ScheduleStageError'
  }
}
