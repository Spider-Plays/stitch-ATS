import type { Prisma, Requirement } from '@prisma/client'
import { prisma } from './prisma.js'
import { rankCandidatesForRequirement } from './profileMatching.js'

export type VersionLinkedCandidate = {
  id: string
  name: string
  email: string
  status: string
  matchScore: number
}

export type VersionMatchingProfile = {
  candidateId: string
  name: string
  matchScore: number
  alreadyLinked: boolean
  linkedToOther: boolean
}

export type RequirementVersionRecord = {
  version: number
  changedBy: string
  changedAt: string
  kind?: 'UPDATE' | 'CANDIDATE_LINKED'
  changes: Record<string, unknown>
  linkedCandidates?: VersionLinkedCandidate[]
  matchingProfiles?: VersionMatchingProfile[]
}

export function parseRequirementVersions(raw: string | null | undefined): RequirementVersionRecord[] {
  try {
    const arr = JSON.parse(raw || '[]')
    return Array.isArray(arr) ? (arr as RequirementVersionRecord[]) : []
  } catch {
    return []
  }
}

export async function snapshotLinkedCandidates(
  requirementId: string
): Promise<VersionLinkedCandidate[]> {
  const rows = await prisma.candidate.findMany({
    where: { requirementId },
    orderBy: { matchScore: 'desc' },
  })
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    status: c.status,
    matchScore: Math.round(c.matchScore),
  }))
}

export async function snapshotMatchingProfiles(
  requirement: Requirement,
  requirementId: string,
  candidateWhere: Prisma.CandidateWhereInput = {}
): Promise<VersionMatchingProfile[]> {
  const candidates = await prisma.candidate.findMany({
    where: candidateWhere,
    orderBy: { updatedAt: 'desc' },
  })
  const ranked = await rankCandidatesForRequirement(candidates, requirement, requirementId)
  const candidateById = new Map(candidates.map((c) => [c.id, c]))

  return ranked
    .filter((m) => m.alreadyLinked || m.matchScore >= 15)
    .slice(0, 12)
    .map((m) => {
      const c = candidateById.get(m.candidateId)!
      return {
        candidateId: m.candidateId,
        name: c.name,
        matchScore: m.matchScore,
        alreadyLinked: m.alreadyLinked,
        linkedToOther: m.linkedToOther,
      }
    })
}

export async function appendRequirementVersion(
  requirementId: string,
  entry: {
    changedBy: string
    kind?: 'UPDATE' | 'CANDIDATE_LINKED'
    changes: Record<string, unknown>
    incrementVersion?: boolean
    candidateWhere?: Prisma.CandidateWhereInput
  }
) {
  const existing = await prisma.requirement.findUnique({ where: { id: requirementId } })
  if (!existing) return null

  const versions = parseRequirementVersions(existing.versions)
  const [linkedCandidates, matchingProfiles] = await Promise.all([
    snapshotLinkedCandidates(requirementId),
    snapshotMatchingProfiles(
      existing,
      requirementId,
      entry.candidateWhere ?? {}
    ),
  ])

  const nextVersion = entry.incrementVersion
    ? existing.currentVersion + 1
    : existing.currentVersion

  versions.push({
    version: entry.incrementVersion ? existing.currentVersion : existing.currentVersion,
    changedBy: entry.changedBy,
    changedAt: new Date().toISOString(),
    kind: entry.kind ?? 'UPDATE',
    changes: entry.changes,
    linkedCandidates,
    matchingProfiles,
  })

  const row = await prisma.requirement.update({
    where: { id: requirementId },
    data: {
      versions: JSON.stringify(versions),
      ...(entry.incrementVersion ? { currentVersion: nextVersion } : {}),
      updatedAt: new Date(),
    },
  })

  return row
}
