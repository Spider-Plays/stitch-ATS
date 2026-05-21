import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { mapUser } from '../utils/mappers.js'
import { mapVendor } from '../lib/mapVendor.js'
import { requireAuth, requireActiveUser, requireRoles } from '../middleware/auth.js'
import { generateTempPassword } from '../lib/password.js'
import { sendInviteEmail } from '../services/email.js'
import { logActivity } from '../services/activityLog.js'
import { INTERNAL_ROLES } from '../lib/roles.js'

const router = Router()
const VENDOR_MANAGERS = ['ADMIN', 'HR_HEAD', 'HR_MANAGER', 'RECRUITER'] as const

router.use(requireAuth, requireActiveUser, requireRoles(...INTERNAL_ROLES))

router.get('/', requireRoles(...VENDOR_MANAGERS), async (_req, res) => {
  try {
    const vendors = await prisma.vendor.findMany({ orderBy: { createdAt: 'desc' } })
    const enriched = await Promise.all(
      vendors.map(async (v) => {
        const [userCount, submissionCount, assignmentCount] = await Promise.all([
          prisma.user.count({ where: { vendorId: v.id, role: 'VENDOR' } }),
          prisma.candidate.count({ where: { vendorId: v.id } }),
          prisma.vendorRequirement.count({ where: { vendorId: v.id } }),
        ])
        return mapVendor(v, { userCount, submissionCount, assignmentCount })
      })
    )
    res.json(enriched)
  } catch (err) {
    console.error('GET /api/vendors failed:', err)
    const msg = err instanceof Error ? err.message : 'Unknown error'
    const hint = msg.includes('vendor') || msg.includes('Unknown arg')
      ? 'Restart the API server after running: cd server && npx prisma generate'
      : msg
    res.status(500).json({ error: hint })
  }
})

