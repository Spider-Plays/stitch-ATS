import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { mapVendor } from '../lib/mapVendor.js'
import { mapCandidate, mapRequirement } from '../utils/mappers.js'
import {
  DUPLICATE_CANDIDATE_EMAIL_MESSAGE,
  findCandidateByEmail,
} from '../lib/candidateDuplicate.js'
import { requireAuth, requireActiveUser, requireRoles } from '../middleware/auth.js'
import { logActivity } from '../services/activityLog.js'
import { handleUploadResume } from '../middleware/uploadResume.js'
import {
  extractResumeText,
  parseResumeFields,
  buildCandidateResumePayload,
} from '../lib/resumeParse.js'
import { getCatalogSkillNames } from '../lib/skillCatalog.js'
import { serializeSkills, parseSkillList } from '../lib/skills.js'
import { computeMatchScore } from '../lib/profileMatching.js'
import {
  isAllowedResumeFile,
  resolveResumeMime,
  saveResumeFile,
} from '../lib/resumeStorage.js'

const router = Router()
router.use(requireAuth, requireActiveUser, requireRoles('VENDOR'))

async function getVendorForUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user?.vendorId) return null
  const vendor = await prisma.vendor.findUnique({ where: { id: user.vendorId } })
  if (!vendor || vendor.status !== 'ACTIVE') return null
  return { user, vendor }
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

async function assignedRequirementIds(vendorId: string): Promise<string[]> {
  const rows = await prisma.vendorRequirement.findMany({
    where: { vendorId },
    select: { requirementId: true },
  })
  return rows.map((r) => r.requirementId)
}

async function assertVendorOwnsCandidate(vendorId: string, candidateId: string) {
  const row = await prisma.candidate.findFirst({
    where: { id: candidateId, vendorId },
    select: { id: true },
  })
  if (!row) throw new Error('Submission not found')
}

const vendorSubmitBodySchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  location: z.string().min(1),
  pan: z
    .string()
    .min(1)
    .refine((v) => /^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(v.trim()), 'Invalid PAN'),
  totalExperience: z.string().min(1),
  currentCompany: z.string().min(1),
  currentCTC: z.string().min(1),
  expectedCTC: z.string().min(1),
  noticePeriod: z.string().min(1),
  linkedIn: z.string().optional(),
  portfolio: z.string().optional(),
  primarySkills: z.array(z.string()).min(1),
  secondarySkills: z.array(z.string()).optional().default([]),
})

router.get('/me', async (req, res) => {
  const ctx = await getVendorForUser(req.auth!.userId)
  if (!ctx) {
    return res.status(403).json({
      error: 'Your account is not linked to an active vendor organization',
    })
  }

  const { user, vendor } = ctx
  const reqIds = await assignedRequirementIds(vendor.id)

  const [submissionCount, activeJobs, recentSubmissions, byStatus] = await Promise.all([
    prisma.candidate.count({ where: { vendorId: vendor.id } }),
    prisma.requirement.count({
      where: {
        id: { in: reqIds.length ? reqIds : ['__none__'] },
        status: 'LIVE',
      },
    }),
    prisma.candidate.findMany({
      where: { vendorId: vendor.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.candidate.groupBy({
      by: ['status'],
      where: { vendorId: vendor.id },
      _count: { status: true },
    }),
  ])

  const requirements = reqIds.length
    ? await prisma.requirement.findMany({
        where: { id: { in: reqIds } },
        select: { id: true, title: true, jobCode: true },
      })
    : []

  res.json({
    user: { name: user.name, email: user.email, uid: user.id },
    vendor: mapVendor(vendor),
    stats: {
      assignedJobs: activeJobs,
      totalSubmissions: submissionCount,
      statusBreakdown: byStatus.map((s) => ({
        status: s.status,
        count: s._count.status,
      })),
    },
    recentSubmissions: recentSubmissions.map((c) => {
      const req = requirements.find((r) => r.id === c.requirementId)
      return {
        id: c.id,
        name: c.name,
        email: c.email,
        status: c.status,
        jobTitle: c.jobTitle ?? req?.title,
        jobCode: req?.jobCode,
        createdAt: c.createdAt.toISOString(),
      }
    }),
  })
})

router.get('/positions', async (req, res) => {
  const ctx = await getVendorForUser(req.auth!.userId)
  if (!ctx) return res.status(403).json({ error: 'Vendor access not configured' })

  const reqIds = await assignedRequirementIds(ctx.vendor.id)
  if (reqIds.length === 0) return res.json([])

  const rows = await prisma.requirement.findMany({
    where: {
      id: { in: reqIds },
      status: 'LIVE',
      visibleToVendors: true,
    },
    orderBy: { updatedAt: 'desc' },
  })
  res.json(rows.map(mapPortalPosition))
})

router.get('/positions/:id', async (req, res) => {
  const ctx = await getVendorForUser(req.auth!.userId)
  if (!ctx) return res.status(403).json({ error: 'Vendor access not configured' })

  const reqIds = await assignedRequirementIds(ctx.vendor.id)
  if (!reqIds.includes(req.params.id)) {
    return res.status(404).json({ error: 'Position not assigned to your vendor' })
  }

  const row = await prisma.requirement.findUnique({ where: { id: req.params.id } })
  if (!row || row.status !== 'LIVE' || !row.visibleToVendors) {
    return res.status(404).json({ error: 'Position not available' })
  }
  res.json(mapPortalPosition(row))
})

router.post('/parse-resume', handleUploadResume, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Resume file is required' })
    }
    const text = await extractResumeText(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    )
    if (!text) {
      return res.status(422).json({
        error: 'No readable text found in this resume. Enter details manually.',
      })
    }
    const catalog = await getCatalogSkillNames()
    const fields = parseResumeFields(text, catalog)
    res.json({ fields })
  } catch (err) {
    console.error('Vendor resume parse failed:', err)
    const message = err instanceof Error ? err.message : 'Could not parse resume'
    res.status(422).json({ error: message })
  }
})

