import type { InterviewPlan, InterviewPlanStage } from '../types'

export type InterviewPlanStageInput = {
  id?: string
  name: string
  interviewType: InterviewPlanStage['interviewType']
  defaultDuration: number
  defaultInterviewerIds?: string[]
}

export function sortPlanStages(stages: InterviewPlanStage[]): InterviewPlanStage[] {
  return [...stages].sort((a, b) => a.order - b.order)
}

export function planStagesToPayload(stages: InterviewPlanStage[]): InterviewPlanStageInput[] {
  return sortPlanStages(stages).map((s) => ({
    id: s.id,
    name: s.name,
    interviewType: s.interviewType,
    defaultDuration: s.defaultDuration,
    defaultInterviewerIds: s.defaultInterviewerIds,
  }))
}

export function insertPlanStage(
  plan: InterviewPlan,
  insertIndex: number,
  name?: string
): InterviewPlanStageInput[] {
  const sorted = sortPlanStages(plan.stages)
  const next: InterviewPlanStageInput[] = sorted.map((s) => ({
    id: s.id,
    name: s.name,
    interviewType: s.interviewType,
    defaultDuration: s.defaultDuration,
    defaultInterviewerIds: s.defaultInterviewerIds,
  }))
  next.splice(insertIndex, 0, {
    name: name ?? `Round ${insertIndex + 1}`,
    interviewType: 'TECHNICAL',
    defaultDuration: 60,
    defaultInterviewerIds: [],
  })
  return next
}

export function removePlanStage(plan: InterviewPlan, stageId: string): InterviewPlanStageInput[] {
  return planStagesToPayload(plan.stages.filter((s) => s.id !== stageId))
}
