const CLOSED_REQUIREMENT_STATUSES = new Set(['CLOSED', 'ON_HOLD', 'CANCELLED'])

export type PortalJobStatus = 'ACTIVE' | 'CLOSED'

export function isRequirementListedOnPortal(requirement: {
  status: string
  visibleToCandidates: boolean
}): boolean {
  return requirement.status === 'LIVE' && requirement.visibleToCandidates
}

export function resolvePortalJobStatus(
  requirement: { status: string; visibleToCandidates: boolean },
  pipelineStatus: string
): PortalJobStatus {
  if (pipelineStatus === 'HIRED') return 'CLOSED'
  if (!isRequirementListedOnPortal(requirement)) return 'CLOSED'
  if (CLOSED_REQUIREMENT_STATUSES.has(requirement.status)) return 'CLOSED'
  return 'ACTIVE'
}

export function portalJobClosedReason(
  requirement: { status: string; visibleToCandidates: boolean },
  pipelineStatus: string
): string | undefined {
  if (resolvePortalJobStatus(requirement, pipelineStatus) === 'ACTIVE') {
    return undefined
  }
  if (pipelineStatus === 'HIRED') {
    return 'You have joined — this application is closed on the portal.'
  }
  if (requirement.status === 'ON_HOLD') {
    return 'This position is on hold and is closed for updates on the portal.'
  }
  if (requirement.status === 'CANCELLED') {
    return 'This position was cancelled and is closed on the portal.'
  }
  if (requirement.status === 'CLOSED') {
    return 'This position is closed.'
  }
  if (!requirement.visibleToCandidates) {
    return 'This role is no longer visible on the candidate portal.'
  }
  return 'This application is closed on the portal.'
}
