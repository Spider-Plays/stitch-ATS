/** Matches Feedback Form 3.docx structure */

export const PROFICIENCY_LEVELS = [
  'Not Assessed',
  'Beginner',
  'Intermediate',
  'Advanced',
  'Expert',
] as const

export const RATING_OPTIONS = [
  { value: 0, label: 'Not Assessed' },
  { value: 1, label: '1 - Needs Improvement' },
  { value: 2, label: '2 - Below Expectations' },
  { value: 3, label: '3 - Meets Expectations' },
  { value: 4, label: '4 - Exceeds Expectations' },
  { value: 5, label: '5 - Outstanding' },
] as const

export const RECOMMENDATION_OPTIONS = [
  { value: 'STRONG_HIRE', label: 'Strong Hire' },
  { value: 'HIRE', label: 'Hire' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'NO_HIRE', label: 'No Hire' },
  { value: 'STRONG_NO_HIRE', label: 'Strong No Hire' },
] as const

export const COMPETENCY_TOPICS = [
  'Ability to understand technical questions at 1st go?',
  'Problem solving and Critical Thinking?',
  'Attention to Detail?',
  'Ability to troubleshoot, debug code & log analysis?',
  'Overall communication Skills?',
  'Current Project understanding?',
  'General Technical Awareness of current industry?',
  'Innovation and Process improvement?',
] as const

export const DEFAULT_SKILL_ROWS = 5

export type ProficiencyLevel = (typeof PROFICIENCY_LEVELS)[number]
export type RecommendationValue = (typeof RECOMMENDATION_OPTIONS)[number]['value']

export interface SkillAssessmentRow {
  skillAssessed: string
  expectedProficiency: string
  possessProficiency: string
  rating: number
  remarks: string
}

export interface CompetencyRow {
  topic: string
  rating: number
  remarks: string
}

export interface InterviewFeedbackFormData {
  skillAssessment: SkillAssessmentRow[]
  competencies: CompetencyRow[]
}

export function createEmptySkillRow(): SkillAssessmentRow {
  return {
    skillAssessed: '',
    expectedProficiency: 'Not Assessed',
    possessProficiency: 'Not Assessed',
    rating: 0,
    remarks: '',
  }
}

export function createDefaultFormData(): InterviewFeedbackFormData {
  return {
    skillAssessment: Array.from({ length: DEFAULT_SKILL_ROWS }, () => createEmptySkillRow()),
    competencies: COMPETENCY_TOPICS.map((topic) => ({
      topic,
      rating: 0,
      remarks: '',
    })),
  }
}

export function parseFormData(raw: unknown): InterviewFeedbackFormData {
  if (!raw || typeof raw !== 'object') return createDefaultFormData()
  const o = raw as Partial<InterviewFeedbackFormData>
  const skills =
    Array.isArray(o.skillAssessment) && o.skillAssessment.length > 0
      ? o.skillAssessment.map((r) => ({
          skillAssessed: String(r.skillAssessed ?? ''),
          expectedProficiency: String(r.expectedProficiency ?? 'Not Assessed'),
          possessProficiency: String(r.possessProficiency ?? 'Not Assessed'),
          rating: Number(r.rating) || 0,
          remarks: String(r.remarks ?? ''),
        }))
      : createDefaultFormData().skillAssessment

  const competencies =
    Array.isArray(o.competencies) && o.competencies.length > 0
      ? o.competencies.map((c) => ({
          topic: String(c.topic ?? ''),
          rating: Number(c.rating) || 0,
          remarks: String(c.remarks ?? ''),
        }))
      : createDefaultFormData().competencies

  return { skillAssessment: skills, competencies }
}

export function ratingLabel(value: number): string {
  return RATING_OPTIONS.find((r) => r.value === value)?.label ?? 'Not Assessed'
}

export function recommendationLabel(value: string): string {
  return RECOMMENDATION_OPTIONS.find((r) => r.value === value)?.label ?? value
}
