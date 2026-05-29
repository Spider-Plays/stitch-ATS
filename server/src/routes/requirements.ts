import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { mapCandidate, mapRequirement } from '../utils/mappers.js'
import { requireAuth, requireActiveUser, requireRoles } from '../middleware/auth.js'
import { INTERNAL_ROLES, REQ_APPROVERS, STAFF_MUTATE } from '../lib/roles.js'
import { logActivity } from '../services/activityLog.js'
import { generateJobCode } from '../lib/jobCode.js'
import { parseSkillList, serializeSkills } from '../lib/skills.js'
import {
  computeMatchScore,
  loadCandidateResumeText,
  rankCandidatesForRequirement,
} from '../lib/profileMatching.js'
import {
  appendRequirementVersion,
  parseRequirementVersions,
  snapshotLinkedCandidates,
  snapshotMatchingProfiles,
} from '../lib/requirementVersions.js'
const router = Router()
router.use(requireAuth, requireActiveUser, requireRoles(...INTERNAL_ROLES))

router.get('/', async (_req, res) => {
  const rows = await prisma.requirement.findMany({ orderBy: { createdAt: 'desc' } })
  res.json(rows.map(mapRequirement))
})

router.get('/pending', async (_req, res) => {
  const rows = await prisma.requirement.findMany({
    where: { status: 'PENDING_APPROVAL' },
    orderBy: { createdAt: 'desc' },
  })
  res.json(rows.map(mapRequirement))
})

router.get('/:id/matching-profiles', async (req, res) => {
  const requirement = await prisma.requirement.findUnique({
    where: { id: req.params.id },
  })
  if (!requirement) return res.status(404).json({ error: 'Not found' })

  const candidates = await prisma.candidate.findMany({
    orderBy: { updatedAt: 'desc' },
  })
  const ranked = await rankCandidatesForRequirement(
    candidates,
    requirement,
    req.params.id
  )

  const candidateById = new Map(candidates.map((c) => [c.id, c]))
  const minScore = Number(req.query.minScore) || 15

  const matches = ranked
    .filter((m) => m.alreadyLinked || m.matchScore >= minScore)
    .slice(0, 40)
    .map((m) => {
      const c = candidateById.get(m.candidateId)!
      return {
        candidateId: m.candidateId,
        matchScore: m.matchScore,
        breakdown: m.breakdown,
        alreadyLinked: m.alreadyLinked,
        linkedToOther: m.linkedToOther,
        candidate: mapCandidate(c, { requirement }),
      }
    })

  res.json({ matches, totalCandidates: candidates.length })
})

router.post('/:id/link-candidate', requireRoles(...STAFF_MUTATE), async (req, res) => {
  const candidateId =
    typeof req.body.candidateId === 'string' ? req.body.candidateId : ''
  if (!candidateId) {
    return res.status(400).json({ error: 'candidateId is required' })
  }

  const [requirement, candidate] = await Promise.all([
    prisma.requirement.findUnique({ where: { id: req.params.id } }),
    prisma.candidate.findUnique({ where: { id: candidateId } }),
  ])

  if (!requirement) return res.status(404).json({ error: 'Requirement not found' })
  if (!candidate) return res.status(404).json({ error: 'Candidate not found' })

  const resumeText = await loadCandidateResumeText(candidate)
  const { score } = computeMatchScore(candidate, requirement, resumeText)

  const updated = await prisma.candidate.update({
    where: { id: candidateId },
    data: {
      requirementId: requirement.id,
      matchScore: score,
      jobTitle: requirement.title,
      updatedAt: new Date(),
    },
  })

  await logActivity({
    entityType: 'CANDIDATE',
    entityId: candidate.id,
    action: 'LINKED_TO_REQUIREMENT',
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
    details: {
      requirementId: requirement.id,
      jobCode: requirement.jobCode,
      matchScore: score,
    },
  })

  await appendRequirementVersion(requirement.id, {
    changedBy: req.auth!.userId,
    kind: 'CANDIDATE_LINKED',
    changes: {
      candidateId: candidate.id,
      candidateName: candidate.name,
      candidateEmail: candidate.email,
      matchScore: score,
    },
    incrementVersion: false,
  })

  res.json(mapCandidate(updated, { requirement }))
})

router.get('/:id', async (req, res) => {
  const row = await prisma.requirement.findUnique({ where: { id: req.params.id } })
  if (!row) return res.status(404).json({ error: 'Not found' })
  res.json(mapRequirement(row))
})

