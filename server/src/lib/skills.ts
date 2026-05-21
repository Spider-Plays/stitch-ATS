/** Parse comma/newline-separated skill input into a deduped list. */
export function parseSkillList(input: unknown): string[] {
  if (Array.isArray(input)) {
    return [...new Set(input.map((s) => String(s).trim()).filter(Boolean))]
  }
  if (typeof input !== 'string') return []
  return [
    ...new Set(
      input
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter((s) => s.length >= 2 && s.length <= 80)
    ),
  ]
}

export function serializeSkills(skills: string[]): string {
  return JSON.stringify(skills)
}

export function deserializeSkills(raw: string | null | undefined): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed)
      ? [...new Set(parsed.map((s) => String(s).trim()).filter(Boolean))]
      : []
  } catch {
    return parseSkillList(raw)
  }
}

export function normalizeSkillToken(skill: string): string {
  return skill
    .toLowerCase()
    .replace(/[^a-z0-9+#.]/g, '')
    .trim()
}

/** Extract skill-like tokens from resume/JD text using the skill catalog when provided. */
export function extractSkillsFromText(
  text: string,
  catalogNames: string[] = []
): string[] {
  if (!text.trim()) return []

  const found = new Set<string>()
  const lower = text.toLowerCase()
  const normalizedCorpus = lower.replace(/[^a-z0-9+#.\s]/g, ' ')

  for (const name of catalogNames) {
    const token = normalizeSkillToken(name)
    if (!token || token.length < 2) continue
    const pattern = new RegExp(
      `\\b${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
      'i'
    )
    if (pattern.test(normalizedCorpus) || normalizedCorpus.includes(token)) {
      found.add(name)
    }
  }

  const skillsSection = text.match(
    /(?:technical\s+skills?|skills?|technologies|expertise)\s*[:\-]?\s*([\s\S]{10,400})/i
  )
  if (skillsSection?.[1]) {
    const chunk = skillsSection[1].split(/\n\n|\n(?=[A-Z])/)[0] ?? skillsSection[1]
    for (const part of chunk.split(/[,;|•·\n]/)) {
      const cleaned = part.trim().replace(/^[-–•]\s*/, '')
      if (cleaned.length >= 2 && cleaned.length <= 40 && !/^\d+$/.test(cleaned)) {
        found.add(cleaned)
      }
    }
  }

  return [...found].slice(0, 40)
}
