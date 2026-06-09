/** Dev-only test accounts. Seeded via `npm run db:seed` (blocked in production). */
export const DEV_PASSWORD = 'DevTest123!'

export const DEV_USERS = [
  { email: 'dev-superadmin@local.test', password: DEV_PASSWORD, name: 'Dev Super Admin', role: 'SUPER_ADMIN', department: 'Operations' },
  { email: 'dev-admin@local.test', password: DEV_PASSWORD, name: 'Dev Admin', role: 'ADMIN', department: 'Operations' },
  { email: 'dev-hrhead@local.test', password: DEV_PASSWORD, name: 'Dev HR Head', role: 'HR_HEAD', department: 'HR' },
  { email: 'dev-hrmanager@local.test', password: DEV_PASSWORD, name: 'Dev HR Manager', role: 'HR_MANAGER', department: 'HR' },
  { email: 'dev-recruiter@local.test', password: DEV_PASSWORD, name: 'Dev Recruiter', role: 'RECRUITER', department: 'Talent' },
  { email: 'dev-teamlead@local.test', password: DEV_PASSWORD, name: 'Dev Team Lead', role: 'TEAM_LEAD', department: 'Talent' },
  { email: 'dev-hiringmanager@local.test', password: DEV_PASSWORD, name: 'Dev Hiring Manager', role: 'HIRING_MANAGER', department: 'Engineering' },
  { email: 'dev-interviewer@local.test', password: DEV_PASSWORD, name: 'Dev Interviewer', role: 'INTERVIEWER', department: 'Engineering' },
  { email: 'dev-vendor@local.test', password: DEV_PASSWORD, name: 'Dev Vendor', role: 'VENDOR' },
  { email: 'dev-employee@local.test', password: DEV_PASSWORD, name: 'Dev Employee', role: 'EMPLOYEE', department: 'Engineering' },
  { email: 'dev-candidate@local.test', password: DEV_PASSWORD, name: 'Dev Candidate', role: 'CANDIDATE' },
] as const
