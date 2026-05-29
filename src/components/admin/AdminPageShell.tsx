import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

type AdminPageShellProps = {
  title: string
  description: string
  children: React.ReactNode
}

export function AdminPageShell({ title, description, children }: AdminPageShellProps) {
  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
      <Link
        to="/admin"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary dark:hover:text-white mb-6"
      >
        <ArrowLeft size={16} aria-hidden />
        Administration
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-primary dark:text-white tracking-tight">{title}</h1>
        <p className="text-primary/60 dark:text-white/60 font-medium mt-2">{description}</p>
      </div>

      {children}
    </div>
  )
}
