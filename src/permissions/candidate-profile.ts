import {
  CANDIDATE_PROFILE_TABS,
  type CandidateProfileTab,
} from '@/pages/candidates/profile/profile.utils'

function isInterviewerView(role?: string | null) {
  return role === 'INTERVIEWER'
}

export function getCandidateProfileTabs(role?: string | null) {
  if (isInterviewerView(role)) {
    return CANDIDATE_PROFILE_TABS.filter((t) => t.id === 'overview' || t.id === 'resume')
  }
  return CANDIDATE_PROFILE_TABS
}

export function sanitizeCandidateProfileTab(
  role: string | undefined | null,
  tab: CandidateProfileTab
): CandidateProfileTab {
  const allowed = getCandidateProfileTabs(role).map((t) => t.id)
  if (allowed.includes(tab)) return tab
  return isInterviewerView(role) ? 'resume' : 'overview'
}

export type { CandidateProfileTab }
