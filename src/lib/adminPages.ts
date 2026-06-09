import type { LucideIcon } from 'lucide-react'
import {
  Users,
  Building2,
  Sparkles,
  Shield,
  Briefcase,
  UsersRound,
} from 'lucide-react'

export type AdminHubPage = {
  to: string
  icon: LucideIcon
  title: string
  description: string
  color: string
  /** Visible only to Super Admin (e.g. user management). */
  superAdminOnly?: boolean
}

/** Sub-pages linked from the Administration hub at `/admin`. */
export const ADMIN_HUB_PAGES: AdminHubPage[] = [
  {
    to: '/admin/users',
    icon: Users,
    title: 'User management',
    description: 'Add users, assign roles, departments, and account status.',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    superAdminOnly: true,
  },
  {
    to: '/admin/departments',
    icon: Building2,
    title: 'Departments',
    description: 'Manage department names used on jobs and user profiles.',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  },
  {
    to: '/admin/clients',
    icon: Briefcase,
    title: 'Clients',
    description: 'Manage client names used when posting job requirements.',
    color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  },
  {
    to: '/admin/skills',
    icon: Sparkles,
    title: 'Skill catalog',
    description: 'Add or remove skills for requirements and candidate profiles.',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
  {
    to: '/admin/role-access',
    icon: Shield,
    title: 'Role & page access',
    description: 'Control which sidebar pages each role can see.',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    superAdminOnly: true,
  },
  {
    to: '/admin/interview-panels',
    icon: UsersRound,
    title: 'Interview panels',
    description: 'Set default L1, L2, and HR interviewers for every job.',
    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  },
]

export function adminHubPagesForRole(role?: string | null): AdminHubPage[] {
  if (role === 'SUPER_ADMIN') return ADMIN_HUB_PAGES
  return ADMIN_HUB_PAGES.filter((page) => !page.superAdminOnly)
}
