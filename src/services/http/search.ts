import { apiRequest } from '../../lib/apiClient'
import { Candidate, Requirement, User, Interview } from '../../types'

export type SearchResults = {
  candidates: Candidate[]
  requirements: Requirement[]
  users: User[]
  interviews: Interview[]
}

export const searchService = {
  query: (q: string) => apiRequest<SearchResults>(`/search?q=${encodeURIComponent(q)}`),
}
