import React from 'react'
import { TaggedCandidatesList } from '../../components/features/TaggedCandidatesList'
import {
  employeeReferralStats,
  isEmployeeReferralCandidate,
} from '../../lib/featureCandidates'

const EmployeeReferralCandidates = () => (
  <TaggedCandidatesList
    eyebrow="Employee referral"
    title="ERP referrals"
    description="Candidates referred by internal employees through the employee referral portal. Each profile is tagged ERP."
    filter={isEmployeeReferralCandidate}
    stats={employeeReferralStats}
    channelBadge={{ label: 'ERP', title: 'Employee referral program' }}
    emptyTitle="No employee referrals yet"
    emptyDescription="Referrals submitted from the employee referral portal will show here with the ERP tag."
  />
)

export default EmployeeReferralCandidates