router.get('/check-email', async (req, res) => {
  const email = typeof req.query.email === 'string' ? req.query.email : ''
  if (!email.trim()) {
    return res.json({ exists: false })
  }
  const existing = await findCandidateByEmail(email)
  if (!existing) {
    return res.json({ exists: false })
  }
  res.json({
    exists: true,
    candidateId: existing.id,
    name: existing.name,
    error: DUPLICATE_CANDIDATE_EMAIL_MESSAGE,
  })
})

router.get('/submissions', async (req, res) => {
  const ctx = await getVendorForUser(req.auth!.userId)
  if (!ctx) return res.status(403).json({ error: 'Vendor access not configured' })

  const rows = await prisma.candidate.findMany({
    where: { vendorId: ctx.vendor.id },
    orderBy: { createdAt: 'desc' },
  })

  const requirementIds = [...new Set(rows.map((c) => c.requirementId).filter(Boolean))] as string[]
  const requirements = requirementIds.length
    ? await prisma.requirement.findMany({ where: { id: { in: requirementIds } } })
    : []
  const reqById = new Map(requirements.map((r) => [r.id, r]))

  res.json(
    rows.map((c) =>
      mapCandidate(c, { requirement: c.requirementId ? reqById.get(c.requirementId) ?? null : null })
    )
  )
})

