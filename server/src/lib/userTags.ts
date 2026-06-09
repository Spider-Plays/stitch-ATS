/** Feature tags assigned per user (stored in User.permissions JSON column). */
export const FEATURE_TAG_KEYS = [
  'careers',
  'employee_referral',
  'mis',
] as const

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

export function parseFeatureTags(raw: string | null | undefined): FeatureTagKey[] {
  try {
    const arr = JSON.parse(raw || '[]')
    if (!Array.isArray(arr)) return []
    return arr.filter((t): t is FeatureTagKey => FEATURE_TAG_KEYS.includes(t as FeatureTagKey))
  } catch {
    return []
  }
}

export function sanitizeFeatureTags(tags: string[]): FeatureTagKey[] {
  return [...new Set(tags.filter((t) => FEATURE_TAG_KEYS.includes(t as FeatureTagKey)))] as FeatureTagKey[]
}

export function hasFeatureTag(
  role: string | undefined | null,
  userTags: FeatureTagKey[] | undefined,
  tag: FeatureTagKey
): boolean {
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') return true
  return (userTags ?? []).includes(tag)
}

export function featureTagFromPath(pathname: string): FeatureTagKey | null {
  if (pathname.startsWith('/features/careers')) return 'careers'
  if (pathname.startsWith('/features/employee-referral')) return 'employee_referral'
  if (pathname.startsWith('/features/mis')) return 'mis'
  return null
}
