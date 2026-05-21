import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { mapCandidate } from '../utils/mappers.js'
import { requireAuth, requireActiveUser, requireRoles } from '../middleware/auth.js'
import { logActivity } from '../services/activityLog.js'
import { INTERNAL_ROLES, STAFF_MUTATE } from '../lib/roles.js'
import { syncRequirementFilled } from '../lib/hiring.js'
import { handleUploadResume } from '../middleware/uploadResume.js'
import {
  deleteResumeFile,
  findResumeFile,
  isAllowedResumeFile,
  resolveResumeMime,
  saveResumeFile,
} from '../lib/resumeStorage.js'
import fs from 'fs/promises'
import {
  DUPLICATE_CANDIDATE_EMAIL_MESSAGE,
  findCandidateByEmail,
} from '../lib/candidateDuplicate.js'
import {
  buildCandidateResumePayload,
  extractResumeText,
  parseResumeFields,
} from '../lib/resumeParse.js'
import { getCatalogSkillNames } from '../lib/skillCatalog.js'
import { serializeSkills, parseSkillList } from '../lib/skills.js'
import { computeMatchScore } from '../lib/profileMatching.js'

const router = Router()
router.use(requireAuth, requireActiveUser, requireRoles(...INTERNAL_ROLES))

router.get('/', async (_req, res) => {
  const rows = await prisma.candidate.findMany({ orderBy: { appliedDate: 'desc' } })
  const requirementIds = [
    ...new Set(rows.map((r) => r.requirementId).filter((id): id is string => !!id)),
  ]
  const creatorIds = [
    ...new Set(rows.map((r) => r.createdBy).filter((id): id is string => !!id)),
  ]
  const [requirements, recruiters] = await Promise.all([
    requirementIds.length
      ? prisma.requirement.findMany({
          where: { id: { in: requirementIds } },
          select: { id: true, jobCode: true, client: true, title: true },
        })
      : [],
    creatorIds.length
      ? prisma.user.findMany({
          where: { id: { in: creatorIds } },
          select: { id: true, name: true },
        })
      : [],
  ])
  const reqById = new Map(requirements.map((r) => [r.id, r]))
  const recruiterById = new Map(recruiters.map((u) => [u.id, u]))
  res.json(
    rows.map((c) =>
      mapCandidate(c, {
        requirement: c.requirementId ? reqById.get(c.requirementId) ?? null : null,
        recruiter: c.createdBy ? recruiterById.get(c.createdBy) ?? null : null,
      })
    )
  )
})

router.get('/by-requirement/:requirementId', async (req, res) => {
  const rows = await prisma.candidate.findMany({
    where: { requirementId: req.params.requirementId },
    orderBy: { appliedDate: 'desc' },
  })
  res.json(rows.map((c) => mapCandidate(c)))
})

router.post('/parse-resume', requireRoles(...STAFF_MUTATE), handleUploadResume, async (req, res) => {
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
    console.error('Resume parse failed:', err)
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

router.get('/:id/resume', async (req, res) => {
  try {
    const row = await prisma.candidate.findUnique({ where: { id: req.params.id } })
    if (!row) return res.status(404).json({ error: 'Not found' })
    if (!row.resumeFileName) return res.status(404).json({ error: 'No resume uploaded' })

    const stored = await findResumeFile(row.id)
    if (!stored) return res.status(404).json({ error: 'Resume file missing' })

    const buffer = await fs.readFile(stored.filePath)
    res.setHeader('Content-Type', row.resumeMimeType || stored.mime)
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(row.resumeFileName)}"`
    )
    res.send(buffer)
  } catch (err) {
    console.error('Resume download failed:', err)
    res.status(500).json({ error: 'Failed to load resume' })
  }
})

