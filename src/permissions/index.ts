/**
 * Central permissions — declare role access and capability checks here.
 * Import from `@/permissions` (or `../permissions`) instead of scattered lib/*Permissions files.
 */
import type { Candidate, CandidateStatus, Interview, Requirement } from '../types'
import { canEditInterview } from '../lib/interviewDisplayStatus'

// ─── Roles ───────────────────────────────────────────────────────────────────

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  HR_HEAD: 'HR_HEAD',
  HR_MANAGER: 'HR_MANAGER',
  RECRUITER: 'RECRUITER',
  TEAM_LEAD: 'TEAM_LEAD',
  HIRING_MANAGER: 'HIRING_MANAGER',
  INTERVIEWER: 'INTERVIEWER',
  CANDIDATE: 'CANDIDATE',
  VENDOR: 'VENDOR',
  EMPLOYEE: 'EMPLOYEE',
} as const

export type AppRole = (typeof ROLES)[keyof typeof ROLES]

/** Staff app shell (MainLayout). */
export const INTERNAL_STAFF_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.HR_HEAD,
  ROLES.HR_MANAGER,
  ROLES.RECRUITER,
  ROLES.TEAM_LEAD,
  ROLES.HIRING_MANAGER,
  ROLES.INTERVIEWER,
] as const

/** Vendor management (staff). */
export const VENDOR_MANAGER_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.HR_HEAD,
  ROLES.HR_MANAGER,
  ROLES.RECRUITER,
] as const

/** Employee referral portal. */
export const REFERRAL_PORTAL_ROLES = [
  ROLES.EMPLOYEE,
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.HR_HEAD,
  ROLES.HR_MANAGER,
  ROLES.RECRUITER,
  ROLES.TEAM_LEAD,
  ROLES.HIRING_MANAGER,
  ROLES.INTERVIEWER,
] as const

// ─── Page access (sidebar / RequireAuth) ─────────────────────────────────────

export const PAGE_KEYS = [
  'dashboard',
  'requirements',
  'vendors',
  'candidates',
  'pipeline',
  'interviews',
  'offers',
  'admin_users',
  'notifications',
  'settings',
] as const

export type PageKey = (typeof PAGE_KEYS)[number]

export const CONFIGURABLE_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.HR_HEAD,
  ROLES.HR_MANAGER,
  ROLES.RECRUITER,
  ROLES.TEAM_LEAD,
  ROLES.HIRING_MANAGER,
  ROLES.INTERVIEWER,
] as const

export type ConfigurableRole = (typeof CONFIGURABLE_ROLES)[number]

export const PAGE_DEFINITIONS: { key: PageKey; label: string; description: string }[] = [
  { key: 'dashboard', label: 'Dashboard', description: 'Home dashboard and overview' },
  { key: 'requirements', label: 'Requirements', description: 'Job requirements list and detail' },
  { key: 'vendors', label: 'Vendors', description: 'Vendor management' },
  { key: 'candidates', label: 'Candidates', description: 'Candidate profiles and add candidate' },
  { key: 'pipeline', label: 'Pipeline', description: 'Hiring pipeline by requirement' },
  { key: 'interviews', label: 'Interviews', description: 'Schedule and manage interviews' },
  { key: 'offers', label: 'Offers', description: 'Offer letters and approvals' },
  { key: 'admin_users', label: 'User Management', description: 'Admin user administration' },
  { key: 'notifications', label: 'Notifications', description: 'In-app notifications' },
  { key: 'settings', label: 'Settings', description: 'Account and app settings' },
]

/** Super Admin always receives every page key regardless of role-access config. */
export function effectiveAllowedPages(
  role: string | undefined | null,
  allowedPages: PageKey[] | undefined
): PageKey[] {
  if (isSuperAdminRole(role)) return [...PAGE_KEYS]
  return allowedPages ?? []
}

export function canAccessPage(
  allowedPages: PageKey[] | undefined,
  page: PageKey,
  role?: string | null
): boolean {
  if (isSuperAdminRole(role)) return true
  if (!allowedPages?.length) return false
  return allowedPages.includes(page)
}

