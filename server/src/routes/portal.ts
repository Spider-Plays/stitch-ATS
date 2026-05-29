import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import {
  DUPLICATE_CANDIDATE_EMAIL_MESSAGE,
  findCandidateByEmail,
} from '../lib/candidateDuplicate.js'
import {
  getCandidateProfileMissing,
  isCandidateProfileComplete,
  PROFILE_FIELD_LABELS,
} from '../lib/candidateProfileComplete.js'
import { computeMatchScore } from '../lib/profileMatching.js'
import { mapCandidate, mapInterview, mapOffer, mapRequirement } from '../utils/mappers.js'
import { requireAuth, requireActiveUser, requireRoles } from '../middleware/auth.js'
import { logActivity } from '../services/activityLog.js'
import { handleUploadResume } from '../middleware/uploadResume.js'
import {
  buildCandidateResumePayload,
  extractResumeText,
} from '../lib/resumeParse.js'
import { getCatalogSkillNames } from '../lib/skillCatalog.js'
import {
  isAllowedResumeFile,
  resolveResumeMime,
  saveResumeFile,
} from '../lib/resumeStorage.js'

const router = Router()
router.use(requireAuth, requireActiveUser, requireRoles('CANDIDATE'))

const profileBodySchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
  location: z.string().min(1),
  totalExperience: z.string().min(1),
  currentCompany: z.string().min(1),
  currentCTC: z.string().min(1),
  expectedCTC: z.string().min(1),
  noticePeriod: z.string().min(1),
  pan: z
    .string()
    .min(1)
    .refine((v) => /^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(v.trim()), 'Invalid PAN'),
  linkedIn: z.string().url().optional().or(z.literal('')),
  portfolio: z.string().url().optional().or(z.literal('')),
})

function portalRequirementVisible(
  requirement: { status: string; visibleToCandidates: boolean } | null
) {
  if (!requirement) return false
  return requirement.status === 'LIVE' && requirement.visibleToCandidates
}

function mapPortalPosition(r: {
  id: string
  jobCode: string | null
  client: string | null
  title: string
  department: string
  location: string | null
  priority: string | null
  openings: number
  filled: number
  description: string | null
  updatedAt: Date
}) {
  return {
    id: r.id,
    jobCode: r.jobCode ?? r.id.slice(-8).toUpperCase(),
    client: r.client ?? undefined,
    title: r.title,
    department: r.department,
    location: r.location ?? undefined,
    priority: r.priority ?? undefined,
    openings: r.openings,
    filled: r.filled,
    description: r.description ?? undefined,
    updatedAt: r.updatedAt.toISOString(),
  }
}

function profileStatusPayload(candidate: { id: string } & Parameters<typeof isCandidateProfileComplete>[0]) {
  const missing = getCandidateProfileMissing(candidate)
  return {
    profileComplete: missing.length === 0,
    missingFields: missing.map((k) => PROFILE_FIELD_LABELS[k] ?? k),
  }
}

