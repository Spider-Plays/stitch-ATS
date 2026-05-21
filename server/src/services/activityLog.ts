import { prisma } from '../lib/prisma.js'

export async function logActivity(data: {
  entityType: string
  entityId: string
  action: string
  performedBy: string
  performerName?: string
  performerRole?: string
  details?: unknown
}) {
  try {
    let performerName = data.performerName
    let performerRole = data.performerRole
    if (!performerName && data.performedBy) {
      const u = await prisma.user.findUnique({
        where: { id: data.performedBy },
        select: { name: true, role: true },
      })
      performerName = u?.name
      performerRole = performerRole ?? u?.role
    }

    await prisma.activityLog.create({
      data: {
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        performedBy: data.performedBy,
        performerName: performerName ?? null,
        performerRole: performerRole ?? null,
        details: data.details ? JSON.stringify(data.details) : null,
      },
    })
  } catch (e) {
    console.error('Activity log failed:', e)
  }
}