router.post('/positions/:id/submit', async (req, res) => {
  const ctx = await getVendorForUser(req.auth!.userId)
  if (!ctx) return res.status(403).json({ error: 'Vendor access not configured' })

  const reqIds = await assignedRequirementIds(ctx.vendor.id)
  if (!reqIds.includes(req.params.id)) {
    return res.status(404).json({ error: 'Position not assigned to your vendor' })
  }

  const requirement = await prisma.requirement.findUnique({ where: { id: req.params.id } })
  if (!requirement || requirement.status !== 'LIVE' || !requirement.visibleToVendors) {
    return res.status(404).json({ error: 'Position not open for submissions' })
  }

  const body = vendorSubmitBodySchema.parse(req.body)
  const fullName = `${body.firstName.trim()} ${body.lastName.trim()}`.trim()
  const primarySkills = parseSkillList(body.primarySkills)
  const secondarySkills = parseSkillList(body.secondarySkills ?? [])

  const duplicate = await findCandidateByEmail(body.email)
  if (duplicate) {
    return res.status(409).json({
      error: DUPLICATE_CANDIDATE_EMAIL_MESSAGE,
      existingCandidateId: duplicate.id,
    })
  }

  const skillCorpus = [...primarySkills, ...secondarySkills].join(' ')
  const draft = {
    id: 'draft',
    name: fullName,
    email: body.email.toLowerCase().trim(),
    role: requirement.title,
    status: 'SOURCED',
    matchScore: 0,
    source: `Vendor: ${ctx.vendor.name}`,
    appliedDate: new Date(),
    requirementId: requirement.id,
    jobTitle: requirement.title,
    createdBy: ctx.user.id,
    avatar: null,
    resumeUrl: null,
    resumeFileName: null,
    resumeMimeType: null,
    phone: body.phone.trim(),
    location: body.location.trim(),
    linkedIn: body.linkedIn?.trim() || null,
    portfolio: body.portfolio?.trim() || null,
    totalExperience: body.totalExperience.trim(),
    currentCompany: body.currentCompany.trim(),
    currentCTC: body.currentCTC.trim(),
    expectedCTC: body.expectedCTC.trim(),
    noticePeriod: body.noticePeriod.trim(),
    pan: body.pan.trim().toUpperCase(),
    vendorId: ctx.vendor.id,
    submittedByUserId: ctx.user.id,
    primarySkills: serializeSkills(primarySkills),
    secondarySkills: serializeSkills(secondarySkills),
    resumeText: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const matchScore = computeMatchScore(draft, requirement, skillCorpus).score

  const row = await prisma.candidate.create({
    data: {
      name: fullName,
      email: body.email.toLowerCase().trim(),
      role: requirement.title,
      status: 'SOURCED',
      matchScore,
      source: `Vendor: ${ctx.vendor.name}`,
      requirementId: requirement.id,
      jobTitle: requirement.title,
      phone: body.phone.trim(),
      location: body.location.trim(),
      pan: body.pan.trim().toUpperCase(),
      totalExperience: body.totalExperience.trim(),
      currentCompany: body.currentCompany.trim(),
      currentCTC: body.currentCTC.trim(),
      expectedCTC: body.expectedCTC.trim(),
      noticePeriod: body.noticePeriod.trim(),
      linkedIn: body.linkedIn?.trim() || null,
      portfolio: body.portfolio?.trim() || null,
      primarySkills: serializeSkills(primarySkills),
      secondarySkills: serializeSkills(secondarySkills),
      vendorId: ctx.vendor.id,
      submittedByUserId: ctx.user.id,
      createdBy: ctx.user.id,
    },
  })

  await logActivity({
    entityType: 'CANDIDATE',
    entityId: row.id,
    action: 'VENDOR_SUBMITTED',
    performedBy: ctx.user.id,
    performerName: ctx.user.name,
    performerRole: ctx.user.role,
    details: {
      vendorId: ctx.vendor.id,
      vendorName: ctx.vendor.name,
      requirementId: requirement.id,
      jobCode: requirement.jobCode,
    },
  })

  res.status(201).json(mapCandidate(row, { requirement }))
})

router.post('/submissions/:candidateId/resume', handleUploadResume, async (req, res) => {
  const ctx = await getVendorForUser(req.auth!.userId)
  if (!ctx) return res.status(403).json({ error: 'Vendor access not configured' })

  try {
    await assertVendorOwnsCandidate(ctx.vendor.id, req.params.candidateId)
  } catch {
    return res.status(404).json({ error: 'Submission not found' })
  }

  if (!req.file) return res.status(400).json({ error: 'Resume file is required' })
  if (!isAllowedResumeFile(req.file.mimetype, req.file.originalname)) {
    return res.status(400).json({ error: 'Only PDF, DOC, and DOCX files are allowed' })
  }

  const row = await prisma.candidate.findUnique({ where: { id: req.params.candidateId } })
  if (!row) return res.status(404).json({ error: 'Submission not found' })

  const mime = resolveResumeMime(req.file.mimetype, req.file.originalname)
  await saveResumeFile(row.id, mime, req.file.buffer, req.file.originalname)

  let resumePayload: ReturnType<typeof buildCandidateResumePayload> = {
    resumeText: null,
    primarySkills: row.primarySkills,
    secondarySkills: row.secondarySkills,
  }
  try {
    const text = await extractResumeText(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    )
    const catalog = await getCatalogSkillNames()
    resumePayload = buildCandidateResumePayload(text, catalog)
  } catch {
    /* keep uploaded file without text extraction */
  }

  const requirement = row.requirementId
    ? await prisma.requirement.findUnique({ where: { id: row.requirementId } })
    : null

  const existingPrimary = parseSkillList(row.primarySkills)
  const existingSecondary = parseSkillList(row.secondarySkills)
  const parsedPrimary = parseSkillList(resumePayload.primarySkills)
  const parsedSecondary = parseSkillList(resumePayload.secondarySkills)

  let updated = await prisma.candidate.update({
    where: { id: row.id },
    data: {
      resumeFileName: req.file.originalname,
      resumeMimeType: mime,
      resumeUrl: null,
      resumeText: resumePayload.resumeText ?? row.resumeText,
      primarySkills: serializeSkills(
        existingPrimary.length ? existingPrimary : parsedPrimary
      ),
      secondarySkills: serializeSkills(
        existingSecondary.length ? existingSecondary : parsedSecondary
      ),
      updatedAt: new Date(),
    },
  })

  if (requirement) {
    const corpus = [
      resumePayload.resumeText ?? '',
      ...parseSkillList(updated.primarySkills),
      ...parseSkillList(updated.secondarySkills),
    ]
      .filter(Boolean)
      .join('\n')
    if (corpus.trim()) {
      const { score } = computeMatchScore(updated, requirement, corpus)
      updated = await prisma.candidate.update({
        where: { id: row.id },
        data: { matchScore: score, updatedAt: new Date() },
      })
    }
  }

  await logActivity({
    entityType: 'CANDIDATE',
    entityId: row.id,
    action: 'RESUME_UPLOADED',
    performedBy: ctx.user.id,
    performerName: ctx.user.name,
    performerRole: ctx.user.role,
    details: { fileName: req.file.originalname, vendorId: ctx.vendor.id },
  })

  res.json(mapCandidate(updated, { requirement }))
})

export default router
