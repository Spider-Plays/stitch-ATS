import React from 'react'
import { TaggedCandidatesList } from '../../components/features/TaggedCandidatesList'
import {
  careersCandidateStats,
  isCareersCandidate,
} from '../../lib/featureCandidates'

const CareersCandidates = () => (
  <TaggedCandidatesList
    eyebrow="Careers"
    title="Careers applicants"
    description="Profiles from the candidate portal: self-registered candidates and direct job applications."
    filter={isCareersCandidate}
    stats={careersCandidateStats}
    channelBadge={{ label: 'Portal', title: 'Candidate portal / self-applied' }}
    emptyTitle="No portal applications yet"
    emptyDescription="When candidates sign up or apply through the careers portal, their profiles appear here."
  />
)

export default CareersCandidates
