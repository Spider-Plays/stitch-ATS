import type { ActivityLog, Prisma } from '@prisma/client'

import { prisma } from './prisma.js'

import {

  assertCanViewCandidate,

  buildCandidateListWhere,

  candidateIdsForInterviewer,

  interviewIdsForInterviewer,

  INTERVIEWER_VISIBLE_CANDIDATE_ACTIONS,

} from './candidateAccess.js'

import { hasOrgWideAccess } from './orgAccess.js'
import { requirementIdsForAuth } from './requirementAccess.js'



async function visibleCandidateIds(

  auth: { userId: string; role: string; name?: string }

): Promise<string[]> {

  const where = await buildCandidateListWhere(auth)

  const rows = await prisma.candidate.findMany({ where, select: { id: true } })

  return rows.map((r) => r.id)

}



async function visibleInterviewIds(

  auth: { userId: string; role: string; name?: string }

): Promise<string[]> {

  if (auth.role === 'INTERVIEWER') {

    return interviewIdsForInterviewer(auth.userId)

  }

  const candidateIds = await visibleCandidateIds(auth)

  if (candidateIds.length === 0) return []

  const rows = await prisma.interview.findMany({

    where: { candidateId: { in: candidateIds } },

    select: { id: true },

  })

  return rows.map((r) => r.id)

}



async function scopedActivityWhere(

  auth: { userId: string; role: string; name?: string }

): Promise<Prisma.ActivityLogWhereInput> {

  if (hasOrgWideAccess(auth.role)) {

    return {}

  }



  const [candidateIds, requirementIds, interviewIds] = await Promise.all([

    visibleCandidateIds(auth),

    requirementIdsForAuth(auth),

    visibleInterviewIds(auth),

  ])



  const or: Prisma.ActivityLogWhereInput[] = []



  if (auth.role === 'INTERVIEWER') {

    if (interviewIds.length > 0) {

      or.push({ entityType: 'INTERVIEW', entityId: { in: interviewIds } })

    }

    if (candidateIds.length > 0) {

      or.push({

        entityType: 'CANDIDATE',

        entityId: { in: candidateIds },

        action: { in: [...INTERVIEWER_VISIBLE_CANDIDATE_ACTIONS] },

      })

    }

    return or.length > 0 ? { OR: or } : { id: { in: ['__none__'] } }

  }



  if (candidateIds.length > 0) {

    or.push({ entityType: 'CANDIDATE', entityId: { in: candidateIds } })

  }

  if (requirementIds.length > 0) {

    or.push({ entityType: 'REQUIREMENT', entityId: { in: requirementIds } })

  }

  if (interviewIds.length > 0) {

    or.push({ entityType: 'INTERVIEW', entityId: { in: interviewIds } })

  }



  return or.length > 0 ? { OR: or } : { id: { in: ['__none__'] } }

}



export async function listActivityLogsForAuth(

  auth: { userId: string; role: string; name?: string },

  limit: number

): Promise<ActivityLog[]> {

  const where = await scopedActivityWhere(auth)

  return prisma.activityLog.findMany({

    where,

    orderBy: { timestamp: 'desc' },

    take: limit,

  })

}



export async function listActivityLogsForEntity(

  auth: { userId: string; role: string; name?: string },

  entityId: string,

  limit: number

): Promise<ActivityLog[]> {

  if (auth.role === 'INTERVIEWER') {

    await assertCanViewCandidate(auth, entityId)

    return prisma.activityLog.findMany({

      where: {

        entityId,

        entityType: 'CANDIDATE',

        action: { in: [...INTERVIEWER_VISIBLE_CANDIDATE_ACTIONS] },

      },

      orderBy: { timestamp: 'desc' },

      take: limit,

    })

  }



  const [candidateIds, requirementIds] = await Promise.all([

    visibleCandidateIds(auth),

    requirementIdsForAuth(auth),

  ])



  if (candidateIds.includes(entityId)) {

    return prisma.activityLog.findMany({

      where: { entityId, entityType: 'CANDIDATE' },

      orderBy: { timestamp: 'desc' },

      take: limit,

    })

  }



  if (requirementIds.includes(entityId)) {

    return prisma.activityLog.findMany({

      where: { entityId, entityType: 'REQUIREMENT' },

      orderBy: { timestamp: 'desc' },

      take: limit,

    })

  }



  if (hasOrgWideAccess(auth.role)) {

    return prisma.activityLog.findMany({

      where: { entityId },

      orderBy: { timestamp: 'desc' },

      take: limit,

    })

  }



  return []

}


