import type { Candidate } from '@prisma/client'

export const PROFILE_FIELD_LABELS: Record<string, string> = {
  name: 'Full name',
  phone: 'Phone number',
  location: 'Location',
  totalExperience: 'Total experience',
  currentCompany: 'Current company',
  currentCTC: 'Current CTC',
  expectedCTC: 'Expected CTC',
  noticePeriod: 'Notice period',
  pan: 'PAN',
  resume: 'Resume',
}

export function getCandidateProfileMissing(candidate: Candidate): string[] {
  const missing: string[] = []
  if (!candidate.name?.trim()) missing.push('name')
  if (!candidate.phone?.trim()) missing.push('phone')
  if (!candidate.location?.trim()) missing.push('location')
  if (!candidate.totalExperience?.trim()) missing.push('totalExperience')
  if (!candidate.currentCompany?.trim()) missing.push('currentCompany')
  if (!candidate.currentCTC?.trim()) missing.push('currentCTC')
  if (!candidate.expectedCTC?.trim()) missing.push('expectedCTC')
  if (!candidate.noticePeriod?.trim()) missing.push('noticePeriod')
  if (!candidate.pan?.trim()) missing.push('pan')
  if (!candidate.resumeFileName?.trim()) missing.push('resume')
  return missing
}

export function isCandidateProfileComplete(candidate: Candidate): boolean {
  return getCandidateProfileMissing(candidate).length === 0
}
