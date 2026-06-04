import clsx from 'clsx'
import { APP_WORDMARK_PRIMARY, APP_WORDMARK_SUFFIX } from '../../config/branding'

export type StitchLogoTone =
  | 'primary'
  | 'recruiter'
  | 'referral'
  | 'vendor'
  | 'candidate'
  | 'inverse'
  | 'plain'

type StitchLogoSize = 'sm' | 'md' | 'lg' | 'xl'

const SIZE_BOX: Record<StitchLogoSize, string> = {
  sm: 'size-10',
  md: 'size-11',
  lg: 'size-12',
  xl: 'size-14',
}

const SIZE_MARK: Record<StitchLogoSize, string> = {
  sm: 'size-6',
  md: 'size-7',
  lg: 'size-8',
  xl: 'size-9',
}

const WORDMARK_PRIMARY: Record<StitchLogoSize, string> = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-[1.75rem]',
}

const WORDMARK_SUFFIX: Record<StitchLogoSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
}

function markWrapperClass(tone: StitchLogoTone, onDark: boolean, size: StitchLogoSize) {
  const color = markColorClass(tone, onDark)
  if (onDark || tone === 'inverse') {
    return clsx(
      'flex shrink-0 items-center justify-center rounded-xl',
      SIZE_BOX[size],
      color,
      'bg-white/12 ring-1 ring-white/30 shadow-[0_2px_16px_rgba(0,0,0,0.25)]'
    )
  }
  return clsx(
    'flex shrink-0 items-center justify-center rounded-xl',
    SIZE_BOX[size],
    color,
    'bg-primary/[0.12] ring-1 ring-primary/30 shadow-[0_2px_18px_hsl(var(--primary)/0.28)]'
  )
}

function markColorClass(tone: StitchLogoTone, onDark: boolean) {
  if (onDark || tone === 'inverse') return 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]'
  return 'text-primary drop-shadow-[0_1px_3px_hsl(var(--primary)/0.35)]'
}

/** Interwoven thread mark — two arcs with anchor nodes (pipeline “stitch”). */
export function StitchLogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M6 7.2c0-2.35 2.85-3.65 5.4-2.1 2.05 1.25 3.6 4.35 3.6 7.4s-1.55 6.15-3.6 7.4c-2.55 1.55-5.4.25-5.4-2.1"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M18 16.8c0 2.35-2.85 3.65-5.4 2.1-2.05-1.25-3.6-4.35-3.6-7.4s1.55-6.15 3.6-7.4c2.55-1.55 5.4-.25 5.4 2.1"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity="0.88"
      />
      <circle cx="6" cy="7.2" r="2.25" fill="currentColor" />
      <circle cx="18" cy="16.8" r="2.25" fill="currentColor" />
    </svg>
  )
}

type StitchWordmarkProps = {
  size?: StitchLogoSize
  className?: string
  primaryClassName?: string
  suffixClassName?: string
  onDark?: boolean
}

export function StitchWordmark({
  size = 'md',
  className,
  primaryClassName,
  suffixClassName,
  onDark = false,
}: StitchWordmarkProps) {
  return (
    <span className={clsx('inline-flex min-w-0 items-baseline gap-1.5', className)}>
      <span
        className={clsx(
          'truncate font-extrabold tracking-tight leading-none',
          WORDMARK_PRIMARY[size],
          onDark ? 'text-white' : 'text-foreground',
          primaryClassName
        )}
      >
        {APP_WORDMARK_PRIMARY}
      </span>
      <span
        className={clsx(
          'shrink-0 font-semibold tracking-wide leading-none',
          WORDMARK_SUFFIX[size],
          onDark ? 'text-white/75' : 'text-primary/80',
          suffixClassName
        )}
      >
        {APP_WORDMARK_SUFFIX}
      </span>
    </span>
  )
}

type StitchLogoProps = {
  tone?: StitchLogoTone
  size?: StitchLogoSize
  showWordmark?: boolean
  subtitle?: string
  onDark?: boolean
  className?: string
  wordmarkClassName?: string
  subtitleClassName?: string
}

export function StitchLogo({
  tone = 'primary',
  size = 'md',
  showWordmark = true,
  subtitle,
  onDark = false,
  className,
  wordmarkClassName,
  subtitleClassName,
}: StitchLogoProps) {
  const mark = <StitchLogoMark className={SIZE_MARK[size]} />

  return (
    <div className={clsx('flex min-w-0 items-center gap-3', className)}>
      <span className={markWrapperClass(tone, onDark, size)}>{mark}</span>
      {showWordmark && (
        <div className="min-w-0">
          <StitchWordmark size={size} onDark={onDark} className={wordmarkClassName} />
          {subtitle ? (
            <p
              className={clsx(
                'text-m3-label-sm font-medium normal-case tracking-normal mt-0.5',
                onDark ? 'text-white/75' : 'text-primary/55',
                subtitleClassName
              )}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}
