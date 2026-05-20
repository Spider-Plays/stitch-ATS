import { UserRole } from '../types'

/**
 * UI reference for demo accounts (login page).
 * Source of truth for auth: server/src/config/users.ts — run `npm run db:seed` after edits.
 */
export interface LocalUserAccount {
    uid: string
    email: string
    password: string
    name: string
    role: UserRole
    department?: string
}

export const LOCAL_USERS: LocalUserAccount[] = [
    {
        uid: 'user-admin',
        email: 'admin@stitch.com',
        password: 'password',
        name: 'Admin User',
        role: 'ADMIN',
        department: 'Operations',
    },
    {
        uid: 'user-hr-manager',
        email: 'hr@stitch.com',
        password: 'password',
        name: 'HR Manager',
        role: 'HR_MANAGER',
        department: 'Human Resources',
    },
    {
        uid: 'user-recruiter',
        email: 'recruiter@stitch.com',
        password: 'password',
        name: 'Recruiter',
        role: 'RECRUITER',
        department: 'Talent Acquisition',
    },
    {
        uid: 'user-team-lead',
        email: 'lead@stitch.com',
        password: 'password',
        name: 'Team Lead',
        role: 'TEAM_LEAD',
        department: 'Engineering',
    },
    {
        uid: 'user-hiring-manager',
        email: 'manager@stitch.com',
        password: 'password',
        name: 'Hiring Manager',
        role: 'HIRING_MANAGER',
        department: 'Product',
    },
    {
        uid: 'user-interviewer',
        email: 'interviewer@stitch.com',
        password: 'password',
        name: 'Interviewer',
        role: 'INTERVIEWER',
        department: 'Engineering',
    },
    {
        uid: 'user-candidate',
        email: 'candidate@stitch.com',
        password: 'password',
        name: 'Jane Candidate',
        role: 'CANDIDATE',
    },
]

export function findLocalUserByEmail(email: string): LocalUserAccount | undefined {
    return LOCAL_USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
}

export function findLocalUserByUid(uid: string): LocalUserAccount | undefined {
    return LOCAL_USERS.find((u) => u.uid === uid)
}
