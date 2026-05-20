/** Demo users seeded into the database — edit for local/dev accounts. */
export const SEED_USERS = [
  { email: 'admin@stitch.com', password: 'password', name: 'Admin User', role: 'ADMIN', department: 'Operations' },
  { email: 'hr@stitch.com', password: 'password', name: 'HR Manager', role: 'HR_MANAGER', department: 'Human Resources' },
  { email: 'recruiter@stitch.com', password: 'password', name: 'Recruiter', role: 'RECRUITER', department: 'Talent Acquisition' },
  { email: 'lead@stitch.com', password: 'password', name: 'Team Lead', role: 'TEAM_LEAD', department: 'Engineering' },
  { email: 'manager@stitch.com', password: 'password', name: 'Hiring Manager', role: 'HIRING_MANAGER', department: 'Product' },
  { email: 'interviewer@stitch.com', password: 'password', name: 'Interviewer', role: 'INTERVIEWER', department: 'Engineering' },
  { email: 'candidate@stitch.com', password: 'password', name: 'Jane Candidate', role: 'CANDIDATE' },
] as const
