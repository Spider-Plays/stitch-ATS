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

  const body = z
    .object({
      name: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(1),
      role: z.string().min(1),
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
    })
    .parse(req.body)

  const duplicate = await findCandidateByEmail(body.email)
  if (duplicate) {
    return res.status(409).json({
      error: DUPLICATE_CANDIDATE_EMAIL_MESSAGE,
      existingCandidateId: duplicate.id,
    })
  }

  const row = await prisma.candidate.create({
    data: {
      name: body.name.trim(),
      email: body.email.toLowerCase().trim(),
      role: body.role.trim(),
      status: 'SOURCED',
      matchScore: 0,
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

export default router