export function pathnameToPageKey(pathname: string): PageKey | null {
  if (pathname === '/' || pathname.startsWith('/dashboard')) return 'dashboard'
  if (pathname.startsWith('/requirements')) return 'requirements'
  if (pathname.startsWith('/vendors')) return 'vendors'
  if (pathname.startsWith('/candidates')) return 'candidates'
  if (pathname.startsWith('/pipeline')) return 'pipeline'
  if (pathname.startsWith('/interviews')) return 'interviews'
  if (pathname.startsWith('/offers')) return 'offers'
  if (pathname.startsWith('/admin/users')) return 'admin_users'
  if (pathname.startsWith('/admin')) return null
  if (pathname.startsWith('/notifications')) return 'notifications'
  if (pathname.startsWith('/settings')) return 'settings'
  return null
}

export function firstAllowedPath(allowedPages: PageKey[]): string {
  const order: PageKey[] = [
    'dashboard',
    'requirements',
    'candidates',
    'interviews',
    'vendors',
    'pipeline',
    'offers',
    'admin_users',
    'notifications',
    'settings',
  ]
  for (const key of order) {
    if (allowedPages.includes(key)) {
      if (key === 'dashboard') return '/dashboard'
      if (key === 'admin_users') return '/admin'
      return `/${key}`
    }
  }
  return '/dashboard'
}

// ─── Org-wide access ─────────────────────────────────────────────────────────

export const ORG_WIDE_ACCESS_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.HR_HEAD,
  ROLES.HR_MANAGER,
  ROLES.TEAM_LEAD,
] as const

export function hasOrgWideAccess(role?: string | null): boolean {
  return ORG_WIDE_ACCESS_ROLES.includes(role as (typeof ORG_WIDE_ACCESS_ROLES)[number])
}

export function isSuperAdminRole(role?: string | null): boolean {
  return role === ROLES.SUPER_ADMIN
}

export function isAdminRole(role?: string | null): boolean {
  return role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN
}

/** Super Admin only — create/edit/delete users, assign roles, reset passwords. */
export function canManageUsers(role?: string | null): boolean {
  return isSuperAdminRole(role)
}

/** Admin hub (catalogs, role access, panels) — Admin and Super Admin. */
export function canAccessAdminHub(role?: string | null): boolean {
  return isAdminRole(role)
}

/** True when a user's role satisfies a route guard that lists allowed roles. */
export function roleMatchesAllowed(userRole: string, allowedRoles: readonly string[]): boolean {
  if (userRole === ROLES.SUPER_ADMIN) return true
  if (allowedRoles.includes(userRole)) return true
  return false
}

export function isReferralPortalRole(role: string): boolean {
  return (REFERRAL_PORTAL_ROLES as readonly string[]).includes(role)
}

export function canEditOwnedOrAdmin(
  role: string | undefined,
  ownerId: string | undefined,
  currentUserId: string | undefined
): boolean {
  if (hasOrgWideAccess(role)) return true
  if (!ownerId || !currentUserId) return false
  return ownerId === currentUserId
}

export function canEditInterviewAsRole(interview: Interview, role?: string | null): boolean {
  return canEditInterview(interview, role)
}

export function canDeleteFeedback(role?: string | null): boolean {
  return hasOrgWideAccess(role)
}

// ─── Feature tags (MIS, careers, employee referral) ──────────────────────────

export const FEATURE_TAG_KEYS = ['careers', 'employee_referral', 'mis'] as const

export type FeatureTagKey = (typeof FEATURE_TAG_KEYS)[number]

export const FEATURE_TAG_DEFINITIONS: {
  key: FeatureTagKey
  label: string
  description: string
  path: string
  icon: string
}[] = [
  {
    key: 'careers',
    label: 'Careers',
    description: 'Candidate portal and self-applied profiles.',
    path: '/features/careers',
    icon: 'work',
  },
  {
    key: 'employee_referral',
    label: 'Employee referral',
    description: 'Internal employee referrals (ERP).',
    path: '/features/employee-referral',
    icon: 'group_add',
  },
  {
    key: 'mis',
    label: 'MIS',
    description: 'MIS dashboard and recruitment module links.',
    path: '/features/mis',
    icon: 'analytics',
  },
]

