import type { LucideIcon } from 'lucide-react'
import {
  Briefcase,
  Calendar,
  GitBranch,
  LayoutDashboard,
  Users,
  Gift,
} from 'lucide-react'
import type { PageKey } from './pageAccess'

export type RecruitmentDashboardLink = {
  page: PageKey
  to: string
  label: string
  description: string
  icon: LucideIcon
}

export const RECRUITMENT_DASHBOARD_LINKS: RecruitmentDashboardLink[] = [
  {
    page: 'dashboard',
    to: '/dashboard',
    label: 'Home dashboard',
    description: 'Role-based overview, activity, and quick actions.',
    icon: LayoutDashboard,
  },
  {
    page: 'requirements',
    to: '/requirements',
    label: 'Requirements',
    description: 'Open roles, approvals, and hiring progress.',
    icon: Briefcase,
  },
  {
    page: 'candidates',
    to: '/candidates',
    label: 'Candidates',
    description: 'Full talent pool across all sources.',
    icon: Users,
  },
  {
    page: 'pipeline',
    to: '/pipeline',
    label: 'Pipeline',
    description: 'Pipeline by requirement and stage.',
    icon: GitBranch,
  },
  {
    page: 'interviews',
    to: '/interviews',
    label: 'Interviews',
    description: 'Scheduled interviews and feedback.',
    icon: Calendar,
  },
  {
    page: 'offers',
    to: '/offers',
    label: 'Offers',
    description: 'Offer letters and approvals.',
    icon: Gift,
  },
]

export function dashboardsForPages(allowedPages: PageKey[]): RecruitmentDashboardLink[] {
  return RECRUITMENT_DASHBOARD_LINKS.filter((d) => allowedPages.includes(d.page))
}
