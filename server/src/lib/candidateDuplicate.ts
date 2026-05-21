import { prisma } from './prisma.js'
import type { Candidate } from '@prisma/client'

export const DUPLICATE_CANDIDATE_EMAIL_MESSAGE =
  'A candidate with this email already exists'

export async function findCandidateByEmail(
  email: string,
  excludeId?: string
): Promise<Candidate | null> {
  const trimmed = email?.trim()
  if (!trimmed) return null

  return prisma.candidate.findFirst({
    where: {
      email: { equals: trimmed, mode: 'insensitive' },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  })
}