export function hasFeatureTag(
  role: string | undefined | null,
  userTags: FeatureTagKey[] | undefined,
  tag: FeatureTagKey
): boolean {
  if (role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN) return true
  return (userTags ?? []).includes(tag)
}

export function getAccessibleFeatureTags(
  role: string | undefined | null,
  userTags: FeatureTagKey[] | undefined
): typeof FEATURE_TAG_DEFINITIONS {
  return FEATURE_TAG_DEFINITIONS.filter((d) => hasFeatureTag(role, userTags, d.key))
}

export function featureTagFromPath(pathname: string): FeatureTagKey | null {
  if (pathname.startsWith('/features/careers')) return 'careers'
  if (pathname.startsWith('/features/employee-referral')) return 'employee_referral'
  if (pathname.startsWith('/features/mis')) return 'mis'
  return null
}

// ─── Candidates ──────────────────────────────────────────────────────────────

export const CANDIDATE_CREATE_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.HR_HEAD,
  ROLES.HR_MANAGER,
  ROLES.RECRUITER,
  ROLES.TEAM_LEAD,
] as const

export function canCreateCandidate(role?: string | null): boolean {
  return CANDIDATE_CREATE_ROLES.includes(role as (typeof CANDIDATE_CREATE_ROLES)[number])
}

export function isHiredStageLocked(
  candidate: Pick<Candidate, 'status'>,
  role?: string | null
): boolean {
  return candidate.status === 'HIRED' && !hasOrgWideAccess(role)
}

export function canChangeCandidateStage(
  candidate: Pick<Candidate, 'status'>,
  newStage: CandidateStatus,
  role?: string | null
): boolean {
  if (newStage === candidate.status) return false
  if (candidate.status === 'HIRED' && !hasOrgWideAccess(role)) return false
  return true
}

export const HIRED_STAGE_LOCK_MESSAGE =
  'Only HR leadership roles can change pipeline stage after a candidate is hired.'

export function isInterviewerCandidateView(role?: string | null): boolean {
  return role === ROLES.INTERVIEWER
}

export {
  getCandidateProfileTabs,
  sanitizeCandidateProfileTab,
  type CandidateProfileTab,
} from './candidate-profile'

// ─── Requirements ────────────────────────────────────────────────────────────

export const HIRING_STAGE_EDIT_ROLES = [ROLES.RECRUITER, ROLES.HR_MANAGER, ROLES.TEAM_LEAD] as const

export const POSTING_CONTROL_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.HR_HEAD,
  ROLES.HR_MANAGER,
  ROLES.TEAM_LEAD,
  ROLES.HIRING_MANAGER,
] as const

export const PORTAL_VISIBILITY_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.HR_HEAD,
  ROLES.HR_MANAGER,
  ROLES.TEAM_LEAD,
] as const

export const REQUIREMENT_CREATE_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.HR_HEAD,
  ROLES.HR_MANAGER,
  ROLES.HIRING_MANAGER,
] as const

export const REQ_APPROVAL_ROLES = [ROLES.HR_HEAD, ROLES.SUPER_ADMIN, ROLES.ADMIN] as const

export function canManagePostingControls(role?: string | null): boolean {
  return POSTING_CONTROL_ROLES.includes(role as (typeof POSTING_CONTROL_ROLES)[number])
}

export function canManageRequirementPosting(
  role: string | undefined | null,
  requirement: Pick<Requirement, 'createdBy' | 'hiringManager'>,
  user?: { uid: string; name?: string } | null
): boolean {
  if (!canManagePostingControls(role)) return false
  if (role === ROLES.HIRING_MANAGER) {
    return isRequirementHiringManager(requirement, user)
  }
  return true
}

export function canControlPortalVisibility(role?: string | null): boolean {
  return PORTAL_VISIBILITY_ROLES.includes(role as (typeof PORTAL_VISIBILITY_ROLES)[number])
}

export function canCreateRequirement(role?: string | null): boolean {
  return REQUIREMENT_CREATE_ROLES.includes(role as (typeof REQUIREMENT_CREATE_ROLES)[number])
}

