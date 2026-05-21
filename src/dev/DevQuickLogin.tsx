import React, { useEffect, useState } from 'react'
import { DEV_LOGIN_ACCOUNTS } from './devLoginAccounts'

type Props = {
  login: (email: string, password: string) => Promise<{ user: { role: string }; allowedPages: string[] }>
  redirectByRole: (role: string, allowedPages?: string[]) => void
  disabled?: boolean
}

type Health = 'checking' | 'ok' | 'db_down' | 'api_down'

export const DevQuickLogin: React.FC<Props> = ({ login, redirectByRole, disabled }) => {
  const [activeRole, setActiveRole] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [health, setHealth] = useState<Health>('checking')

  useEffect(() => {
    let cancelled = false
    fetch('/api/health')
      .then(async (res) => {
        if (cancelled) return
        if (!res.ok) {
          setHealth('db_down')
          return
        }
        const body = (await res.json()) as { database?: string }
        setHealth(body.database === 'connected' ? 'ok' : 'db_down')
      })
      .catch(() => {
        if (!cancelled) setHealth('api_down')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleQuickLogin = async (email: string, password: string, role: string) => {
    setActiveRole(role)
    setError(null)
    try {
      const session = await login(email, password)
      redirectByRole(session.user.role, session.allowedPages)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : ''
      if (message === 'ACCOUNT_DISABLED') {
        setError('Account disabled.')
      } else if (
        message.includes('Database unavailable') ||
        message.includes('Neon')
      ) {
        setError(message)
      } else if (message.includes('Cannot reach API')) {
        setError(message)
      } else if (message === 'Invalid email or password' || message === 'INVALID_CREDENTIALS') {
        setError(
          'Invalid credentials — dev users missing. With the database awake, run: cd server && npm run db:seed'
        )
      } else {
        setError(message || 'Login failed.')
      }
      setActiveRole(null)
    }
  }

  const healthNote =
    health === 'checking'
      ? 'Checking API & database…'
      : health === 'ok'
        ? 'API and database connected.'
        : health === 'db_down'
          ? 'Database asleep or unreachable — open console.neon.tech, resume your project, wait ~10s, then run: cd server && npm run db:seed'
          : 'API not reachable — run npm run dev from the project root.'

  return (
    <div className="rounded-xl border border-dashed border-amber-300 dark:border-amber-600/50 bg-amber-50/80 dark:bg-amber-950/20 p-4 space-y-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
          Dev quick login
        </p>
        <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
          Password for all: <span className="font-mono">DevTest123!</span> — seed with{' '}
          <span className="font-mono">npm run db:seed</span> (server folder)
        </p>
        <p
          className={`text-[11px] mt-1 font-medium ${
            health === 'ok'
              ? 'text-green-700 dark:text-green-400'
              : health === 'checking'
                ? 'text-amber-700/80'
                : 'text-red-600 dark:text-red-400'
          }`}
        >
          {healthNote}
        </p>
      </div>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {DEV_LOGIN_ACCOUNTS.map((account) => {
          const busy = activeRole === account.role
          return (
            <button
              key={account.role}
              type="button"
              disabled={disabled || busy}
              onClick={() => handleQuickLogin(account.email, account.password, account.role)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border border-amber-200 dark:border-amber-700/60 bg-white dark:bg-white/5 text-amber-900 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/30 disabled:opacity-50 transition-colors"
            >
              {busy ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-3 border-2 border-amber-400/40 border-t-amber-700 rounded-full animate-spin" />
                  {account.label}
                </span>
              ) : (
                account.label
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
