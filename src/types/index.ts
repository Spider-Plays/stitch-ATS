export type RequirementStatus =
    | 'DRAFT'
    | 'PENDING_APPROVAL'
    | 'APPROVED'
    | 'LIVE'
    | 'ON_HOLD'
    | 'CLOSED'
    | 'REJECTED'

export interface ApprovalHistory {
    action: 'REQUESTED' | 'APPROVED' | 'REJECTED'
    by: string // User ID
    at: string // ISO Date
    role: string // User Role
    comments?: string
}

export interface RequirementVersion {
    version: number
    changedBy: string // User ID
    changedAt: string // ISO Date
    changes: Record<string, any> // Object containing changed fields
}

export interface Requirement {
    id: string
    jobCode?: string
    client?: string
    title: string
    department: string
    hiringManager: string
    status: RequirementStatus
    openings: number
    filled: number
    createdAt: string
    updatedAt: string
    recruiters: string[] // User IDs
    priority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    location?: string
    description?: string
    createdBy?: string
    createdByRole?: string

    // Approval Workflow
    approval?: {
        decision: 'APPROVED' | 'REJECTED' | 'PENDING'
        decidedBy?: string
        decidedAt?: string
    }
    approvalHistory?: ApprovalHistory[]

    // Versioning
    versions?: RequirementVersion[]
    currentVersion?: number
    visibleToCandidates?: boolean
}

export type CandidateStatus = 'SOURCED' | 'APPLIED' | 'SCREENING' | 'SHORTLISTED' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED'

export interface Candidate {
    id: string
    name: string
    email: string
    role: string
    status: CandidateStatus
    matchScore: number
    source: string
    appliedDate: string
    requirementId?: string // Link to specific job requirement
    jobTitle?: string // Denormalized for display
    reqId?: string // Requirement job code
    client?: string
    createdBy?: string
    recruiterName?: string
    avatar?: string
    resumeFileName?: string
    resumeMimeType?: string
    hasResume?: boolean
    phone?: string
    location?: string
    linkedIn?: string
    portfolio?: string
    totalExperience?: string
    currentCompany?: string
    currentCTC?: string
    expectedCTC?: string
    noticePeriod?: string
    createdAt?: string
    updatedAt?: string
}

export interface Interview {
    id: string
    candidateId: string
    requirementId: string
    scheduledAt: string
    interviewerIds: string[] // Array of user IDs
    type: 'SCREENING' | 'TECHNICAL' | 'CULTURAL' | 'SYSTEM_DESIGN' | 'BEHAVIORAL'
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'
    meetingLink?: string
    duration?: number // in minutes
    location?: string
    description?: string
    candidateName?: string
    candidateRole?: string
    candidateEmail?: string
}

export interface Feedback {
    id: string
    interviewId: string
    interviewerId: string
    candidateId: string
    rating: number // Overall 1-5
    technicalRating?: number
    communicationRating?: number
    comments: string
    recommendation: 'STRONG_HIRE' | 'HIRE' | 'ON_HOLD' | 'NO_HIRE' | 'STRONG_NO_HIRE'
    formData?: import('../config/interviewFeedbackForm').InterviewFeedbackFormData
    interviewerName?: string
    createdAt: string
}

export interface Offer {
    id: string
    candidateId: string
    requirementId: string
    baseSalary: number
    equity?: number // RSUs
    bonus?: number // Percentage or fixed amount
    status: 'DRAFT' | 'APPROVAL_PENDING' | 'APPROVED' | 'SENT' | 'NEGOTIATION' | 'ACCEPTED' | 'DECLINED' | 'WITHDRAWN'
    history: {
        id: string
        date: string
        action: string
        description: string
        userId: string
    }[]
    letterContent?: string // HTML or text content
    createdAt: string
    createdBy: string
}

export type UserRole = 'ADMIN' | 'HR_HEAD' | 'HR_MANAGER' | 'RECRUITER' | 'TEAM_LEAD' | 'HIRING_MANAGER' | 'INTERVIEWER' | 'CANDIDATE';

export interface User {
    uid: string;
    name: string;
    email: string;
    role: UserRole;
    permissions: string[];
    themePreference: 'light' | 'dark' | 'system';
    createdAt: string;
    avatar?: string;
    phoneNumber?: string;
    address?: string;
    resumeUrl?: string;
    status?: 'ACTIVE' | 'DISABLED';
    authProvider?: string;
    department?: string;
    lastLogin?: string;
}

export interface ActivityLog {
    id: string
    entityType: 'REQUIREMENT' | 'CANDIDATE' | 'OFFER' | 'INTERVIEW'
    entityId: string
    action: string
    performedBy: string // User ID
    performerName?: string
    performerRole?: string
    timestamp: string
    details?: any
}
