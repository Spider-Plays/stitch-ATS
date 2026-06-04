export const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'] as const
export const WORK_MODES = ['REMOTE', 'HYBRID', 'ONSITE'] as const
export const SENIORITY_LEVELS = ['JUNIOR', 'MID', 'SENIOR', 'LEAD', 'PRINCIPAL'] as const

const WORK_MODE_LABELS: Record<string, string> = {
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
  ONSITE: 'On-site',
}

export function parseOptionalInt(value: unknown, max = 50): number | null {
  if (value === '' || value === null || value === undefined) return null
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n) || n < 0 || n > max) return null
  return Math.floor(n)
}

export function parseOptionalEnum(value: unknown, allowed: readonly string[]): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  const v = value.trim().toUpperCase()
  return allowed.includes(v) ? v : null
}

export function parseOptionalDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !value.trim()) return null
  const d = new Date(value.trim())
  return Number.isNaN(d.getTime()) ? null : d
}

export function parseOptionalString(value: unknown, maxLen: number): string | null {
  if (typeof value !== 'string') return null
  const s = value.trim()
  if (!s) return null
  return s.slice(0, maxLen)
}

export function buildLocationDisplay(input: {
  locationCity?: string | null
  workMode?: string | null
  isRemote?: boolean
}): string | null {
  const city = input.locationCity?.trim()
  const mode = input.workMode ? WORK_MODE_LABELS[input.workMode] ?? input.workMode : null
  const parts = [city, mode ?? (input.isRemote ? 'Remote' : null)].filter(Boolean) as string[]
  return parts.length > 0 ? parts.join(' · ') : null
}

function validateExperienceRange(min: number | null, max: number | null) {
  if (min != null && max != null && max < min) {
    throw new RequirementFieldError(
      'Maximum experience must be greater than or equal to minimum'
    )
  }
}

function parseRequiredInt(value: unknown, label: string, max = 50): number {
  const n = parseOptionalInt(value, max)
  if (n === null) throw new RequirementFieldError(`${label} is required`)
  return n
}

function parseRequiredEnum(value: unknown, allowed: readonly string[], label: string): string {
  const v = parseOptionalEnum(value, allowed)
  if (!v) throw new RequirementFieldError(`${label} is required`)
  return v
}

function parseRequiredString(value: unknown, label: string, maxLen: number): string {
  const s = parseOptionalString(value, maxLen)
  if (!s) throw new RequirementFieldError(`${label} is required`)
  return s
}

function parseRequiredDate(value: unknown, label: string): Date {
  const d = parseOptionalDate(value)
  if (!d) throw new RequirementFieldError(`${label} is required`)
  return d
}

/** Validates and parses extended fields for POST /requirements (all required). */
export function pickRequirementExtrasForCreate(body: Record<string, unknown>) {
  const experienceMinYears = parseRequiredInt(body.experienceMinYears, 'Minimum experience')
  const experienceMaxYears = parseRequiredInt(body.experienceMaxYears, 'Maximum experience')
  validateExperienceRange(experienceMinYears, experienceMaxYears)

  const locationCity = parseRequiredString(body.locationCity, 'City', 120)
  const workMode = parseRequiredEnum(body.workMode, WORK_MODES, 'Work mode')
  const isRemote = Boolean(body.isRemote)

  return {
    experienceMinYears,
    experienceMaxYears,
    employmentType: parseRequiredEnum(body.employmentType, EMPLOYMENT_TYPES, 'Employment type'),
    workMode,
    salaryBand: parseRequiredString(body.salaryBand, 'Salary / CTC band', 120),
    targetStartDate: parseRequiredDate(body.targetStartDate, 'Target start date'),
    hiringDeadline: parseRequiredDate(body.hiringDeadline, 'Hiring deadline'),
    seniorityLevel: parseRequiredEnum(body.seniorityLevel, SENIORITY_LEVELS, 'Seniority level'),
    locationCity,
    isRemote,
    location:
      buildLocationDisplay({ locationCity, workMode, isRemote }) ??
      parseOptionalString(body.location, 200),
  }
}

/** Only parses fields present in the patch body (partial update). */
export function pickRequirementExtrasPatch(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  const has = (k: string) => Object.prototype.hasOwnProperty.call(body, k)

  if (has('experienceMinYears') || has('experienceMaxYears')) {
    const experienceMinYears = has('experienceMinYears')
      ? parseOptionalInt(body.experienceMinYears)
      : undefined
    const experienceMaxYears = has('experienceMaxYears')
      ? parseOptionalInt(body.experienceMaxYears)
      : undefined
    if (has('experienceMinYears')) out.experienceMinYears = experienceMinYears
    if (has('experienceMaxYears')) out.experienceMaxYears = experienceMaxYears
    validateExperienceRange(
      (out.experienceMinYears as number | null | undefined) ?? null,
      (out.experienceMaxYears as number | null | undefined) ?? null
    )
  }

  if (has('employmentType')) {
    out.employmentType = parseOptionalEnum(body.employmentType, EMPLOYMENT_TYPES)
  }
  if (has('workMode')) out.workMode = parseOptionalEnum(body.workMode, WORK_MODES)
  if (has('salaryBand')) out.salaryBand = parseOptionalString(body.salaryBand, 120)
  if (has('targetStartDate')) out.targetStartDate = parseOptionalDate(body.targetStartDate)
  if (has('hiringDeadline')) out.hiringDeadline = parseOptionalDate(body.hiringDeadline)
  if (has('seniorityLevel')) {
    out.seniorityLevel = parseOptionalEnum(body.seniorityLevel, SENIORITY_LEVELS)
  }
  if (has('locationCity')) out.locationCity = parseOptionalString(body.locationCity, 120)
  if (has('isRemote')) out.isRemote = Boolean(body.isRemote)
  if (has('location')) out.location = parseOptionalString(body.location, 200)

  if (has('locationCity') || has('workMode') || has('isRemote')) {
    out.location = buildLocationDisplay({
      locationCity: has('locationCity')
        ? parseOptionalString(body.locationCity, 120)
        : undefined,
      workMode: has('workMode') ? parseOptionalEnum(body.workMode, WORK_MODES) : undefined,
      isRemote: has('isRemote') ? Boolean(body.isRemote) : undefined,
    })
  }

  return out
}

export class RequirementFieldError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RequirementFieldError'
  }
}
