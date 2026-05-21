import type { User as DbUser, Requirement as DbReq, Candidate as DbCand, Interview as DbInt, Feedback as DbFb, Offer as DbOffer, ActivityLog as DbLog } from '@prisma/client'

export function mapUser(u: DbUser) {
  return {
    uid: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    permissions: JSON.parse(u.permissions || '[]') as string[],
    themePreference: u.themePreference as 'light' | 'dark' | 'system',
    createdAt: u.createdAt.toISOString(),
    avatar: u.avatar ?? undefined,
    phoneNumber: u.phoneNumber ?? undefined,
    address: u.address ?? undefined,
    resumeUrl: u.resumeUrl ?? undefined,
    status: u.status as 'ACTIVE' | 'DISABLED',
    authProvider: u.authProvider,
    department: u.department ?? undefined,
    lastLogin: u.lastLogin?.toISOString(),
  }
}

export function mapRequirement(r: DbReq) {
  return {
    id: r.id,
    jobCode: r.jobCode ?? undefined,
    client: r.client ?? undefined,
    title: r.title,
    department: r.department,
    hiringManager: r.hiringManager,
    status: r.status,
    openings: r.openings,
    filled: r.filled,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    recruiters: JSON.parse(r.recruiters || '[]') as string[],
    priority: r.priority as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | undefined,
    location: r.location ?? undefined,
    description: r.description ?? undefined,
    createdBy: r.createdBy ?? undefined,
    createdByRole: r.createdByRole ?? undefined,
    approval: r.approval ? JSON.parse(r.approval) : undefined,
    approvalHistory: JSON.parse(r.approvalHistory || '[]'),
    versions: JSON.parse(r.versions || '[]'),
    currentVersion: r.currentVersion,
    visibleToCandidates: r.visibleToCandidates ?? true,
  }
}

export function mapCandidate(
  c: DbCand,
  ctx?: {
    requirement?: Pick<DbReq, 'id' | 'jobCode' | 'client' | 'title'> | null
    recruiter?: Pick<DbUser, 'id' | 'name'> | null
  }
) {
  const req = ctx?.requirement
  const recruiter = ctx?.recruiter
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    role: c.role,
    status: c.status,
    matchScore: c.matchScore,
    source: c.source,
    appliedDate: c.appliedDate.toISOString(),
    requirementId: c.requirementId ?? undefined,
    jobTitle: c.jobTitle ?? req?.title ?? undefined,
    reqId: req?.jobCode ?? (req ? req.id.slice(-8).toUpperCase() : undefined),
    client: req?.client ?? undefined,
    createdBy: c.createdBy ?? undefined,
    recruiterName: recruiter?.name ?? undefined,
    avatar: c.avatar ?? undefined,
    resumeFileName: c.resumeFileName ?? undefined,
    resumeMimeType: c.resumeMimeType ?? undefined,
    hasResume: !!c.resumeFileName,
    phone: c.phone ?? undefined,
    location: c.location ?? undefined,
    linkedIn: c.linkedIn ?? undefined,
    portfolio: c.portfolio ?? undefined,
    totalExperience: c.totalExperience ?? undefined,
    currentCompany: c.currentCompany ?? undefined,
    currentCTC: c.currentCTC ?? undefined,
    expectedCTC: c.expectedCTC ?? undefined,
    noticePeriod: c.noticePeriod ?? undefined,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }
}

export function mapInterview(i: DbInt) {
  return {
    id: i.id,
    candidateId: i.candidateId,
    requirementId: i.requirementId,
    scheduledAt: i.scheduledAt.toISOString(),
    interviewerIds: JSON.parse(i.interviewerIds || '[]') as string[],
    type: i.type,
    status: i.status,
    meetingLink: i.meetingLink ?? undefined,
    duration: i.duration ?? undefined,
    location: i.location ?? undefined,
    description: i.description ?? undefined,
  }
}

export function mapFeedback(f: DbFb) {
  let formData: unknown = {}
  try {
    formData = JSON.parse(f.formData || '{}')
  } catch {
    formData = {}
  }
  return {
    id: f.id,
    interviewId: f.interviewId,
    interviewerId: f.interviewerId,
    candidateId: f.candidateId,
    rating: f.rating,
    technicalRating: f.technicalRating ?? undefined,
    communicationRating: f.communicationRating ?? undefined,
    comments: f.comments,
    recommendation: f.recommendation,
    formData,
    createdAt: f.createdAt.toISOString(),
  }
}

export function mapOffer(o: DbOffer) {
  return {
    id: o.id,
    candidateId: o.candidateId,
    requirementId: o.requirementId,
    baseSalary: o.baseSalary,
    equity: o.equity ?? undefined,
    bonus: o.bonus ?? undefined,
    status: o.status,
    history: JSON.parse(o.history || '[]'),
    letterContent: o.letterContent ?? undefined,
    createdAt: o.createdAt.toISOString(),
    createdBy: o.createdBy,
  }
}

export function mapActivityLog(l: DbLog) {
  return {
    id: l.id,
    entityType: l.entityType,
    entityId: l.entityId,
    action: l.action,
    performedBy: l.performedBy,
    performerName: l.performerName ?? undefined,
    performerRole: l.performerRole ?? undefined,
    timestamp: l.timestamp.toISOString(),
    details: l.details ? JSON.parse(l.details) : undefined,
  }
}