router.get('/:id', requireRoles(...VENDOR_MANAGERS), async (req, res) => {
  const vendor = await prisma.vendor.findUnique({ where: { id: req.params.id } })
  if (!vendor) return res.status(404).json({ error: 'Vendor not found' })

  const [users, assignments, submissions] = await Promise.all([
    prisma.user.findMany({
      where: { vendorId: vendor.id, role: 'VENDOR' },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.vendorRequirement.findMany({
      where: { vendorId: vendor.id },
      orderBy: { assignedAt: 'desc' },
    }),
    prisma.candidate.findMany({
      where: { vendorId: vendor.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ])

  const requirementIds = assignments.map((a) => a.requirementId)
  const requirements = requirementIds.length
    ? await prisma.requirement.findMany({ where: { id: { in: requirementIds } } })
    : []
  const reqById = new Map(requirements.map((r) => [r.id, r]))

  res.json({
    ...mapVendor(vendor, {
      userCount: users.length,
      submissionCount: submissions.length,
      assignmentCount: assignments.length,
    }),
    users: users.map(mapUser),
    assignments: assignments.map((a) => {
      const req = reqById.get(a.requirementId)
      return {
        id: a.id,
        requirementId: a.requirementId,
        assignedAt: a.assignedAt.toISOString(),
        title: req?.title,
        jobCode: req?.jobCode,
        status: req?.status,
        department: req?.department,
      }
    }),
    submissions: submissions.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      status: c.status,
      jobTitle: c.jobTitle,
      requirementId: c.requirementId,
      createdAt: c.createdAt.toISOString(),
    })),
  })
})

router.post('/', requireRoles(...VENDOR_MANAGERS), async (req, res) => {
  const body = z
    .object({
      name: z.string().min(1),
      code: z.string().max(32).optional(),
      email: z.string().email(),
      phone: z.string().optional(),
      website: z.string().optional(),
      address: z.string().optional(),
      contactName: z.string().optional(),
      notes: z.string().optional(),
      inviteContact: z.boolean().optional(),
      contactEmail: z.string().email().optional(),
    })
    .parse(req.body)

  const code = body.code?.trim().toUpperCase() || undefined
  if (code) {
    const existing = await prisma.vendor.findUnique({ where: { code } })
    if (existing) return res.status(409).json({ error: 'Vendor code already exists' })
  }

  const vendor = await prisma.vendor.create({
    data: {
      name: body.name.trim(),
      code: code ?? null,
      email: body.email.toLowerCase().trim(),
      phone: body.phone?.trim() || null,
      website: body.website?.trim() || null,
      address: body.address?.trim() || null,
      contactName: body.contactName?.trim() || null,
      notes: body.notes?.trim() || null,
    },
  })

  let invitedUser: ReturnType<typeof mapUser> | undefined
  let temporaryPassword: string | undefined

  if (body.inviteContact !== false) {
    const inviteEmail = (body.contactEmail ?? body.email).toLowerCase().trim()
    const existingUser = await prisma.user.findUnique({ where: { email: inviteEmail } })
    if (!existingUser) {
      const tempPassword = generateTempPassword()
      const passwordHash = await bcrypt.hash(tempPassword, 10)
      const user = await prisma.user.create({
        data: {
          email: inviteEmail,
          passwordHash,
          name: body.contactName?.trim() || vendor.contactName || vendor.name,
          role: 'VENDOR',
          vendorId: vendor.id,
          status: 'ACTIVE',
          permissions: '[]',
        },
      })
      const emailResult = await sendInviteEmail({
        to: inviteEmail,
        name: user.name,
        role: 'VENDOR',
        tempPassword,
      })
      invitedUser = mapUser(user)
      if (!emailResult.sent && emailResult.reason === 'not_configured') {
        temporaryPassword = tempPassword
      }
    }
  }

  await logActivity({
    entityType: 'VENDOR',
    entityId: vendor.id,
    action: 'CREATED',
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
    details: { name: vendor.name },
  })

  res.status(201).json({
    vendor: mapVendor(vendor),
    invitedUser,
    temporaryPassword,
  })
})

router.patch('/:id', requireRoles(...VENDOR_MANAGERS), async (req, res) => {
  const body = z
    .object({
      name: z.string().min(1).optional(),
      code: z.string().max(32).optional().nullable(),
      email: z.string().email().optional(),
      phone: z.string().optional().nullable(),
      website: z.string().optional().nullable(),
      address: z.string().optional().nullable(),
      contactName: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
      status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
    })
    .parse(req.body)

  const existing = await prisma.vendor.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Vendor not found' })

  if (body.code !== undefined && body.code) {
    const dup = await prisma.vendor.findFirst({
      where: { code: body.code.toUpperCase(), NOT: { id: req.params.id } },
    })
    if (dup) return res.status(409).json({ error: 'Vendor code already exists' })
  }

  const row = await prisma.vendor.update({
    where: { id: req.params.id },
    data: {
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.code !== undefined && { code: body.code ? body.code.toUpperCase() : null }),
      ...(body.email !== undefined && { email: body.email.toLowerCase().trim() }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.website !== undefined && { website: body.website }),
      ...(body.address !== undefined && { address: body.address }),
      ...(body.contactName !== undefined && { contactName: body.contactName }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.status !== undefined && { status: body.status }),
    },
  })

  res.json(mapVendor(row))
})

router.post('/:id/assignments', requireRoles(...VENDOR_MANAGERS), async (req, res) => {
  const { requirementIds } = z
    .object({ requirementIds: z.array(z.string().min(1)).min(1) })
    .parse(req.body)

  const vendor = await prisma.vendor.findUnique({ where: { id: req.params.id } })
  if (!vendor) return res.status(404).json({ error: 'Vendor not found' })

  const requirements = await prisma.requirement.findMany({
    where: { id: { in: requirementIds }, status: 'LIVE' },
  })
  if (requirements.length === 0) {
    return res.status(400).json({ error: 'No valid LIVE requirements to assign' })
  }

  await prisma.vendorRequirement.createMany({
    data: requirements.map((r) => ({
      vendorId: vendor.id,
      requirementId: r.id,
      assignedBy: req.auth!.userId,
    })),
    skipDuplicates: true,
  })

  await prisma.requirement.updateMany({
    where: { id: { in: requirements.map((r) => r.id) } },
    data: { visibleToVendors: true },
  })

  res.json({ assigned: requirements.map((r) => r.id) })
})

router.delete('/:id/assignments/:requirementId', requireRoles(...VENDOR_MANAGERS), async (req, res) => {
  await prisma.vendorRequirement.deleteMany({
    where: {
      vendorId: req.params.id,
      requirementId: req.params.requirementId,
    },
  })
  res.status(204).send()
})

router.post('/:id/invite', requireRoles(...VENDOR_MANAGERS), async (req, res) => {
  const body = z
    .object({
      email: z.string().email(),
      name: z.string().min(1).optional(),
    })
    .parse(req.body)

  const vendor = await prisma.vendor.findUnique({ where: { id: req.params.id } })
  if (!vendor) return res.status(404).json({ error: 'Vendor not found' })
  if (vendor.status !== 'ACTIVE') {
    return res.status(400).json({ error: 'Vendor must be active to invite users' })
  }

  const email = body.email.toLowerCase().trim()
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return res.status(409).json({ error: 'A user with this email already exists' })

  const tempPassword = generateTempPassword()
  const passwordHash = await bcrypt.hash(tempPassword, 10)
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: body.name?.trim() || email.split('@')[0],
      role: 'VENDOR',
      vendorId: vendor.id,
      status: 'ACTIVE',
      permissions: '[]',
    },
  })

  const emailResult = await sendInviteEmail({
    to: email,
    name: user.name,
    role: 'VENDOR',
    tempPassword,
  })

  res.status(201).json({
    user: mapUser(user),
    emailSent: emailResult.sent,
    ...(emailResult.sent === false && emailResult.reason === 'not_configured'
      ? { temporaryPassword: tempPassword }
      : {}),
  })
})

export default router
