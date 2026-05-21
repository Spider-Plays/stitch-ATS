import type { Vendor as DbVendor } from '@prisma/client'

export function mapVendor(
  v: DbVendor,
  ctx?: { userCount?: number; submissionCount?: number; assignmentCount?: number }
) {
  return {
    id: v.id,
    name: v.name,
    code: v.code ?? undefined,
    email: v.email,
    phone: v.phone ?? undefined,
    website: v.website ?? undefined,
    address: v.address ?? undefined,
    contactName: v.contactName ?? undefined,
    status: v.status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
    notes: v.notes ?? undefined,
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
    userCount: ctx?.userCount,
    submissionCount: ctx?.submissionCount,
    assignmentCount: ctx?.assignmentCount,
  }
}
