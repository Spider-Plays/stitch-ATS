/**
 * Dev quick-login buttons (Login page only).
 * Emails/passwords must match server/src/config/devUsers.ts — run `npm run db:seed` in server/.
 */
export const DEV_LOGIN_ACCOUNTS = [
  { label: 'Admin', role: 'ADMIN', email: 'dev-admin@local.test', password: 'DevTest123!' },
  { label: 'HR Head', role: 'HR_HEAD', email: 'dev-hrhead@local.test', password: 'DevTest123!' },
  { label: 'HR Manager', role: 'HR_MANAGER', email: 'dev-hrmanager@local.test', password: 'DevTest123!' },
  { label: 'Recruiter', role: 'RECRUITER', email: 'dev-recruiter@local.test', password: 'DevTest123!' },
  { label: 'Team Lead', role: 'TEAM_LEAD', email: 'dev-teamlead@local.test', password: 'DevTest123!' },
  { label: 'Hiring Manager', role: 'HIRING_MANAGER', email: 'dev-hiringmanager@local.test', password: 'DevTest123!' },
  { label: 'Interviewer', role: 'INTERVIEWER', email: 'dev-interviewer@local.test', password: 'DevTest123!' },
  { label: 'Vendor', role: 'VENDOR', email: 'dev-vendor@local.test', password: 'DevTest123!' },
  { label: 'Employee', role: 'EMPLOYEE', email: 'dev-employee@local.test', password: 'DevTest123!' },
  { label: 'Candidate', role: 'CANDIDATE', email: 'dev-candidate@local.test', password: 'DevTest123!' },
] as const
