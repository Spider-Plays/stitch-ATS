import {
  CANDIDATE_PROFILE_TABS,
  type CandidateProfileTab,
} from './candidateProfilePage'

export function isInterviewerCandidateView(role?: string | null): boolean {
  return role === 'INTERVIEWER'
}

export function getCandidateProfileTabs(role?: string | null) {
  if (isInterviewerCandidateView(role)) {
    return CANDIDATE_PROFILE_TABS.filter(
      (t) => t.id === 'overview' || t.id === 'resume'
    )
  }
  return CANDIDATE_PROFILE_TABS
}

export function sanitizeCandidateProfileTab(
  role: string | undefined | null,
  tab: CandidateProfileTab
): CandidateProfileTab {
  const allowed = getCandidateProfileTabs(role).map((t) => t.id)
  if (allowed.includes(tab)) return tab
  return isInterviewerCandidateView(role) ? 'resume' : 'overview'
}
