import type { Prisma } from '@prisma/client'
import { prisma } from './prisma.js'
import { CAREERS_CANDIDATE_WHERE, ERP_CANDIDATE_WHERE } from './featureCandidates.js'
import { hasOrgWideAccess } from './orgAccess.js'
import { requirementIdsForAuth } from './requirementAccess.js'
import { hasFeatureTag, parseFeatureTags } from './userTags.js'

export class CandidateAccessError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CandidateAccessError'
  }
}

export function parseInterviewerIds(raw: string | null | undefined): string[] {
  try {
    const ids = JSON.parse(raw || '[]')
    return Array.isArray(ids) ? ids.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

export async function isInterviewerAssignedToCandidate(
  userId: string,
  candidateId: string
): Promise<boolean> {
  const interviews = await prisma.interview.findMany({
    where: { candidateId },
    select: { interviewerIds: true, status: true },
  })
  return interviews.some(
    (i) =>
      i.status !== 'CANCELLED' &&
      parseInterviewerIds(i.interviewerIds).includes(userId)
  )
}

async function featureTagScopeClauses(
  auth: { userId: string; role: string }
): Promise<Prisma.CandidateWhereInput[]> {
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { permissions: true },
  })
  const tags = parseFeatureTags(user?.permissions)
  const clauses: Prisma.CandidateWhereInput[] = []
  if (hasFeatureTag(auth.role, tags, 'careers')) {
    clauses.push(CAREERS_CANDIDATE_WHERE)
  }
  if (hasFeatureTag(auth.role, tags, 'employee_referral')) {
    clauses.push(ERP_CANDIDATE_WHERE)
  }
  return clauses
}

function withFeatureScopes(
  base: Prisma.CandidateWhereInput,
  scopes: Prisma.CandidateWhereInput[]
): Prisma.CandidateWhereInput {
  if (scopes.length === 0) return base
  return { OR: [base, ...scopes] }
}

/** Org-wide roles see all candidates; others are scoped by role, assignments, and feature tags. */
export async function buildCandidateListWhere(
  auth: { userId: string; role: string; name?: string }
): Promise<Prisma.CandidateWhereInput> {
  if (hasOrgWideAccess(auth.role)) {
    return {}
  }

  const tagScopes = await featureTagScopeClauses(auth)

  if (auth.role === 'INTERVIEWER') {
    const ids = await candidateIdsForInterviewer(auth.userId)
    const base =
      ids.length > 0 ? { id: { in: ids } } : { id: { in: ['__none__'] } }
    return withFeatureScopes(base, tagScopes)
  }

  const own: Prisma.CandidateWhereInput = { createdBy: auth.userId }

  if (auth.role === 'RECRUITER') {
    return withFeatureScopes(own, tagScopes)
  }

  const reqIds = await requirementIdsForAuth(auth)
  const base =
    reqIds.length === 0
      ? own
      : { OR: [own, { requirementId: { in: reqIds } }] }

  return withFeatureScopes(base, tagScopes)
}

export async function canViewCandidate(
  auth: { userId: string; role: string; name?: string },
  candidateId: string
): Promise<boolean> {
  const where = await buildCandidateListWhere(auth)
  const row = await prisma.candidate.findFirst({
    where: { id: candidateId, ...where },
    select: { id: true },
  })
  return !!row
}

export async function assertCanViewCandidate(
  auth: { userId: string; role: string; name?: string },
  candidateId: string
): Promise<void> {
  const ok = await canViewCandidate(auth, candidateId)
  if (!ok) {
    throw new CandidateAccessError('Not allowed to view this candidate')
  }
}

export async function assertCanMutateCandidate(
  auth: { userId: string; role: string; name?: string },
  candidateId: string
): Promise<void> {
  await assertCanViewCandidate(auth, candidateId)
}

export async function candidateIdsForInterviewer(userId: string): Promise<string[]> {
  const interviews = await prisma.interview.findMany({
    select: { candidateId: true, interviewerIds: true, status: true },
  })
  const ids = new Set<string>()
  for (const i of interviews) {
    if (i.status === 'CANCELLED') continue
    if (parseInterviewerIds(i.interviewerIds).includes(userId)) {
      ids.add(i.candidateId)
    }
  }
  return [...ids]
}

export async function interviewIdsForInterviewer(userId: string): Promise<string[]> {
  const interviews = await prisma.interview.findMany({
    select: { id: true, interviewerIds: true, status: true },
  })
  const ids: string[] = []
  for (const i of interviews) {
    if (i.status === 'CANCELLED') continue
    if (parseInterviewerIds(i.interviewerIds).includes(userId)) {
      ids.push(i.id)
    }
  }
  return ids
}

export async function buildInterviewListWhere(
  auth: { userId: string; role: string; name?: string }
): Promise<Prisma.InterviewWhereInput> {
  if (hasOrgWideAccess(auth.role)) return {}

  if (auth.role === 'INTERVIEWER') {
    const ids = await interviewIdsForInterviewer(auth.userId)
    return ids.length > 0 ? { id: { in: ids } } : { id: { in: ['__none__'] } }
  }

  const candidateWhere = await buildCandidateListWhere(auth)
  const candidates = await prisma.candidate.findMany({
    where: candidateWhere,
    select: { id: true },
  })
  const candidateIds = candidates.map((c) => c.id)
  return candidateIds.length > 0
    ? { candidateId: { in: candidateIds } }
    : { candidateId: { in: ['__none__'] } }
}

export async function buildOfferListWhere(
  auth: { userId: string; role: string; name?: string }
): Promise<Prisma.OfferWhereInput> {
  if (hasOrgWideAccess(auth.role)) return {}

  const candidateWhere = await buildCandidateListWhere(auth)
  const candidates = await prisma.candidate.findMany({
    where: candidateWhere,
    select: { id: true },
  })
  const candidateIds = candidates.map((c) => c.id)
  return candidateIds.length > 0
    ? { candidateId: { in: candidateIds } }
    : { candidateId: { in: ['__none__'] } }
}

/** Candidate-profile activity actions visible to assigned interviewers. */
export const INTERVIEWER_VISIBLE_CANDIDATE_ACTIONS = [
  'INTERVIEW_SCHEDULED',
  'INTERVIEW_RESCHEDULED',
  'INTERVIEW_UPDATED',
  'INTERVIEW_CANCELLED',
  'INTERVIEW_FEEDBACK_DELETED',
] as const
