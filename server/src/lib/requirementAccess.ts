import type { Prisma } from '@prisma/client'
import { prisma } from './prisma.js'
import { hasOrgWideAccess } from './orgAccess.js'
import { isRequirementHiringManager } from './requirementPermissions.js'

function parseInterviewerIds(raw: string | null | undefined): string[] {
  try {
    const ids = JSON.parse(raw || '[]')
    return Array.isArray(ids) ? ids.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

export class RequirementAccessError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RequirementAccessError'
  }
}

export function parseRecruiterIds(raw: string | null | undefined): string[] {
  try {
    const ids = JSON.parse(raw || '[]')
    return Array.isArray(ids) ? ids.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

type RequirementScopeRow = {
  id: string
  createdBy: string | null
  hiringManager: string
  recruiters: string
}

export function requirementVisibleToAuth(
  auth: { userId: string; role: string; name?: string },
  requirement: RequirementScopeRow,
  interviewerRequirementIds?: Set<string>
): boolean {
  if (hasOrgWideAccess(auth.role)) return true

  const recruiters = parseRecruiterIds(requirement.recruiters)
  const assigned = recruiters.includes(auth.userId)
  const created = requirement.createdBy === auth.userId

  switch (auth.role) {
    case 'RECRUITER':
      return assigned || created
    case 'HIRING_MANAGER':
      return created || isRequirementHiringManager(auth, requirement)
    case 'INTERVIEWER':
      return interviewerRequirementIds?.has(requirement.id) ?? false
    default:
      return created
  }
}

export async function requirementIdsForInterviewer(userId: string): Promise<string[]> {
  const interviews = await prisma.interview.findMany({
    where: { status: { not: 'CANCELLED' } },
    select: { requirementId: true, interviewerIds: true },
  })
  const ids = new Set<string>()
  for (const i of interviews) {
    if (parseInterviewerIds(i.interviewerIds).includes(userId)) {
      ids.add(i.requirementId)
    }
  }
  return [...ids]
}

export async function requirementIdsForAuth(
  auth: { userId: string; role: string; name?: string }
): Promise<string[]> {
  if (hasOrgWideAccess(auth.role)) {
    const rows = await prisma.requirement.findMany({ select: { id: true } })
    return rows.map((r) => r.id)
  }

  const rows = await prisma.requirement.findMany({
    select: { id: true, createdBy: true, hiringManager: true, recruiters: true },
  })
  const interviewerReqIds =
    auth.role === 'INTERVIEWER'
      ? new Set(await requirementIdsForInterviewer(auth.userId))
      : undefined

  return rows
    .filter((r) => requirementVisibleToAuth(auth, r, interviewerReqIds))
    .map((r) => r.id)
}

export async function buildRequirementListWhere(
  auth: { userId: string; role: string; name?: string }
): Promise<Prisma.RequirementWhereInput> {
  if (hasOrgWideAccess(auth.role)) return {}

  const ids = await requirementIdsForAuth(auth)
  return ids.length > 0 ? { id: { in: ids } } : { id: { in: ['__none__'] } }
}

export async function assertCanViewRequirement(
  auth: { userId: string; role: string; name?: string },
  requirementId: string
): Promise<void> {
  if (hasOrgWideAccess(auth.role)) return

  const row = await prisma.requirement.findUnique({
    where: { id: requirementId },
    select: { id: true, createdBy: true, hiringManager: true, recruiters: true },
  })
  if (!row) {
    throw new RequirementAccessError('Requirement not found')
  }

  const interviewerReqIds =
    auth.role === 'INTERVIEWER'
      ? new Set(await requirementIdsForInterviewer(auth.userId))
      : undefined

  if (!requirementVisibleToAuth(auth, row, interviewerReqIds)) {
    throw new RequirementAccessError('Not allowed to view this requirement')
  }
}
