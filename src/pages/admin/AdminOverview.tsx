import React from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Building2,
  Sparkles,
  Shield,
  Briefcase,
  UserRound,
  Store,
} from 'lucide-react'

const CARDS = [
  {
    to: '/admin/users',
    icon: Users,
    title: 'User management',
    description: 'Invite users, assign roles, departments, and account status.',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  },
  {
    to: '/admin/departments',
    icon: Building2,
    title: 'Departments',
    description: 'Manage department names used on jobs and user profiles.',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
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
  },
]

const QUICK_LINKS = [
  { to: '/requirements', icon: Briefcase, label: 'Requirements' },
  { to: '/candidates', icon: UserRound, label: 'Candidates' },
  { to: '/vendors', icon: Store, label: 'Vendors' },
]

const AdminOverview = () => {
  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-primary dark:text-white tracking-tight">
          Administration
        </h1>
        <p className="text-primary/60 dark:text-white/60 font-medium mt-2 max-w-2xl">
          Central hub for catalogs, users, and access control. As an admin you can edit all
          requirements, candidates, interviews, and offers across the system.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-10">
        {CARDS.map(({ to, icon: Icon, title, description, color }) => (
          <Link
            key={to}
            to={to}
            className="group bg-white dark:bg-white/5 rounded-2xl border border-primary/10 dark:border-white/10 p-6 shadow-sm hover:border-primary/25 dark:hover:border-white/20 transition-all"
          >
            <div className={`inline-flex p-2.5 rounded-xl mb-4 ${color}`}>
              <Icon size={22} aria-hidden />
            </div>
            <h2 className="text-lg font-black text-primary dark:text-white group-hover:underline">
              {title}
            </h2>
            <p className="text-sm text-primary/60 dark:text-white/60 mt-1">{description}</p>
          </Link>
        ))}
      </div>

      <div className="bg-white dark:bg-white/5 rounded-2xl border border-primary/10 dark:border-white/10 p-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-primary/40 dark:text-white/40 mb-4">
          Jump to hiring data
        </h3>
        <div className="flex flex-wrap gap-3">
          {QUICK_LINKS.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 dark:bg-white/10 text-sm font-bold text-primary dark:text-white hover:bg-primary/10 dark:hover:bg-white/15"
            >
              <Icon size={16} aria-hidden />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AdminOverview
