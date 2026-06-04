export const HR_HEAD_DELEGATE = 'HR_HEAD' as const

export type RequirementApprovalBody = {
  onBehalfOfHrHead?: boolean
}

export function parseRequirementApprovalBody(body: unknown): RequirementApprovalBody {
  if (!body || typeof body !== 'object') return {}
  const o = body as Record<string, unknown>
  return { onBehalfOfHrHead: o.onBehalfOfHrHead === true }
}

export function buildApprovalRecord(
  decision: 'APPROVED' | 'REJECTED',
  auth: { userId: string; role: string },
  onBehalfOfHrHead: boolean
) {
  const timestamp = new Date().toISOString()
  const onBehalf =
    auth.role === 'ADMIN' && onBehalfOfHrHead ? HR_HEAD_DELEGATE : undefined

  return {
    timestamp,
    historyEntry: {
      action: decision,
      by: auth.userId,
      at: timestamp,
      role: auth.role,
      ...(onBehalf ? { onBehalfOf: onBehalf } : {}),
    },
    approval: {
      decision,
      decidedBy: auth.userId,
      decidedAt: timestamp,
      ...(onBehalf ? { onBehalfOf: onBehalf, performedByRole: auth.role } : {}),
    },
  }
}