export function isRequirementHiringManager(
  requirement: Pick<Requirement, 'createdBy' | 'hiringManager'>,
  user?: { uid: string; name?: string } | null
): boolean {
  if (!user?.uid) return false
  if (requirement.createdBy === user.uid) return true
  if (requirement.hiringManager === user.uid) return true
  if (!user.name?.trim()) return false
  return requirement.hiringManager.trim().toLowerCase() === user.name.trim().toLowerCase()
}

export function canEditRequirement(
  role: string | undefined | null,
  requirement: Pick<Requirement, 'createdBy' | 'hiringManager'>,
  user?: { uid: string; name?: string } | null
): boolean {
  if (!role || !user) return false
  if (
    ([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_HEAD, ROLES.HR_MANAGER] as string[]).includes(role)
  )
    return true
  if (role === ROLES.HIRING_MANAGER) {
    return isRequirementHiringManager(requirement, user)
  }
  if (role === ROLES.RECRUITER || role === ROLES.TEAM_LEAD) {
    return requirement.createdBy === user.uid
  }
  return false
}

export function canUpdateHiringStage(
  role: string | undefined | null,
  requirement: Pick<Requirement, 'status'>
): boolean {
  if (requirement.status !== 'LIVE' && requirement.status !== 'ON_HOLD') return false
  return HIRING_STAGE_EDIT_ROLES.includes(role as (typeof HIRING_STAGE_EDIT_ROLES)[number])
}

export function canUseAdminRequirementEditor(role?: string | null): boolean {
  return (
    ([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_HEAD, ROLES.HR_MANAGER, ROLES.TEAM_LEAD] as string[]).includes(
      role ?? ''
    )
  )
}

export function canUseHiringManagerEditPage(
  role: string | undefined | null,
  requirement: Pick<Requirement, 'createdBy' | 'hiringManager'>,
  user?: { uid: string; name?: string } | null
): boolean {
  return role === ROLES.HIRING_MANAGER && canEditRequirement(role, requirement, user)
}

export function canApproveRequirement(role?: string | null): boolean {
  return REQ_APPROVAL_ROLES.includes(role as (typeof REQ_APPROVAL_ROLES)[number])
}

export function requiresHrHeadDelegationForApproval(role?: string | null): boolean {
  return role === ROLES.ADMIN
}

export function canApproveRequirementDirectly(role?: string | null): boolean {
  return role === ROLES.HR_HEAD || role === ROLES.SUPER_ADMIN
}

// ─── Interviews ──────────────────────────────────────────────────────────────

export const INTERVIEW_SCHEDULER_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.HR_HEAD,
  ROLES.HR_MANAGER,
  ROLES.RECRUITER,
  ROLES.TEAM_LEAD,
  ROLES.HIRING_MANAGER,
] as const

export const INTERVIEW_PLAN_EDIT_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.HR_HEAD,
  ROLES.HR_MANAGER,
  ROLES.TEAM_LEAD,
  ROLES.RECRUITER,
] as const

export const OFFER_MANAGER_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_HEAD, ROLES.HR_MANAGER] as const

export function canScheduleInterviews(role?: string): boolean {
  return !!role && (INTERVIEW_SCHEDULER_ROLES as readonly string[]).includes(role)
}

export function canEditInterviewPlan(role?: string | null): boolean {
  return INTERVIEW_PLAN_EDIT_ROLES.includes(role as (typeof INTERVIEW_PLAN_EDIT_ROLES)[number])
}

export function canDeleteOffer(role?: string | null): boolean {
  return isAdminRole(role)
}

export function isAssignedInterviewer(interview: Interview, userId?: string | null): boolean {
  return !!userId && interview.interviewerIds.includes(userId)
}

export function showInterviewerSessionActions(
  interview: Interview,
  userId?: string | null
): boolean {
  if (interview.status === 'CANCELLED') return false
  return isAssignedInterviewer(interview, userId)
}

export function scopeInterviewsForUser(
  interviews: Interview[],
  role?: string | null,
  userId?: string | null
): Interview[] {
  if (role === ROLES.INTERVIEWER && userId) {
    return interviews.filter((i) => isAssignedInterviewer(i, userId))
  }
  return interviews
}