router.put('/profile', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } })
  if (!user) return res.status(404).json({ error: 'User not found' })

  const body = profileBodySchema.parse(req.body)
  const name = `${body.firstName.trim()} ${body.lastName.trim()}`.trim()
  const email = user.email.toLowerCase()

  const existing = await findCandidateByEmail(email)
  let row
  if (existing) {
    row = await prisma.candidate.update({
      where: { id: existing.id },
      data: {
        name,
        phone: body.phone.trim(),
        location: body.location.trim(),
        totalExperience: body.totalExperience.trim(),
        currentCompany: body.currentCompany.trim(),
        currentCTC: body.currentCTC.trim(),
        expectedCTC: body.expectedCTC.trim(),
        noticePeriod: body.noticePeriod.trim(),
        pan: body.pan.trim().toUpperCase(),
        linkedIn: body.linkedIn?.trim() || null,
        portfolio: body.portfolio?.trim() || null,
        updatedAt: new Date(),
      },
    })
    await logActivity({
      entityType: 'CANDIDATE',
      entityId: row.id,
      action: 'UPDATED',
      performedBy: user.id,
      performerName: user.name,
      performerRole: user.role,
      details: { via: 'candidate_portal' },
    })
  } else {
    row = await prisma.candidate.create({
      data: {
        name,
        email,
        role: 'Candidate',
        status: 'APPLIED',
        matchScore: 0,
        source: 'Candidate Portal',
        phone: body.phone.trim(),
        location: body.location.trim(),
        totalExperience: body.totalExperience.trim(),
        currentCompany: body.currentCompany.trim(),
        currentCTC: body.currentCTC.trim(),
        expectedCTC: body.expectedCTC.trim(),
        noticePeriod: body.noticePeriod.trim(),
        pan: body.pan.trim().toUpperCase(),
        linkedIn: body.linkedIn?.trim() || null,
        portfolio: body.portfolio?.trim() || null,
        primarySkills: '[]',
        secondarySkills: '[]',
      },
    })
    await logActivity({
      entityType: 'CANDIDATE',
      entityId: row.id,
      action: 'CREATED',
      performedBy: user.id,
      performerName: user.name,
      performerRole: user.role,
      details: { via: 'candidate_portal' },
    })
  }

  if (row.requirementId) {
    const requirement = await prisma.requirement.findUnique({
      where: { id: row.requirementId },
    })
    if (requirement) {
      const resumeText = row.resumeText ?? ''
      const { score } = computeMatchScore(row, requirement, resumeText)
      row = await prisma.candidate.update({
        where: { id: row.id },
        data: { matchScore: score },
      })
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name, phoneNumber: body.phone.trim() },
  })

  const status = profileStatusPayload(row)
  res.json({
    candidate: mapCandidate(row),
    ...status,
  })
})

router.post('/profile/resume', handleUploadResume, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } })
  if (!user) return res.status(404).json({ error: 'User not found' })

  const candidate = await findCandidateByEmail(user.email)
  if (!candidate) {
    return res.status(400).json({
      error: 'Save your profile details before uploading a resume.',
    })
  }
  if (!req.file) return res.status(400).json({ error: 'Resume file is required' })
  if (!isAllowedResumeFile(req.file.mimetype, req.file.originalname)) {
    return res.status(400).json({ error: 'Only PDF, DOC, and DOCX files are allowed' })
  }

  const mime = resolveResumeMime(req.file.mimetype, req.file.originalname)
  await saveResumeFile(candidate.id, mime, req.file.buffer, req.file.originalname)

  let resumePayload = {
    resumeText: null as string | null,
    primarySkills: candidate.primarySkills,
    secondarySkills: candidate.secondarySkills,
  }
  try {
    const catalog = await getCatalogSkillNames()
    const text = await extractResumeText(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    )
    const built = buildCandidateResumePayload(text, catalog)
    resumePayload = {
      resumeText: built.resumeText,
      primarySkills: built.primarySkills,
      secondarySkills: built.secondarySkills,
    }
  } catch {
    /* keep file without parsed text */
  }

  let updated = await prisma.candidate.update({
    where: { id: candidate.id },
    data: {
      resumeFileName: req.file.originalname,
      resumeMimeType: mime,
      resumeUrl: null,
      resumeText: resumePayload.resumeText,
      primarySkills: resumePayload.primarySkills,
      secondarySkills: resumePayload.secondarySkills,
      updatedAt: new Date(),
    },
  })

  if (updated.requirementId) {
    const requirement = await prisma.requirement.findUnique({
      where: { id: updated.requirementId },
    })
    if (requirement && resumePayload.resumeText) {
      const { score } = computeMatchScore(
        updated,
        requirement,
        resumePayload.resumeText
      )
      updated = await prisma.candidate.update({
        where: { id: updated.id },
        data: { matchScore: score },
      })
    }
  }

  await logActivity({
    entityType: 'CANDIDATE',
    entityId: updated.id,
    action: 'RESUME_UPLOADED',
    performedBy: user.id,
    performerName: user.name,
    performerRole: user.role,
    details: { fileName: req.file.originalname },
  })

  const status = profileStatusPayload(updated)
  res.json({
    candidate: mapCandidate(updated),
    ...status,
  })
})

router.get('/positions', async (_req, res) => {
  const rows = await prisma.requirement.findMany({
    where: { status: 'LIVE', visibleToCandidates: true },
    orderBy: { updatedAt: 'desc' },
  })
  res.json(rows.map(mapPortalPosition))
})

router.get('/positions/:id', async (req, res) => {
  const row = await prisma.requirement.findUnique({ where: { id: req.params.id } })
  if (!row || !portalRequirementVisible(row)) {
    return res.status(404).json({ error: 'Position not found or not available' })
  }
  res.json(mapPortalPosition(row))
})

