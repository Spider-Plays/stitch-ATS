import { z } from 'zod'
import { isIndianItCity } from './indianItCities'
import type { ParsedResumeFields } from '../services/http/candidates'

const requiredString = (label: string) => z.string().min(1, `${label} is required`)

export const candidateProfileFieldsSchema = z.object({
  firstName: requiredString('First name'),
  lastName: requiredString('Last name'),
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  phone: requiredString('Phone number'),
  totalExperience: requiredString('Total experience'),
  currentCompany: requiredString('Current company'),
  currentCTC: requiredString('Current CTC'),
  expectedCTC: requiredString('Expected CTC'),
  noticePeriod: requiredString('Notice period'),
  pan: z
    .string()
    .min(1, 'PAN is required')
    .refine((v) => /^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(v.trim()), 'Enter a valid PAN (e.g. ABCDE1234F)'),
  linkedin: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  location: z
    .string()
    .min(1, 'Location is required')
    .refine((v) => isIndianItCity(v), 'Select a city from the list'),
  portfolio: z.string().url('Invalid URL').optional().or(z.literal('')),
  primarySkills: z.array(z.string()).min(1, 'Select at least one primary skill'),
  secondarySkills: z.array(z.string()).default([]),
})

export const recruiterSubmissionSchema = candidateProfileFieldsSchema.extend({
  role: requiredString('Role'),
  source: requiredString('Source'),
  requirementId: requiredString('Job requirement'),
})

export const vendorSubmissionSchema = candidateProfileFieldsSchema

export const REFERRAL_RELATIONSHIPS = [
  'Colleague',
  'Friend',
  'Former colleague',
  'Family',
  'Professional network',
  'Other',
] as const

export const referralSubmissionSchema = candidateProfileFieldsSchema.extend({
  referralRelationship: requiredString('Relationship'),
  referralNotes: z.string().max(500).optional(),
})

export type CandidateProfileFormValues = z.infer<typeof candidateProfileFieldsSchema>
export type RecruiterSubmissionFormValues = z.infer<typeof recruiterSubmissionSchema>
export type VendorSubmissionFormValues = z.infer<typeof vendorSubmissionSchema>
export type ReferralSubmissionFormValues = z.infer<typeof referralSubmissionSchema>

export const PARSED_FIELD_LABELS: Record<keyof ParsedResumeFields, string> = {
  firstName: 'First name',
  lastName: 'Last name',
  email: 'Email',
  phone: 'Phone',
  location: 'Location',
  linkedin: 'LinkedIn',
  portfolio: 'Portfolio',
  totalExperience: 'Experience',
  primarySkills: 'Primary skills',
  secondarySkills: 'Secondary skills',
}

export const RECRUITER_STEP_0_FIELDS = ['requirementId', 'role', 'source'] as const
export const PROFILE_STEP_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'pan',
  'location',
  'totalExperience',
  'currentCompany',
  'currentCTC',
  'expectedCTC',
  'noticePeriod',
  'linkedin',
  'portfolio',
  'primarySkills',
  'secondarySkills',
] as const

export const SUBMISSION_STEPS = [
  {
    id: 0,
    label: 'Resume',
    description: 'Upload resume to auto-fill profile fields',
  },
  {
    id: 1,
    label: 'Profile & skills',
    description: 'Contact, compensation, and skills',
  },
  {
    id: 2,
    label: 'Review',
    description: 'Confirm before submitting',
  },
] as const
