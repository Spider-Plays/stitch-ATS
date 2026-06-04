export const ONE_CLIENT_PER_REQUIREMENT_MSG =
  'Only one client is allowed per requirement'

export function isSingleClientValue(value: string): boolean {
  const name = value.trim()
  if (!name) return false
  return !/[,;|]/.test(name) && !/\s+and\s+/i.test(name)
}
