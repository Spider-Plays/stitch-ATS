export type PortalJobStatus = 'ACTIVE' | 'CLOSED'

const CLOSED_REQUIREMENT_STATUSES = new Set(['CLOSED', 'ON_HOLD', 'CANCELLED'])

export function resolvePortalJobStatus(
  requirementStatus: string,
  listedOnPortal: boolean,
  pipelineStatus: string
): PortalJobStatus {
  if (pipelineStatus === 'HIRED') return 'CLOSED'
  if (!listedOnPortal) return 'CLOSED'
  if (CLOSED_REQUIREMENT_STATUSES.has(requirementStatus)) return 'CLOSED'
  return 'ACTIVE'
}

export function portalJobStatusLabel(status: PortalJobStatus): string {
  return status === 'CLOSED' ? 'Closed' : 'Active'
}
