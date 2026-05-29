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

export type RequirementVersionKind = 'UPDATE' | 'CANDIDATE_LINKED'

export interface RequirementVersionLinkedCandidate {
    id: string
    name: string
    email: string
    status: string
    matchScore: number
}

export interface RequirementVersionMatchingProfile {
    candidateId: string
    name: string
    matchScore: number
    alreadyLinked: boolean
    linkedToOther: boolean
}

export interface RequirementVersion {
    version: number
    changedBy: string // User ID
    changedAt: string // ISO Date
    kind?: RequirementVersionKind
    changes: Record<string, unknown>
    linkedCandidates?: RequirementVersionLinkedCandidate[]
    matchingProfiles?: RequirementVersionMatchingProfile[]
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
    jobDescription?: string
    primarySkills?: string[]
    secondarySkills?: string[]
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
    visibleToVendors?: boolean
}

export type VendorStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

export interface Vendor {
    id: string
    name: string
    code?: string
    email: string
    phone?: string
    website?: string
    address?: string
    contactName?: string
    status: VendorStatus
    notes?: string
    createdAt: string
    updatedAt: string
    userCount?: number
    submissionCount?: number
    assignmentCount?: number
}

export interface VendorAssignment {
    id: string
    requirementId: string
    assignedAt: string
    title?: string
    jobCode?: string | null
    status?: string
    department?: string
}

export interface VendorDetail extends Vendor {
    users: User[]
    assignments: VendorAssignment[]
    submissions: {
        id: string
        name: string
        email: string
        status: string
        jobTitle?: string | null
        requirementId?: string | null
        createdAt: string
    }[]
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
    pan?: string
    vendorId?: string
    submittedByUserId?: string
    primarySkills?: string[]
    secondarySkills?: string[]
    createdAt?: string
    updatedAt?: string
}

export interface ProfileMatchBreakdown {
    primaryScore: number
    secondaryScore: number
    jdScore: number
    matchedPrimary: string[]
    matchedSecondary: string[]
}

export interface MatchingProfile {
    candidateId: string
    matchScore: number
    breakdown: ProfileMatchBreakdown
    alreadyLinked: boolean
    linkedToOther: boolean
    candidate: Candidate
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
    hasFeedback?: boolean
    feedbackRecommendation?: Feedback['recommendation']
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

export type UserRole = 'ADMIN' | 'HR_HEAD' | 'HR_MANAGER' | 'RECRUITER' | 'TEAM_LEAD' | 'HIRING_MANAGER' | 'INTERVIEWER' | 'CANDIDATE' | 'VENDOR';

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
    vendorId?: string;
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
