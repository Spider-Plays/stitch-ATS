import { prisma } from './prisma.js'

export const DEFAULT_PANEL_LEVELS = [
  { order: 0, name: 'L1 Interview' },
  { order: 1, name: 'L2 Interview' },
  { order: 2, name: 'HR Interview' },
] as const

export type InterviewPanelLevelDto = {
  id: string
  order: number
  name: string
  interviewerIds: string[]
}

function mapLevel(row: {
  id: string
  order: number
  name: string
  interviewerIds: string
}): InterviewPanelLevelDto {
  return {
    id: row.id,
    order: row.order,
    name: row.name,
    interviewerIds: JSON.parse(row.interviewerIds || '[]') as string[],
  }
}

export async function ensureInterviewPanelCatalog() {
  for (const level of DEFAULT_PANEL_LEVELS) {
    const existing = await prisma.interviewPanelLevel.findUnique({
      where: { order: level.order },
    })
    if (!existing) {
      await prisma.interviewPanelLevel.create({
        data: { order: level.order, name: level.name },
      })
    }
  }
}

export async function listInterviewPanelLevels(): Promise<InterviewPanelLevelDto[]> {
  await ensureInterviewPanelCatalog()
  const rows = await prisma.interviewPanelLevel.findMany({ orderBy: { order: 'asc' } })
  return rows.map(mapLevel)
}

export async function getPanelInterviewerIdsByOrder(order: number): Promise<string[]> {
  await ensureInterviewPanelCatalog()
  const row = await prisma.interviewPanelLevel.findUnique({ where: { order } })
  if (!row) return []
  return JSON.parse(row.interviewerIds || '[]') as string[]
}

export async function syncPanelToAllPlanStages(order: number, interviewerIds: string[]) {
  const payload = JSON.stringify(interviewerIds)
  await prisma.interviewPlanStage.updateMany({
    where: { order },
    data: { defaultInterviewerIds: payload },
  })
}

export const DEFAULT_PANEL_STAGE_COUNT = DEFAULT_PANEL_LEVELS.length

/** Stages beyond L1 / L2 / HR use the combined panel pool. */
export function isAdditionalPlanStageOrder(order: number): boolean {
  return order >= DEFAULT_PANEL_STAGE_COUNT
}

export async function getAllPanelInterviewerIds(): Promise<string[]> {
  const levels = await listInterviewPanelLevels()
  const ids = new Set<string>()
  for (const level of levels) {
    for (const id of level.interviewerIds) {
      if (typeof id === 'string' && id.trim()) ids.add(id)
    }
  }
  return [...ids]
}

export async function getAllowedInterviewerIdsForPlanStageOrder(
  order: number
): Promise<string[]> {
  if (isAdditionalPlanStageOrder(order)) {
    return getAllPanelInterviewerIds()
  }
  return getPanelInterviewerIdsByOrder(order)
}

export function panelRestrictionLabel(order: number, stageName: string): string {
  if (isAdditionalPlanStageOrder(order)) {
    return 'combined interview panel'
  }
  const match = DEFAULT_PANEL_LEVELS.find((l) => l.order === order)
  return match?.name ?? stageName
}

export async function updateInterviewPanelLevel(
  levelId: string,
  interviewerIds: string[]
): Promise<InterviewPanelLevelDto> {
  const row = await prisma.interviewPanelLevel.findUnique({ where: { id: levelId } })
  if (!row) throw new Error('Interview panel level not found')

  const uniqueIds = [...new Set(interviewerIds.filter((id) => typeof id === 'string' && id.trim()))]
  const updated = await prisma.interviewPanelLevel.update({
    where: { id: levelId },
    data: { interviewerIds: JSON.stringify(uniqueIds) },
  })

  await syncPanelToAllPlanStages(updated.order, uniqueIds)

  return mapLevel(updated)
}
