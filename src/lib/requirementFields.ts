import type { Requirement } from '../types'

export const EMPLOYMENT_TYPES = [
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'INTERN', label: 'Internship' },
] as const

export const WORK_MODES = [
  { value: 'REMOTE', label: 'Remote' },
  { value: 'HYBRID', label: 'Hybrid' },
  { value: 'ONSITE', label: 'On-site' },
] as const

export const SENIORITY_LEVELS = [
  { value: 'JUNIOR', label: 'Junior' },
  { value: 'MID', label: 'Mid-level' },
  { value: 'SENIOR', label: 'Senior' },
  { value: 'LEAD', label: 'Lead' },
  { value: 'PRINCIPAL', label: 'Principal / Staff' },
] as const

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number]['value']
export type WorkMode = (typeof WORK_MODES)[number]['value']
export type SeniorityLevel = (typeof SENIORITY_LEVELS)[number]['value']

export function employmentTypeLabel(value?: string | null): string {
  return EMPLOYMENT_TYPES.find((t) => t.value === value)?.label ?? value ?? '—'
}

export function workModeLabel(value?: string | null): string {
  return WORK_MODES.find((t) => t.value === value)?.label ?? value ?? '—'
}

export function seniorityLabel(value?: string | null): string {
  return SENIORITY_LEVELS.find((t) => t.value === value)?.label ?? value ?? '—'
}

export function formatExperienceRange(min?: number | null, max?: number | null): string {
  if (min != null && max != null) return `${min}–${max} years`
  if (min != null) return `${min}+ years`
  if (max != null) return `Up to ${max} years`
  return '—'
}

export function formatRequirementLocation(
  req: Pick<Requirement, 'location' | 'locationCity' | 'workMode' | 'isRemote'>
): string {
  if (req.location?.trim()) return req.location.trim()
  const parts: string[] = []
  if (req.locationCity?.trim()) parts.push(req.locationCity.trim())
  if (req.workMode) parts.push(workModeLabel(req.workMode))
  else if (req.isRemote) parts.push('Remote')
  return parts.length > 0 ? parts.join(' · ') : '—'
}

export function buildLocationDisplay(input: {
  locationCity?: string
  workMode?: string
  isRemote?: boolean
}): string | undefined {
  const city = input.locationCity?.trim()
  const mode = input.workMode ? workModeLabel(input.workMode) : input.isRemote ? 'Remote' : ''
  const parts = [city, mode].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : undefined
}

export function formatDateLabel(iso?: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}
