import type { Prisma } from '@prisma/client'

export const CAREERS_CANDIDATE_WHERE: Prisma.CandidateWhereInput = {
  source: 'Candidate Portal',
}

export const ERP_CANDIDATE_WHERE: Prisma.CandidateWhereInput = {
  OR: [
    { referredByUserId: { not: null } },
    { source: { startsWith: 'Employee Referral' } },
  ],
}