router.post('/', requireRoles(...STAFF_MUTATE, 'HIRING_MANAGER'), async (req, res) => {
  const body = req.body
  const timestamp = new Date()
  const jobCode =
    typeof body.jobCode === 'string' && body.jobCode.trim()
      ? body.jobCode.trim().toUpperCase()
      : generateJobCode()
  const row = await prisma.requirement.create({
    data: {
      jobCode,
      client: typeof body.client === 'string' ? body.client.trim() || null : null,
      title: body.title,
      department: body.department,
      hiringManager: body.hiringManager,
      status: 'PENDING_APPROVAL',
      openings: body.openings,
      filled: 0,
      priority: body.priority,
      location: body.location,
      description:
        body.description ??
        (typeof body.jobDescription === 'string'
          ? body.jobDescription.slice(0, 2000)
          : null),
      jobDescription:
        typeof body.jobDescription === 'string'
          ? body.jobDescription
          : body.description ?? null,
      primarySkills: serializeSkills(parseSkillList(body.primarySkills)),
      secondarySkills: serializeSkills(parseSkillList(body.secondarySkills)),
      createdBy: body.createdBy ?? req.auth!.userId,
      createdByRole: body.createdByRole ?? req.auth!.role,
      recruiters: '[]',
      approval: JSON.stringify({ decision: 'PENDING' }),
      approvalHistory: JSON.stringify([
        {
          action: 'REQUESTED',
          by: body.createdBy ?? req.auth!.userId,
          at: timestamp.toISOString(),
          role: body.createdByRole ?? req.auth!.role,
        },
      ]),
      versions: '[]',
      currentVersion: 1,
      visibleToCandidates: body.visibleToCandidates ?? false,
    },
  })
  await logActivity({
    entityType: 'REQUIREMENT',
    entityId: row.id,
    action: 'CREATED',
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
    details: { title: body.title },
  })
  res.status(201).json(mapRequirement(row))
})

router.patch('/:id', requireRoles(...STAFF_MUTATE, 'HIRING_MANAGER'), async (req, res) => {
  const existing = await prisma.requirement.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Not found' })

  const data = { ...req.body } as Record<string, unknown>
  delete data._user

  if (data.department !== undefined && req.auth!.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only admins can change department' })
  }

  const versions = parseRequirementVersions(existing.versions)
  const timestamp = new Date().toISOString()
  const [linkedCandidates, matchingProfiles] = await Promise.all([
    snapshotLinkedCandidates(req.params.id),
    snapshotMatchingProfiles(existing, req.params.id),
  ])

  versions.push({
    version: existing.currentVersion,
    changedBy: req.auth!.userId,
    changedAt: timestamp,
    kind: 'UPDATE',
    changes: data,
    linkedCandidates,
    matchingProfiles,
  })

  const row = await prisma.requirement.update({
    where: { id: req.params.id },
    data: {
      ...pickRequirementFields(data),
      updatedAt: new Date(),
      currentVersion: existing.currentVersion + 1,
      versions: JSON.stringify(versions),
    },
  })
  await logActivity({
    entityType: 'REQUIREMENT',
    entityId: row.id,
    action: 'UPDATED',
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
    details: Object.keys(data),
  })
  res.json(mapRequirement(row))
})

const REQUIREMENT_STATUSES = [
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'LIVE',
  'ON_HOLD',
  'CLOSED',
  'REJECTED',
] as const

router.patch('/:id/status', requireRoles('ADMIN', 'HR_HEAD', 'HR_MANAGER'), async (req, res) => {
  const status = req.body.status as string
  if (!REQUIREMENT_STATUSES.includes(status as (typeof REQUIREMENT_STATUSES)[number])) {
    return res.status(400).json({ error: 'Invalid status' })
  }

  const existing = await prisma.requirement.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Not found' })

  const row = await prisma.requirement.update({
    where: { id: req.params.id },
    data: {
      status,
      updatedAt: new Date(),
      ...(status === 'ON_HOLD' && { visibleToCandidates: false }),
      ...(status === 'LIVE' && existing.status === 'ON_HOLD' && { visibleToCandidates: true }),
    },
  })

  await logActivity({
    entityType: 'REQUIREMENT',
    entityId: row.id,
    action: 'STATUS_CHANGED',
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
    details: { status },
  })

  res.json(mapRequirement(row))
})

router.patch('/:id/visibility', requireRoles('ADMIN', 'HR_HEAD', 'HR_MANAGER'), async (req, res) => {
  const visibleToCandidates = Boolean(req.body.visibleToCandidates)
  const existing = await prisma.requirement.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Not found' })

  const row = await prisma.requirement.update({
    where: { id: req.params.id },
    data: { visibleToCandidates, updatedAt: new Date() },
  })

  await logActivity({
    entityType: 'REQUIREMENT',
    entityId: row.id,
    action: visibleToCandidates ? 'VISIBLE_ON_PORTAL' : 'HIDDEN_FROM_PORTAL',
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
  })

  res.json(mapRequirement(row))
})

