import type { ApprovalHistory } from '../types'

export function formatApprovalEventLabel(
  event: ApprovalHistory,
  performerName?: string
): string {
  const name = performerName || event.by
  const roleLabel = event.role.replace(/_/g, ' ')
  if (event.onBehalfOf === 'HR_HEAD') {
    return `${event.action} by ${name} (${roleLabel}) on behalf of HR Head`
  }
  return `${event.action} by ${name} (${roleLabel})`
}
