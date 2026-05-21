/** Human-readable requisition / job code for tagging candidates */
export function generateJobCode(): string {
  const suffix = Date.now().toString(36).toUpperCase().slice(-6)
  return `REQ-${suffix}`
}
