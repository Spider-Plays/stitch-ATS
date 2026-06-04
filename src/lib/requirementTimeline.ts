import type { ApprovalHistory, Requirement, RequirementVersion, User } from '../types'
import { formatApprovalEventLabel } from './requirementApproval'
import {
  employmentTypeLabel,
  formatDateLabel,
  seniorityLabel,
  workModeLabel,
} from './requirementFields'

export type TimelineEntry =
  | { kind: 'workflow'; at: string; event: ApprovalHistory }
  | { kind: 'version'; at: string; version: RequirementVersion }

const WORKFLOW_ACTION_LABELS: Record<string, string> = {
  REQUESTED: 'Submitted for approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
  ON_HOLD: 'Placed on hold',
  HIRING_STAGE_CHANGED: 'Hiring stage updated',
  RESUMED: 'Resumed from hold',
  RECRUITER_ASSIGNED: 'Recruiter assigned',
  RECRUITER_UNASSIGNED: 'Recruiter removed',
  PORTAL_SHOWN: 'Shown on candidate portal',
  PORTAL_HIDDEN: 'Hidden from candidate portal',
  REFERRAL_PORTAL_SHOWN: 'Posted to employee portal',
  REFERRAL_PORTAL_HIDDEN: 'Removed from employee portal',
}

const CHANGE_FIELD_LABELS: Record<string, string> = {
  title: 'Job title',
  department: 'Department',
  hiringManager: 'Hiring manager',
  client: 'Client',
  openings: 'Openings',
  priority: 'Priority',
  location: 'Location',
  locationCity: 'City',
  workMode: 'Work mode',
  isRemote: 'Remote',
  employmentType: 'Employment type',
  seniorityLevel: 'Seniority',
  experienceMinYears: 'Min experience (years)',
  experienceMaxYears: 'Max experience (years)',
  salaryBand: 'Salary band',
  targetStartDate: 'Target start',
  hiringDeadline: 'Hiring deadline',
  jobDescription: 'Job description',
  description: 'Summary',
  primarySkills: 'Primary skills',
  secondarySkills: 'Secondary skills',
  status: 'Status',
  visibleToCandidates: 'Portal visibility',
}

export function isCandidateLinkVersion(version: RequirementVersion): boolean {
  if (version.kind === 'CANDIDATE_LINKED') return true
  return typeof version.changes?.candidateId === 'string'
}

export function buildRequirementTimeline(
  requirement: Pick<Requirement, 'approvalHistory' | 'versions'>
): TimelineEntry[] {
  const entries: TimelineEntry[] = []

  for (const event of requirement.approvalHistory ?? []) {
    entries.push({ kind: 'workflow', at: event.at, event })
  }

  for (const version of requirement.versions ?? []) {
    if (isCandidateLinkVersion(version)) continue
    entries.push({ kind: 'version', at: version.changedAt, version })
  }

  return entries.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
}

export function workflowEventTitle(
  event: ApprovalHistory,
  users: User[],
  recruiterId?: string
): string {
  if (event.action === 'RECRUITER_ASSIGNED' || event.action === 'RECRUITER_UNASSIGNED') {
    const id = recruiterId ?? (event as ApprovalHistory & { recruiterId?: string }).recruiterId
    const recruiter = id ? users.find((u) => u.uid === id) : undefined
    const verb = event.action === 'RECRUITER_ASSIGNED' ? 'assigned' : 'removed'
    return recruiter
      ? `Recruiter ${verb}: ${recruiter.name}`
      : WORKFLOW_ACTION_LABELS[event.action]
  }
  if (event.onBehalfOf === 'HR_HEAD') {
    return formatApprovalEventLabel(event, users.find((u) => u.uid === event.by)?.name)
  }
  const base = WORKFLOW_ACTION_LABELS[event.action] ?? event.action.replace(/_/g, ' ')
  const name = users.find((u) => u.uid === event.by)?.name
  return name ? `${base} · ${name}` : base
}

export function workflowEventDotClass(action: string): string {
  switch (action) {
    case 'APPROVED':
    case 'RESUMED':
      return 'bg-emerald-500'
    case 'REJECTED':
      return 'bg-red-500'
    case 'CLOSED':
    case 'CANCELLED':
      return 'bg-slate-500'
    case 'HIRING_STAGE_CHANGED':
      return 'bg-cyan-500'
    case 'ON_HOLD':
      return 'bg-orange-500'
    case 'RECRUITER_ASSIGNED':
      return 'bg-violet-500'
    case 'RECRUITER_UNASSIGNED':
      return 'bg-violet-300'
    case 'PORTAL_SHOWN':
      return 'bg-sky-500'
    case 'PORTAL_HIDDEN':
      return 'bg-slate-400'
    case 'REFERRAL_PORTAL_SHOWN':
      return 'bg-violet-500'
    case 'REFERRAL_PORTAL_HIDDEN':
      return 'bg-violet-300'
    default:
      return 'bg-blue-500'
  }
}

function formatChangeValue(key: string, val: unknown): string {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'boolean') return val ? 'Yes' : 'No'
  if (Array.isArray(val)) return val.join(', ')
  if (key === 'employmentType') return employmentTypeLabel(String(val))
  if (key === 'workMode') return workModeLabel(String(val))
  if (key === 'seniorityLevel') return seniorityLabel(String(val))
  if (key === 'targetStartDate' || key === 'hiringDeadline') return formatDateLabel(String(val))
  if (typeof val === 'string' && val.length > 200) return `${val.slice(0, 200)}…`
  return String(val)
}

export function formatVersionChanges(changes: Record<string, unknown>): { label: string; value: string }[] {
  return Object.entries(changes)
    .filter(([key]) => key !== 'candidateId' && key !== 'candidateName' && key !== 'candidateEmail')
    .map(([key, val]) => ({
      label: CHANGE_FIELD_LABELS[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
      value: formatChangeValue(key, val),
    }))
}

export function versionKindLabel(version: RequirementVersion): string {
  const kind =
    version.kind ??
    (typeof version.changes?.candidateId === 'string' ? 'CANDIDATE_LINKED' : 'UPDATE')
  return kind === 'CANDIDATE_LINKED' ? 'Candidate linked' : 'Requirement updated'
}