router.post('/:id/resume', requireRoles(...STAFF_MUTATE), handleUploadResume, async (req, res) => {
  try {
    const row = await prisma.candidate.findUnique({ where: { id: req.params.id } })
    if (!row) return res.status(404).json({ error: 'Not found' })
    if (!req.file) return res.status(400).json({ error: 'Resume file is required' })
    if (!isAllowedResumeFile(req.file.mimetype, req.file.originalname)) {
      return res.status(400).json({ error: 'Only PDF, DOC, and DOCX files are allowed' })
    }

    const mime = resolveResumeMime(req.file.mimetype, req.file.originalname)
    await saveResumeFile(row.id, mime, req.file.buffer, req.file.originalname)

    let resumePayload: ReturnType<typeof buildCandidateResumePayload> = {
      resumeText: null,
      primarySkills: '[]',
      secondarySkills: '[]',
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
      /* keep file without text extraction */
    }

    let updated = await prisma.candidate.update({
      where: { id: row.id },
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

    if (updated.requirementId && resumePayload.resumeText) {
      const requirement = await prisma.requirement.findUnique({
        where: { id: updated.requirementId },
      })
      if (requirement) {
        const { score } = computeMatchScore(
          updated,
          requirement,
          resumePayload.resumeText
        )
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
      performedBy: req.auth!.userId,
      details: { fileName: req.file.originalname },
    })

    res.json(mapCandidate(updated))
  } catch (err) {
    console.error('Resume upload failed:', err)
    const message = err instanceof Error ? err.message : 'Failed to save resume'
    res.status(500).json({ error: message })
  }
})

router.delete('/:id/resume', async (req, res) => {
  const row = await prisma.candidate.findUnique({ where: { id: req.params.id } })
  if (!row) return res.status(404).json({ error: 'Not found' })

  await deleteResumeFile(row.id)
  const updated = await prisma.candidate.update({
    where: { id: row.id },
    data: {
      resumeFileName: null,
      resumeMimeType: null,
      resumeUrl: null,
      updatedAt: new Date(),
    },
  })

  res.json(mapCandidate(updated))
})

router.get('/:id', async (req, res) => {
  const row = await prisma.candidate.findUnique({ where: { id: req.params.id } })
  if (!row) return res.status(404).json({ error: 'Not found' })
  const [requirement, recruiter] = await Promise.all([
    row.requirementId
      ? prisma.requirement.findUnique({
          where: { id: row.requirementId },
          select: { id: true, jobCode: true, client: true, title: true },
        })
      : null,
    row.createdBy
      ? prisma.user.findUnique({
          where: { id: row.createdBy },
          select: { id: true, name: true },
        })
      : null,
  ])
  res.json(mapCandidate(row, { requirement, recruiter }))
})

router.post('/', requireRoles(...STAFF_MUTATE), async (req, res) => {
  const body = req.body
  if (!body.email?.trim()) {
    return res.status(400).json({ error: 'Email is required' })
  }

  const duplicate = await findCandidateByEmail(body.email)
  if (duplicate) {
    return res.status(409).json({
      error: DUPLICATE_CANDIDATE_EMAIL_MESSAGE,
      existingCandidateId: duplicate.id,
    })
  }

  const requirementId = body.requirementId || null
  let matchScore = typeof body.matchScore === 'number' ? body.matchScore : 0

  if (requirementId) {
    const requirement = await prisma.requirement.findUnique({
      where: { id: requirementId },
    })
    if (requirement) {
      const resumeText =
        typeof body.resumeText === 'string' ? body.resumeText : ''
      const skillCorpus = [
        ...parseSkillList(body.primarySkills),
        ...parseSkillList(body.secondarySkills),
      ].join(' ')
      const draft = {
        id: 'draft',
        name: body.name,
        email: body.email,
        role: body.role,
        status: body.status ?? 'SOURCED',
        matchScore: 0,
        source: body.source ?? 'Direct',
        appliedDate: new Date(),
        requirementId: null,
        jobTitle: null,
        createdBy: req.auth!.userId,
        avatar: null,
        resumeUrl: null,
        resumeFileName: null,
        resumeMimeType: null,
        phone: body.phone ?? null,
        location: body.location ?? null,
        linkedIn: body.linkedIn ?? null,
        portfolio: body.portfolio ?? null,
        totalExperience: body.totalExperience ?? null,
        currentCompany: body.currentCompany ?? null,
        currentCTC: body.currentCTC ?? null,
        expectedCTC: body.expectedCTC ?? null,
        noticePeriod: body.noticePeriod ?? null,
        pan: body.pan?.trim()?.toUpperCase() || null,
        vendorId: null,
        submittedByUserId: null,
        primarySkills: serializeSkills(parseSkillList(body.primarySkills)),
        secondarySkills: serializeSkills(parseSkillList(body.secondarySkills)),
        resumeText: resumeText || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      matchScore = computeMatchScore(
        draft,
        requirement,
        [resumeText, skillCorpus].filter(Boolean).join('\n')
      ).score
    }
  }

  const row = await prisma.candidate.create({
    data: {
      name: body.name,
      email: body.email,
      role: body.role,
      status: body.status ?? 'APPLIED',
      matchScore,
      source: body.source ?? 'Direct',
      requirementId,
      jobTitle: body.jobTitle,
      avatar: body.avatar,
      phone: body.phone,
      location: body.location,
      linkedIn: body.linkedIn,
      portfolio: body.portfolio,
      totalExperience: body.totalExperience,
      currentCompany: body.currentCompany,
      currentCTC: body.currentCTC,
      expectedCTC: body.expectedCTC,
      noticePeriod: body.noticePeriod,
      pan: body.pan?.trim()?.toUpperCase() || null,
      primarySkills: serializeSkills(parseSkillList(body.primarySkills)),
      secondarySkills: serializeSkills(parseSkillList(body.secondarySkills)),
      resumeText: typeof body.resumeText === 'string' ? body.resumeText : null,
      createdBy: req.auth!.userId,
    },
  })
  await logActivity({
    entityType: 'CANDIDATE',
    entityId: row.id,
    action: 'CREATED',
    performedBy: req.auth!.userId,
    details: { name: body.name, role: body.role },
  })
  res.status(201).json(mapCandidate(row))
})

router.patch('/:id', requireRoles(...STAFF_MUTATE), async (req, res) => {
  try {
    const b = req.body
    if (b.email !== undefined) {
      const duplicate = await findCandidateByEmail(b.email, req.params.id)
      if (duplicate) {
        return res.status(409).json({
          error: DUPLICATE_CANDIDATE_EMAIL_MESSAGE,
          existingCandidateId: duplicate.id,
        })
      }
    }

    const row = await prisma.candidate.update({
      where: { id: req.params.id },
      data: {
        ...(b.name !== undefined && { name: b.name }),
        ...(b.email !== undefined && { email: b.email }),
        ...(b.role !== undefined && { role: b.role }),
        ...(b.status !== undefined && { status: b.status }),
        ...(b.matchScore !== undefined && { matchScore: b.matchScore }),
        ...(b.source !== undefined && { source: b.source }),
        ...(b.requirementId !== undefined && {
          requirementId: b.requirementId === '' ? null : b.requirementId,
        }),
        ...(b.jobTitle !== undefined && { jobTitle: b.jobTitle }),
        ...(b.avatar !== undefined && { avatar: b.avatar }),
        ...(b.phone !== undefined && { phone: b.phone }),
        ...(b.location !== undefined && { location: b.location }),
        ...(b.linkedIn !== undefined && { linkedIn: b.linkedIn }),
        ...(b.portfolio !== undefined && { portfolio: b.portfolio }),
        ...(b.totalExperience !== undefined && { totalExperience: b.totalExperience }),
        ...(b.currentCompany !== undefined && { currentCompany: b.currentCompany }),
        ...(b.currentCTC !== undefined && { currentCTC: b.currentCTC }),
        ...(b.expectedCTC !== undefined && { expectedCTC: b.expectedCTC }),
        ...(b.noticePeriod !== undefined && { noticePeriod: b.noticePeriod }),
        ...(b.pan !== undefined && {
          pan: b.pan?.trim() ? b.pan.trim().toUpperCase() : null,
        }),
        updatedAt: new Date(),
      },
    })
    await logActivity({
      entityType: 'CANDIDATE',
      entityId: row.id,
      action: 'UPDATED',
      performedBy: req.auth!.userId,
      details: Object.keys(req.body),
    })
    res.json(mapCandidate(row))
  } catch (err) {
    console.error('Candidate update failed:', err)
    res.status(500).json({ error: 'Failed to update candidate' })
  }
})

router.patch('/:id/status', requireRoles(...STAFF_MUTATE), async (req, res) => {
  const { status } = req.body
  const row = await prisma.candidate.update({
    where: { id: req.params.id },
    data: { status, updatedAt: new Date() },
  })
  if (status === 'HIRED' && row.requirementId) {
    await syncRequirementFilled(row.requirementId)
  }
  await logActivity({
    entityType: 'CANDIDATE',
    entityId: row.id,
    action: 'STATUS_CHANGED',
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
    details: { newStatus: status },
  })
  res.json(mapCandidate(row))
})

router.delete('/:id', requireRoles('ADMIN'), async (req, res) => {
  const row = await prisma.candidate.findUnique({ where: { id: req.params.id } })
  if (!row) return res.status(404).json({ error: 'Not found' })

  const interviews = await prisma.interview.findMany({
    where: { candidateId: row.id },
    select: { id: true },
  })
  const interviewIds = interviews.map((i) => i.id)

  await prisma.$transaction([
    prisma.feedback.deleteMany({
      where: {
        OR: [{ candidateId: row.id }, { interviewId: { in: interviewIds } }],
      },
    }),
    prisma.interview.deleteMany({ where: { candidateId: row.id } }),
    prisma.offer.deleteMany({ where: { candidateId: row.id } }),
    prisma.activityLog.deleteMany({
      where: { entityType: 'CANDIDATE', entityId: row.id },
    }),
  ])

  await deleteResumeFile(row.id)
  await prisma.candidate.delete({ where: { id: row.id } })
  if (row.requirementId) await syncRequirementFilled(row.requirementId)

  await logActivity({
    entityType: 'CANDIDATE',
    entityId: row.id,
    action: 'DELETED',
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
    details: { name: row.name, email: row.email },
  })

  res.status(204).send()
})

export default router