router.post('/positions/:id/apply', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } })
  if (!user) return res.status(404).json({ error: 'User not found' })

  const requirement = await prisma.requirement.findUnique({ where: { id: req.params.id } })
  if (!requirement || !portalRequirementVisible(requirement)) {
    return res.status(404).json({ error: 'Position not found or not open for applications' })
  }

  const existing = await findCandidateByEmail(user.email)

  if (!existing) {
    return res.status(400).json({
      error: 'Complete your candidate profile before applying to a job.',
      code: 'PROFILE_INCOMPLETE',
    })
  }

  if (!isCandidateProfileComplete(existing)) {
    return res.status(400).json({
      error: 'Complete your candidate profile before applying to a job.',
      code: 'PROFILE_INCOMPLETE',
      missingFields: getCandidateProfileMissing(existing).map(
        (k) => PROFILE_FIELD_LABELS[k] ?? k
      ),
    })
  }

  if (existing.requirementId === requirement.id) {
    return res.json({
      alreadyApplied: true,
      candidate: mapCandidate(existing, { requirement }),
    })
  }

  if (existing.requirementId && existing.requirementId !== requirement.id) {
    return res.status(409).json({
      error: DUPLICATE_CANDIDATE_EMAIL_MESSAGE,
      existingCandidateId: existing.id,
    })
  }

  const resumeText = existing.resumeText ?? ''
  const { score } = computeMatchScore(existing, requirement, resumeText)

  const row = await prisma.candidate.update({
    where: { id: existing.id },
    data: {
      requirementId: requirement.id,
      jobTitle: requirement.title,
      role: requirement.title,
      status: 'APPLIED',
      matchScore: score,
      updatedAt: new Date(),
    },
  })

  await logActivity({
    entityType: 'CANDIDATE',
    entityId: row.id,
    action: 'APPLIED',
    performedBy: user.id,
    performerName: user.name,
    performerRole: user.role,
    details: {
      requirementId: requirement.id,
      jobCode: requirement.jobCode,
      title: requirement.title,
    },
  })

  res.status(201).json({
    alreadyApplied: false,
    candidate: mapCandidate(row, { requirement }),
  })
})

router.get('/me', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } })
  if (!user) return res.status(404).json({ error: 'User not found' })

  const candidate = await prisma.candidate.findFirst({
    where: { email: { equals: user.email, mode: 'insensitive' } },
    orderBy: { updatedAt: 'desc' },
  })

  if (!candidate) {
    return res.json({
      linked: false,
      profileComplete: false,
      missingFields: Object.values(PROFILE_FIELD_LABELS),
      message: 'Complete your profile to apply for open positions.',
      user: { name: user.name, email: user.email },
    })
  }

  const profileStatus = profileStatusPayload(candidate)

  const [interviews, offers, linkedRequirement] = await Promise.all([
    prisma.interview.findMany({
      where: { candidateId: candidate.id },
      orderBy: { scheduledAt: 'desc' },
    }),
    prisma.offer.findMany({
      where: { candidateId: candidate.id },
      orderBy: { createdAt: 'desc' },
    }),
    candidate.requirementId
      ? prisma.requirement.findUnique({ where: { id: candidate.requirementId } })
      : null,
  ])

  const requirementVisible = portalRequirementVisible(linkedRequirement)
  let requirementMessage: string | undefined
  if (linkedRequirement && !requirementVisible) {
    if (linkedRequirement.status === 'ON_HOLD') {
      requirementMessage = 'This position is temporarily on hold.'
    } else if (!linkedRequirement.visibleToCandidates) {
      requirementMessage = 'Job details for your application are not shown on the portal.'
    } else {
      requirementMessage = 'This position is not currently listed on the candidate portal.'
    }
  }

  res.json({
    linked: true,
    ...profileStatus,
    candidate: mapCandidate(candidate, { requirement: linkedRequirement }),
    requirement: requirementVisible && linkedRequirement ? mapRequirement(linkedRequirement) : null,
    requirementHidden: !!linkedRequirement && !requirementVisible,
    requirementMessage,
    interviews: interviews.map(mapInterview),
    offers: offers.map(mapOffer),
    user: { name: user.name, email: user.email },
  })
})

export default router