router.post('/:id/approve', requireRoles(...REQ_APPROVERS), async (req, res) => {
  const existing = await prisma.requirement.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Not found' })
  const timestamp = new Date().toISOString()
  const history = JSON.parse(existing.approvalHistory || '[]')
  history.push({ action: 'APPROVED', by: req.auth!.userId, at: timestamp, role: req.auth!.role })
  const row = await prisma.requirement.update({
    where: { id: req.params.id },
    data: {
      status: 'LIVE',
      visibleToCandidates: true,
      approval: JSON.stringify({ decision: 'APPROVED', decidedBy: req.auth!.userId, decidedAt: timestamp }),
      approvalHistory: JSON.stringify(history),
      updatedAt: new Date(),
    },
  })
  await logActivity({ entityType: 'REQUIREMENT', entityId: row.id, action: 'APPROVED', performedBy: req.auth!.userId, performerRole: req.auth!.role })
  res.json(mapRequirement(row))
})

router.post('/:id/reject', requireRoles(...REQ_APPROVERS), async (req, res) => {
  const existing = await prisma.requirement.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Not found' })
  const timestamp = new Date().toISOString()
  const history = JSON.parse(existing.approvalHistory || '[]')
  history.push({ action: 'REJECTED', by: req.auth!.userId, at: timestamp, role: req.auth!.role })
  const row = await prisma.requirement.update({
    where: { id: req.params.id },
    data: {
      status: 'REJECTED',
      approval: JSON.stringify({ decision: 'REJECTED', decidedBy: req.auth!.userId, decidedAt: timestamp }),
      approvalHistory: JSON.stringify(history),
      updatedAt: new Date(),
    },
  })
  await logActivity({ entityType: 'REQUIREMENT', entityId: row.id, action: 'REJECTED', performedBy: req.auth!.userId, performerRole: req.auth!.role })
  res.json(mapRequirement(row))
})

router.post('/:id/assign-recruiter', requireRoles(...STAFF_MUTATE), async (req, res) => {
  const { recruiterId } = req.body
  const existing = await prisma.requirement.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Not found' })
  const recruiters: string[] = JSON.parse(existing.recruiters || '[]')
  if (recruiters.includes(recruiterId)) return res.json(mapRequirement(existing))
  recruiters.push(recruiterId)
  const row = await prisma.requirement.update({
    where: { id: req.params.id },
    data: { recruiters: JSON.stringify(recruiters), updatedAt: new Date() },
  })
  await logActivity({
    entityType: 'REQUIREMENT',
    entityId: row.id,
    action: 'RECRUITER_ASSIGNED',
    performedBy: req.auth!.userId,
    details: { recruiterId },
  })
  res.json(mapRequirement(row))
})

router.delete('/:id', requireRoles('ADMIN'), async (req, res) => {
  const existing = await prisma.requirement.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Not found' })

  const interviews = await prisma.interview.findMany({
    where: { requirementId: req.params.id },
    select: { id: true },
  })
  const interviewIds = interviews.map((i) => i.id)

  await prisma.$transaction([
    prisma.feedback.deleteMany({ where: { interviewId: { in: interviewIds } } }),
    prisma.interview.deleteMany({ where: { requirementId: req.params.id } }),
    prisma.offer.deleteMany({ where: { requirementId: req.params.id } }),
    prisma.candidate.updateMany({
      where: { requirementId: req.params.id },
      data: { requirementId: null, updatedAt: new Date() },
    }),
    prisma.activityLog.deleteMany({
      where: { entityType: 'REQUIREMENT', entityId: req.params.id },
    }),
  ])

  await prisma.requirement.delete({ where: { id: req.params.id } })
  res.status(204).send()
})

function pickRequirementFields(data: Record<string, unknown>) {
  const allowed = [
    'jobCode',
    'client',
    'title',
    'department',
    'hiringManager',
    'status',
    'openings',
    'filled',
    'priority',
    'location',
    'description',
    'jobDescription',
    'primarySkills',
    'secondarySkills',
    'visibleToCandidates',
  ]
  const out: Record<string, unknown> = {}
  for (const k of allowed) {
    if (data[k] !== undefined) out[k] = data[k]
  }
  if (data.primarySkills !== undefined) {
    out.primarySkills = serializeSkills(parseSkillList(data.primarySkills))
  }
  if (data.secondarySkills !== undefined) {
    out.secondarySkills = serializeSkills(parseSkillList(data.secondarySkills))
  }
  return out
}

export default router
