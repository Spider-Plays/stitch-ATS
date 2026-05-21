/** Returns true when query is empty or any field contains the query (case-insensitive). */
export function matchesAnySearch(
  fields: (string | number | undefined | null)[],
  query: string
): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return fields.some((f) => f != null && String(f).toLowerCase().includes(q))
}
