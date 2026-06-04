import type { InterviewPanelLevel } from '../types'

/** Default L1 / L2 / HR columns — shown even when the API has not loaded yet. */
export const DEFAULT_INTERVIEW_PANEL_LEVELS: InterviewPanelLevel[] = [
  { id: '', order: 0, name: 'L1 Interview', interviewerIds: [] },
  { id: '', order: 1, name: 'L2 Interview', interviewerIds: [] },
  { id: '', order: 2, name: 'HR Interview', interviewerIds: [] },
]

export function mergeInterviewPanelLevels(
  fromApi: InterviewPanelLevel[] | undefined
): InterviewPanelLevel[] {
  if (!fromApi?.length) return DEFAULT_INTERVIEW_PANEL_LEVELS

  return DEFAULT_INTERVIEW_PANEL_LEVELS.map((fallback) => {
    const match = fromApi.find((l) => l.order === fallback.order)
    return match ?? fallback
  })
}

export function isPanelLevelPersisted(level: InterviewPanelLevel): boolean {
  return Boolean(level.id && !level.id.startsWith('fallback-'))
}

/** L1, L2, HR map to panel order 0–2; stage order ≥ this uses the combined panel pool. */
export const DEFAULT_PANEL_STAGE_COUNT = DEFAULT_INTERVIEW_PANEL_LEVELS.length

export function isAdditionalPlanStageOrder(order: number): boolean {
  return order >= DEFAULT_PANEL_STAGE_COUNT
}

export function allowedInterviewerIdsForStageOrder(
  order: number,
  panelLevels: InterviewPanelLevel[]
): string[] {
  if (isAdditionalPlanStageOrder(order)) {
    const ids = new Set<string>()
    for (const level of panelLevels) {
      for (const id of level.interviewerIds) {
        if (id) ids.add(id)
      }
    }
    return [...ids]
  }
  return panelLevels.find((l) => l.order === order)?.interviewerIds ?? []
}

export function interviewerPanelHint(
  order: number,
  panelRestrictionLabel: string,
  usesCombinedPanel: boolean
): string {
  if (usesCombinedPanel) {
    return 'Anyone from your interview panels (L1, L2, HR, and other configured members) can be selected.'
  }
  return `Only members of the ${panelRestrictionLabel} can be selected.`
}
