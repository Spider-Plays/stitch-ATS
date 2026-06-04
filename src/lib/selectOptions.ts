import type { AppSelectOption } from '../components/ui/AppSelect'
import {
  CANDIDATE_STAGE_ORDER,
  candidateStatusClass,
  candidateStatusLabel,
} from './candidatePage'
import {
  EMPLOYMENT_TYPES,
  SENIORITY_LEVELS,
  WORK_MODES,
} from './requirementFields'
import { buildQuarterOptions } from './candidateMilestones'
import { REFERRAL_RELATIONSHIPS } from './candidateSubmissionForm'
import { HIRING_STAGES, hiringStageClass } from './requirementHiring'
import type { CandidateStatus, RequirementHiringStage, UserRole } from '../types'

const mapOpts = (items: readonly { value: string; label: string }[]): AppSelectOption[] =>
  items.map((o) => ({ value: o.value, label: o.label }))

export const EMPLOYMENT_TYPE_OPTIONS = mapOpts(EMPLOYMENT_TYPES)
export const WORK_MODE_OPTIONS: AppSelectOption[] = [
  { value: '', label: '—' },
  ...mapOpts(WORK_MODES),
]
export const SENIORITY_OPTIONS: AppSelectOption[] = [
  { value: '', label: '—' },
  ...mapOpts(SENIORITY_LEVELS),
]

export const REQUIREMENT_PRIORITY_OPTIONS: AppSelectOption[] = [
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
]

export function quarterSelectOptions(): AppSelectOption[] {
  return [{ value: '', label: 'Select quarter' }, ...buildQuarterOptions()]
}

export const INTERVIEW_DURATION_OPTIONS: AppSelectOption[] = [30, 45, 60, 90].map((m) => ({
  value: String(m),
  label: `${m} min`,
}))

export const SCHEDULE_DURATION_OPTIONS: AppSelectOption[] = [15, 30, 45, 60, 90].map((m) => ({
  value: String(m),
  label: `${m} minutes`,
}))

export const VENDOR_STATUS_OPTIONS: AppSelectOption[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'SUSPENDED', label: 'Suspended' },
]

export const LANGUAGE_OPTIONS: AppSelectOption[] = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'de', label: 'German' },
  { value: 'es', label: 'Spanish' },
]

export function hiringStageSelectOptions(): AppSelectOption[] {
  return HIRING_STAGES.map((s) => ({
    value: s.value,
    label: s.label,
    chipClassName: hiringStageClass(s.value as RequirementHiringStage),
  }))
}

export const REFERRAL_RELATIONSHIP_OPTIONS: AppSelectOption[] = [
  { value: '', label: 'Select…' },
  ...REFERRAL_RELATIONSHIPS.map((r) => ({ value: r, label: r })),
]

export const USER_ROLE_OPTIONS: AppSelectOption[] = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'HR_HEAD', label: 'HR Head' },
  { value: 'HR_MANAGER', label: 'HR Manager' },
  { value: 'RECRUITER', label: 'Recruiter' },
  { value: 'TEAM_LEAD', label: 'Team Lead' },
  { value: 'HIRING_MANAGER', label: 'Hiring Manager' },
  { value: 'INTERVIEWER', label: 'Interviewer' },
  { value: 'CANDIDATE', label: 'Candidate' },
]

export const USER_ROLE_FILTER_OPTIONS: AppSelectOption[] = [
  { value: 'ALL', label: 'All Roles' },
  ...USER_ROLE_OPTIONS,
]

export const USER_STATUS_FILTER_OPTIONS: AppSelectOption[] = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active only' },
  { value: 'DISABLED', label: 'Disabled only' },
]

export const INVITE_ROLE_OPTIONS: AppSelectOption[] = [
  { value: 'RECRUITER', label: 'Recruiter' },
  { value: 'HR_MANAGER', label: 'HR Manager' },
  { value: 'HR_HEAD', label: 'HR Head' },
  { value: 'HIRING_MANAGER', label: 'Hiring Manager' },
  { value: 'INTERVIEWER', label: 'Interviewer' },
  { value: 'TEAM_LEAD', label: 'Team Lead' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'CANDIDATE', label: 'Candidate' },
]

export function candidateStageSelectOptions(): AppSelectOption[] {
  return CANDIDATE_STAGE_ORDER.map((status) => ({
    value: status,
    label: candidateStatusLabel(status),
    chipClassName: candidateStatusClass(status),
  }))
}

export function departmentSelectOptions(
  names: string[],
  current?: string | null
): AppSelectOption[] {
  const opts: AppSelectOption[] = [{ value: '', label: '— None —' }]
  if (current && current !== '' && !names.includes(current)) {
    opts.push({ value: current, label: current })
  }
  for (const name of names) {
    opts.push({ value: name, label: name })
  }
  return opts
}

export const CANDIDATE_SOURCE_OPTIONS: AppSelectOption[] = [
  { value: 'Direct Application', label: 'Direct Application' },
  { value: 'LinkedIn', label: 'LinkedIn' },
  { value: 'Referral', label: 'Referral' },
  { value: 'Agency', label: 'Agency' },
  { value: 'Recruiter Added', label: 'Recruiter Added' },
]

export function toRole(value: string): UserRole {
  return value as UserRole
}

export function toCandidateStatus(value: string): CandidateStatus {
  return value as CandidateStatus
}
