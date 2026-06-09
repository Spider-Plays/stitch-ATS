import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { APP_NAME } from '../../config/branding'
import { candidateStatusLabel } from '@/pages/candidates/_shared/candidate.utils'
import type { CandidateStatus } from '../../types'
import { StitchLogo } from '../branding/StitchLogo'

const LOGIN_PIPELINE_STATUSES = [
  'SOURCED',
  'APPLIED',
  'SCREENING',
  'SHORTLISTED',
  'INTERVIEW',
  'OFFER',
  'HIRED',
] as const satisfies readonly CandidateStatus[]

type LoginPipelineStatus = (typeof LOGIN_PIPELINE_STATUSES)[number]

const LOGIN_PIPELINE_COUNTS: Record<LoginPipelineStatus, number> = {
  SOURCED: 24,
  APPLIED: 18,
  SCREENING: 12,
  SHORTLISTED: 8,
  INTERVIEW: 5,
  OFFER: 2,
  HIRED: 1,
}

const STAGE_INTERVAL_MS = 2600

const HIGHLIGHTS = [
  { icon: 'view_kanban', text: 'Pipeline view from apply to hire' },
  { icon: 'event', text: 'Interview scheduling & feedback in one flow' },
  { icon: 'shield_person', text: 'Role-based access for every team member' },
] as const

function LoginPipelinePreview() {
  const [activeIndex, setActiveIndex] = useState(0)
  const stages = LOGIN_PIPELINE_STATUSES
  const activeStatus = stages[activeIndex]
  const activeLabel = candidateStatusLabel(activeStatus)
  const activeCount = LOGIN_PIPELINE_COUNTS[activeStatus]

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) return

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % stages.length)
    }, STAGE_INTERVAL_MS)

    return () => window.clearInterval(timer)
  }, [stages.length])

  return (
    <div
      className="relative h-44 max-w-md login-drift-slow"
      aria-live="polite"
      aria-label={`Pipeline stage: ${activeLabel}, ${activeCount} candidates`}
    >
      <div
        className="login-pipeline-card login-pipeline-stack__layer login-pipeline-stack__layer--back"
        aria-hidden
      />
      <div
        className="login-pipeline-card login-pipeline-stack__layer login-pipeline-stack__layer--mid"
        aria-hidden
      />

      <div className="login-pipeline-card login-pipeline-card-shadow login-pipeline-stack login-pipeline-stack__layer login-pipeline-stack__layer--front">
        <div key={activeStatus} className="login-pipeline-stage-content">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
            {activeLabel}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{activeCount}</p>
          <div className="mt-3 flex -space-x-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="size-7 rounded-full border-2 border-white/20 bg-white/15 backdrop-blur-sm"
              />
            ))}
            <span className="ml-1 self-center text-[10px] font-semibold text-white/60">
              candidates
            </span>
          </div>
        </div>

        <div className="login-pipeline-stage-dots" aria-hidden>
          {stages.map((status, index) => (
            <span
              key={status}
              className={clsx(
                'login-pipeline-stage-dot',
                index === activeIndex && 'login-pipeline-stage-dot--active'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export function LoginHero() {
  return (
    <div className="login-hero-panel hidden lg:flex lg:w-[54%] relative overflow-hidden flex-col justify-between p-12 text-white">
      <div className="login-hero-grid absolute inset-0 opacity-60 pointer-events-none" aria-hidden />
      <div
        className="login-hero-orb login-hero-orb-a absolute -top-24 -left-16 size-72 bg-sky-400/30"
        aria-hidden
      />
      <div
        className="login-hero-orb login-hero-orb-b absolute top-1/3 -right-20 size-96 bg-teal-300/25"
        aria-hidden
      />
      <div
        className="login-hero-orb login-hero-orb-c absolute bottom-0 left-1/4 size-64 bg-indigo-400/20"
        aria-hidden
      />

      <div className="relative z-10">
        <StitchLogo tone="inverse" size="lg" onDark wordmarkClassName="text-m3-headline" />
      </div>

      <div className="relative z-10 max-w-xl space-y-8">
        <div className="space-y-4">
          <span className="login-hero-badge">Recruiting workspace</span>
          <h1 className="text-[2.35rem] leading-[1.15] font-normal tracking-tight text-white">
            Hire faster with a pipeline your whole team can see.
          </h1>
          <p className="text-base leading-relaxed text-white/75 max-w-md">
            Source, screen, interview, and offer — one connected workspace built for modern
            recruiting teams.
          </p>
        </div>

        <LoginPipelinePreview />

        <ul className="space-y-3">
          {HIGHLIGHTS.map((item) => (
            <li key={item.text} className="flex items-start gap-3 text-sm font-medium text-white/85">
              <span className="login-hero-icon-chip material-symbols-outlined text-[18px] shrink-0">
                {item.icon}
              </span>
              {item.text}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative z-10 flex flex-wrap items-center gap-3 text-xs text-white/50">
        <span>© 2026 {APP_NAME}</span>
        <span className="hidden sm:inline text-white/25">·</span>
        <span className="login-hero-stat-pill">Live pipeline</span>
        <span className="login-hero-stat-pill">Interview plans</span>
      </div>
    </div>
  )
}

export function LoginHeroMobile() {
  const [activeIndex, setActiveIndex] = useState(0)
  const stages = LOGIN_PIPELINE_STATUSES

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) return

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % stages.length)
    }, STAGE_INTERVAL_MS)

    return () => window.clearInterval(timer)
  }, [stages.length])

  const activeStatus = stages[activeIndex]

  return (
    <div className="login-hero-panel lg:hidden relative overflow-hidden rounded-2xl p-6 mb-2 text-white">
      <div className="login-hero-grid absolute inset-0 opacity-40 pointer-events-none" aria-hidden />
      <div className="relative z-10 flex flex-col items-center text-center gap-3">
        <StitchLogo tone="inverse" size="lg" onDark />
        <p className="text-sm text-white/80 max-w-xs">
          Your recruiting pipeline — from first touch to signed offer.
        </p>
        <p
          key={activeStatus}
          className="login-pipeline-stage-content text-xs font-bold uppercase tracking-widest text-white/60"
        >
          {candidateStatusLabel(activeStatus)} · {LOGIN_PIPELINE_COUNTS[activeStatus]} candidates
        </p>
      </div>
    </div>
  )
}
