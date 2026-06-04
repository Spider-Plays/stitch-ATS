/** Calendar quarter label, e.g. Q2 2026 */
export function quarterFromDate(date: Date): string {
  const q = Math.floor(date.getMonth() / 3) + 1
  return `Q${q} ${date.getFullYear()}`
}

/** ISO date (yyyy-mm-dd) → month value for <input type="month"> */
export function monthFromIsoDate(isoDate: string): string {
  if (!isoDate) return ''
  return isoDate.slice(0, 7)
}

export function parseIsoDate(isoDate: string): Date | null {
  if (!isoDate) return null
  const d = new Date(`${isoDate}T12:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

export function buildQuarterOptions(yearsAround = 1): { value: string; label: string }[] {
  const baseYear = new Date().getFullYear()
  const years: number[] = []
  for (let y = baseYear - yearsAround; y <= baseYear + yearsAround; y++) {
    years.push(y)
  }
  return years.flatMap((year) =>
    ([1, 2, 3, 4] as const).map((q) => {
      const value = `Q${q} ${year}`
      return { value, label: value }
    })
  )
}

export type OfferMilestoneInput = {
  offerDate: string
  offerMonth: string
  offerQuarter: string
  expectedJoiningDate: string
}

export type HiredMilestoneInput = {
  joiningDate: string
  joiningMonth: string
  joiningQuarter: string
}

export type CandidateStatusMilestonePayload =
  | { status: 'OFFER'; milestone: OfferMilestoneInput }
  | { status: 'HIRED'; milestone: HiredMilestoneInput }

export function validateOfferMilestone(m: OfferMilestoneInput): string | null {
  if (!m.offerDate) return 'Offer date is required'
  if (!m.offerMonth) return 'Month of offer is required'
  if (!m.offerQuarter) return 'Quarter of offer is required'
  if (!m.expectedJoiningDate) return 'Expected joining date is required'
  return null
}

export function validateHiredMilestone(m: HiredMilestoneInput): string | null {
  if (!m.joiningDate) return 'Date of joining is required'
  if (!m.joiningMonth) return 'Month of joining is required'
  if (!m.joiningQuarter) return 'Quarter of joining is required'
  return null
}

export function formatMilestoneDate(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function hasOfferMilestone(candidate: {
  offerDate?: string | null
  offerMonth?: string | null
  offerQuarter?: string | null
  expectedJoiningDate?: string | null
}): boolean {
  return !!(
    candidate.offerDate ||
    candidate.offerMonth ||
    candidate.offerQuarter ||
    candidate.expectedJoiningDate
  )
}

export function hasJoiningMilestone(candidate: {
  joiningDate?: string | null
  joiningMonth?: string | null
  joiningQuarter?: string | null
}): boolean {
  return !!(
    candidate.joiningDate ||
    candidate.joiningMonth ||
    candidate.joiningQuarter
  )
}
