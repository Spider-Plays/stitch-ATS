import type { SelectOption } from '../components/ui/SearchableSelect'

const INDIAN_IT_CITY_DATA = [
  { city: 'Bengaluru', state: 'Karnataka' },
  { city: 'Hyderabad', state: 'Telangana' },
  { city: 'Chennai', state: 'Tamil Nadu' },
  { city: 'Pune', state: 'Maharashtra' },
  { city: 'Mumbai', state: 'Maharashtra' },
  { city: 'Delhi', state: 'Delhi' },
  { city: 'Noida', state: 'Uttar Pradesh' },
  { city: 'Gurugram', state: 'Haryana' },
  { city: 'Ghaziabad', state: 'Uttar Pradesh' },
  { city: 'Faridabad', state: 'Haryana' },
  { city: 'Kolkata', state: 'West Bengal' },
  { city: 'Ahmedabad', state: 'Gujarat' },
  { city: 'Kochi', state: 'Kerala' },
  { city: 'Thiruvananthapuram', state: 'Kerala' },
  { city: 'Coimbatore', state: 'Tamil Nadu' },
  { city: 'Jaipur', state: 'Rajasthan' },
  { city: 'Chandigarh', state: 'Chandigarh' },
  { city: 'Mohali', state: 'Punjab' },
  { city: 'Indore', state: 'Madhya Pradesh' },
  { city: 'Bhopal', state: 'Madhya Pradesh' },
  { city: 'Nagpur', state: 'Maharashtra' },
  { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  { city: 'Mysuru', state: 'Karnataka' },
  { city: 'Mangaluru', state: 'Karnataka' },
  { city: 'Hubballi', state: 'Karnataka' },
  { city: 'Lucknow', state: 'Uttar Pradesh' },
  { city: 'Kanpur', state: 'Uttar Pradesh' },
  { city: 'Patna', state: 'Bihar' },
  { city: 'Ranchi', state: 'Jharkhand' },
  { city: 'Bhubaneswar', state: 'Odisha' },
  { city: 'Guwahati', state: 'Assam' },
  { city: 'Vadodara', state: 'Gujarat' },
  { city: 'Surat', state: 'Gujarat' },
  { city: 'Rajkot', state: 'Gujarat' },
  { city: 'Nashik', state: 'Maharashtra' },
  { city: 'Goa', state: 'Goa' },
  { city: 'Madurai', state: 'Tamil Nadu' },
  { city: 'Trichy', state: 'Tamil Nadu' },
  { city: 'Gandhinagar', state: 'Gujarat' },
  { city: 'Greater Noida', state: 'Uttar Pradesh' },
] as const

/** Major Indian cities with strong IT / tech hiring presence. */
export const INDIAN_IT_CITIES = INDIAN_IT_CITY_DATA.map((row) => row.city)

export type IndianItCity = (typeof INDIAN_IT_CITY_DATA)[number]['city']

const CITY_SET = new Set<string>(INDIAN_IT_CITIES)

const CITY_STATE: Record<string, string> = Object.fromEntries(
  INDIAN_IT_CITY_DATA.map((row) => [row.city, row.state])
)

/** Common alternate spellings from resumes and forms. */
const CITY_ALIASES: Record<string, IndianItCity> = {
  bangalore: 'Bengaluru',
  bengaluru: 'Bengaluru',
  banglore: 'Bengaluru',
  hyd: 'Hyderabad',
  hyderabad: 'Hyderabad',
  secunderabad: 'Hyderabad',
  madras: 'Chennai',
  chennai: 'Chennai',
  bombay: 'Mumbai',
  mumbai: 'Mumbai',
  ncr: 'Delhi',
  'new delhi': 'Delhi',
  delhi: 'Delhi',
  gurgaon: 'Gurugram',
  gurugram: 'Gurugram',
  'gurgaon ncr': 'Gurugram',
  noida: 'Noida',
  ghaziabad: 'Ghaziabad',
  faridabad: 'Faridabad',
  calcutta: 'Kolkata',
  kolkata: 'Kolkata',
  trivandrum: 'Thiruvananthapuram',
  thiruvananthapuram: 'Thiruvananthapuram',
  vizag: 'Visakhapatnam',
  visakhapatnam: 'Visakhapatnam',
  mysore: 'Mysuru',
  mysuru: 'Mysuru',
  mangalore: 'Mangaluru',
  mangaluru: 'Mangaluru',
  cochin: 'Kochi',
  kochi: 'Kochi',
  bhubaneshwar: 'Bhubaneswar',
  bhubaneswar: 'Bhubaneswar',
  trichy: 'Trichy',
  tiruchirappalli: 'Trichy',
  panaji: 'Goa',
  goa: 'Goa',
}

function normalizeKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function getIndianItCityState(city: string): string | undefined {
  return CITY_STATE[city]
}

/** Map free-text location to a catalog city when possible. */
export function normalizeIndianItCity(raw?: string | null): string | undefined {
  if (!raw?.trim()) return undefined
  const trimmed = raw.trim()
  const key = normalizeKey(trimmed)

  if (CITY_ALIASES[key]) return CITY_ALIASES[key]
  if (CITY_SET.has(trimmed)) return trimmed

  const exact = INDIAN_IT_CITIES.find((c) => c.toLowerCase() === key)
  if (exact) return exact

  // "Bengaluru, Karnataka" → Bengaluru
  const beforeComma = key.split(',')[0]?.trim()
  if (beforeComma) {
    if (CITY_ALIASES[beforeComma]) return CITY_ALIASES[beforeComma]
    const fromPart = INDIAN_IT_CITIES.find((c) => c.toLowerCase() === beforeComma)
    if (fromPart) return fromPart
  }

  return undefined
}

export function isIndianItCity(value: string): boolean {
  return CITY_SET.has(value)
}

export function indianItCityOptions(currentValue?: string): SelectOption[] {
  const options: SelectOption[] = INDIAN_IT_CITY_DATA.map((row) => ({
    value: row.city,
    label: row.city,
    sublabel: row.state,
  }))

  const extra = currentValue?.trim()
  if (extra && !CITY_SET.has(extra)) {
    const normalized = normalizeIndianItCity(extra)
    const state =
      getIndianItCityState(extra) ??
      (normalized ? getIndianItCityState(normalized) : undefined)
    options.unshift({
      value: extra,
      label: extra,
      sublabel: state ?? 'Saved location',
    })
  }

  return options
}
