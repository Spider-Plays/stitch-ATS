import React from 'react'
import { Link } from 'react-router-dom'
import { APP_NAME } from '../../config/branding'
import { StitchLogo } from '../branding/StitchLogo'

type CandidateAuthShellProps = {
  title: string
  subtitle: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function CandidateAuthShell({
  title,
  subtitle,
  children,
  footer,
}: CandidateAuthShellProps) {
  return (
    <div className="min-h-screen flex bg-slate-50">
      <div className="hidden lg:flex lg:w-[46%] relative overflow-hidden bg-[#0f3d38] text-white p-12 flex-col justify-between">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-transparent to-teal-950/80" />
        <div className="relative z-10">
          <StitchLogo
            tone="primary"
            size="lg"
            onDark
            subtitle="Candidate portal"
            subtitleClassName="text-emerald-200/80"
          />
        </div>

        <div className="relative z-10 max-w-md space-y-6">
          <h1 className="text-4xl font-black leading-tight tracking-tight">
            Your hiring journey, in one place.
          </h1>
          <ul className="space-y-4 text-white/85 text-sm font-medium">
            <li className="flex gap-3">
              <span className="material-symbols-outlined text-emerald-300 shrink-0">check_circle</span>
              Browse open roles and apply with one profile
            </li>
            <li className="flex gap-3">
              <span className="material-symbols-outlined text-emerald-300 shrink-0">check_circle</span>
              Track application status from screening to offer
            </li>
            <li className="flex gap-3">
              <span className="material-symbols-outlined text-emerald-300 shrink-0">check_circle</span>
              See interview schedules and offer details
            </li>
          </ul>
        </div>

        <p className="relative z-10 text-xs text-white/50">© 2026 {APP_NAME}</p>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-10">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex justify-center mb-2">
            <StitchLogo tone="primary" subtitle="Candidate portal" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
            <p className="mt-2 text-slate-600 text-sm font-medium">{subtitle}</p>
          </div>
          {children}
          {footer}
          <p className="text-center text-xs text-slate-500">
            Hiring team?{' '}
            <Link to="/login" className="font-bold text-[#0f3d38] hover:underline">
              Sign in to {APP_NAME}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
