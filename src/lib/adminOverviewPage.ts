import type { InterviewPanelLevel, User, UserRole } from '../types'
import { mergeInterviewPanelLevels } from './interviewPanelLevels'

const NON_STAFF_ROLES: UserRole[] = ['CANDIDATE', 'VENDOR']

export function isStaffUser(user: User): boolean {
  return !NON_STAFF_ROLES.includes(user.role)
}

export type AdminSetupMetrics = {
  staffTotal: number
  activeStaff: number
  disabledStaff: number
  departments: number
  clients: number
  skills: number
  panelInterviewers: number
  emptyPanelLevels: number
}

export function adminSetupMetrics(
  users: User[],
  departments: string[],
  clients: string[],
  skills: { id: string }[],
  panelLevels: InterviewPanelLevel[] | undefined
): AdminSetupMetrics {
  const staff = users.filter(isStaffUser)
  const levels = mergeInterviewPanelLevels(panelLevels)
  const panelIds = new Set<string>()
  let emptyPanelLevels = 0
  for (const level of levels) {
    if (!level.interviewerIds.length) emptyPanelLevels += 1
    for (const id of level.interviewerIds) panelIds.add(id)
  }

  return {
    staffTotal: staff.length,
    activeStaff: staff.filter((u) => u.status !== 'DISABLED').length,
    disabledStaff: staff.filter((u) => u.status === 'DISABLED').length,
    departments: departments.length,
    clients: clients.length,
    skills: skills.length,
    panelInterviewers: panelIds.size,
    emptyPanelLevels,
  }
}

export type AdminSetupTask = {
  id: string
  title: string
  description: string
  to: string
  tone: 'warning' | 'info'
}

export function adminSetupTasks(metrics: AdminSetupMetrics): AdminSetupTask[] {
  const tasks: AdminSetupTask[] = []

  if (metrics.departments === 0) {
    tasks.push({
      id: 'departments',
      title: 'Add departments',
      description: 'Departments are required when posting jobs and assigning users.',
      to: '/admin/departments',
      tone: 'warning',
    })
  }
  if (metrics.clients === 0) {
    tasks.push({
      id: 'clients',
      title: 'Add clients',
      description: 'Client names appear on requirements and reports.',
      to: '/admin/clients',
      tone: 'warning',
    })
  }
  if (metrics.skills === 0) {
    tasks.push({
      id: 'skills',
      title: 'Build the skill catalog',
      description: 'Skills power job postings and candidate matching.',
      to: '/admin/skills',
      tone: 'warning',
    })
  }
  if (metrics.emptyPanelLevels > 0) {
    tasks.push({
      id: 'panels',
      title: 'Complete interview panels',
      description: `${metrics.emptyPanelLevels} panel level${metrics.emptyPanelLevels === 1 ? '' : 's'} still need default interviewers.`,
      to: '/admin/interview-panels',
      tone: 'warning',
    })
  }
  if (metrics.disabledStaff > 0) {
    tasks.push({
      id: 'disabled',
      title: 'Review disabled accounts',
      description: `${metrics.disabledStaff} staff account${metrics.disabledStaff === 1 ? ' is' : 's are'} disabled.`,
      to: '/admin/users',
      tone: 'info',
    })
  }
  if (metrics.staffTotal <= 1) {
    tasks.push({
      id: 'invite',
      title: 'Invite your team',
      description: 'Add recruiters, hiring managers, and interviewers to run hiring workflows.',
      to: '/admin/users',
      tone: 'info',
    })
  }

  return tasks
}

const ROLE_ORDER: UserRole[] = [
  'ADMIN',
  'HR_HEAD',
  'HR_MANAGER',
  'RECRUITER',
  'TEAM_LEAD',
  'HIRING_MANAGER',
  'INTERVIEWER',
]

export function staffRoleCounts(users: User[]): { role: UserRole; count: number; label: string }[] {
  const staff = users.filter(isStaffUser)
  const counts = new Map<UserRole, number>()
  for (const u of staff) {
    counts.set(u.role, (counts.get(u.role) ?? 0) + 1)
  }
  return ROLE_ORDER.filter((role) => (counts.get(role) ?? 0) > 0).map((role) => ({
    role,
    count: counts.get(role) ?? 0,
    label: role.replace(/_/g, ' '),
  }))
}

export function recentStaffUsers(users: User[], limit = 5): User[] {
  return [...users]
    .filter(isStaffUser)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
}
