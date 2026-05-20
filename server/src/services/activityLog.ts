import { prisma } from '../lib/prisma.js'

export async function logActivity(data: {
  entityType: string
  entityId: string
  action: string
  performedBy: string
  performerRole?: string
  details?: unknown
}) {
  try {
    await prisma.activityLog.create({
      data: {
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        performedBy: data.performedBy,
        performerRole: data.performerRole,
        details: data.details ? JSON.stringify(data.details) : null,
      },
    })
  } catch (e) {
    console.error('Activity log failed:', e)
  }
}
