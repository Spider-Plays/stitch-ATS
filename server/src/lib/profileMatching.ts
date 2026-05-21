import type { Candidate, Requirement } from '@prisma/client'
import { deserializeSkills, normalizeSkillToken } from './skills.js'
import { extractResumeText } from './resumeParse.js'
import { findResumeFile } from './resumeStorage.js'
import fs from 'fs/promises'

export type MatchBreakdown = {
  primaryScore: number
  secondaryScore: number
  jdScore: number
  matchedPrimary: string[]
  matchedSecondary: string[]
}

export type CandidateMatchResult = {
  candidateId: string
  matchScore: number
  breakdown: MatchBreakdown
  alreadyLinked: boolean
  linkedToOther: boolean
}

function buildCorpus(
  candidate: Candidate,
  resumeText: string
): string {
  const primary = deserializeSkills(candidate.primarySkills)
  const secondary = deserializeSkills(candidate.secondarySkills)
  const parts = [
    resumeText,
    candidate.role,
    candidate.currentCompany ?? '',
    candidate.totalExperience ?? '',
    ...primary,
    ...secondary,
  ]
  return parts.join(' ').toLowerCase()
}

function scoreSkillList(
  required: string[],
  corpus: string
): { score: number; matched: string[] } {
  if (!required.length) return { score: 1, matched: [] }

  const matched: string[] = []
  for (const skill of required) {
    const token = normalizeSkillToken(skill)
    if (!token) continue
    if (corpus.includes(token)) {
      matched.push(skill)
      continue
    }
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    if (new RegExp(escaped, 'i').test(corpus)) {
      matched.push(skill)
    }
  }

  return { score: matched.length / required.length, matched }
}

function scoreJdOverlap(jd: string, corpus: string): number {
  if (!jd.trim()) return 0

  const words = jd
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && w.length <= 24)

  const unique = [...new Set(words)].slice(0, 80)
  if (!unique.length) return 0

  let hits = 0
  for (const w of unique) {
    if (corpus.includes(w)) hits++
  }
  return hits / unique.length
}

export function computeMatchScore(
  candidate: Candidate,
  requirement: Requirement,
  resumeText: string
): { score: number; breakdown: MatchBreakdown } {
  const corpus = buildCorpus(candidate, resumeText)
  const reqPrimary = deserializeSkills(requirement.primarySkills)
  const reqSecondary = deserializeSkills(requirement.secondarySkills)
  const jd =
    requirement.jobDescription?.trim() ||
    requirement.description?.trim() ||
    ''

  const primary = scoreSkillList(reqPrimary, corpus)
  const secondary = scoreSkillList(reqSecondary, corpus)
  const jdScore = scoreJdOverlap(jd, corpus)

  const hasPrimary = reqPrimary.length > 0
  const hasSecondary = reqSecondary.length > 0
  const hasJd = jd.length > 0

  let score: number
  if (!hasPrimary && !hasSecondary && !hasJd) {
    score = 0
  } else if (!hasPrimary && !hasSecondary) {
    score = jdScore
  } else if (!hasJd) {
    const wPrimary = hasPrimary ? 0.65 : 0
    const wSecondary = hasSecondary ? 0.35 : 0
    const total = wPrimary + wSecondary
    score =
      (primary.score * wPrimary + secondary.score * wSecondary) / total
  } else {
    const wPrimary = hasPrimary ? 0.5 : 0
    const wSecondary = hasSecondary ? 0.25 : 0
    const wJd = 0.25
    const skillWeight = wPrimary + wSecondary
    const skillPart =
      skillWeight > 0
        ? (primary.score * wPrimary + secondary.score * wSecondary) / skillWeight
        : 0
    score = skillPart * (wPrimary + wSecondary) + jdScore * wJd
  }

  const rounded = Math.round(Math.min(100, Math.max(0, score * 100)))

  return {
    score: rounded,
    breakdown: {
      primaryScore: Math.round(primary.score * 100),
      secondaryScore: Math.round(secondary.score * 100),
      jdScore: Math.round(jdScore * 100),
      matchedPrimary: primary.matched,
      matchedSecondary: secondary.matched,
    },
  }
}

export async function loadCandidateResumeText(
  candidate: Candidate
): Promise<string> {
  if (candidate.resumeText?.trim()) {
    return candidate.resumeText.trim()
  }
  if (!candidate.resumeFileName) return ''

  try {
    const stored = await findResumeFile(candidate.id)
    if (!stored) return ''
    const buffer = await fs.readFile(stored.filePath)
    return extractResumeText(buffer, stored.mime, candidate.resumeFileName)
  } catch {
    return ''
  }
}

export async function rankCandidatesForRequirement(
  candidates: Candidate[],
  requirement: Requirement,
  requirementId: string
): Promise<CandidateMatchResult[]> {
  const results: CandidateMatchResult[] = []

  for (const candidate of candidates) {
    const resumeText = await loadCandidateResumeText(candidate)
    const { score, breakdown } = computeMatchScore(
      candidate,
      requirement,
      resumeText
    )

    results.push({
      candidateId: candidate.id,
      matchScore: score,
      breakdown,
      alreadyLinked: candidate.requirementId === requirementId,
      linkedToOther: !!(
        candidate.requirementId && candidate.requirementId !== requirementId
      ),
    })
  }

  return results.sort((a, b) => b.matchScore - a.matchScore)
}
