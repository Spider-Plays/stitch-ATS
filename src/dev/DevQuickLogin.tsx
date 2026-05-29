import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { DEV_LOGIN_ACCOUNTS } from './devLoginAccounts'
import { firstAllowedPath } from '../lib/pageAccess'
import { ApiError } from '../lib/apiClient'
import clsx from 'clsx'

type DevQuickLoginProps = {
  onError: (message: string) => void
  onSuccess?: () => void
}

export function DevQuickLogin({ onError, onSuccess }: DevQuickLoginProps) {
  const { login } = useAuth()
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null)

  const handleQuickLogin = async (email: string, password: string, role: string) => {
    setLoadingEmail(email)
    onError('')
    try {
      const session = await login(email, password)
      onSuccess?.()
      if (session.user.role === 'CANDIDATE') {
        window.location.href = '/portal/profile'
      } else if (session.user.role === 'VENDOR') {
        window.location.href = '/vendor-portal/dashboard'
      } else if (session.allowedPages.length > 0) {
        window.location.href = firstAllowedPath(session.allowedPages)
      } else if (role === 'ADMIN') {
        window.location.href = '/admin'
      } else {
        window.location.href = '/dashboard'
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 503 || err.message.toLowerCase().includes('database')) {
          onError(
            'Database unavailable. Wake your Neon project at console.neon.tech, then run: npm run db:seed --prefix server'
          )
        } else if (err.status === 401) {
          onError(
            'Invalid credentials — from project root run: npm run db:seed --prefix server'
          )
        } else if (err.status === 0 || err.message.includes('fetch')) {
          onError(
            'Cannot reach API. Run npm run dev from the project root (client + server on port 4000).'
          )
        } else {
          onError(err.message)
        }
      } else if (err instanceof Error && err.message === 'SERVER_UNAVAILABLE') {
        onError(
          'Cannot reach API. Run npm run dev from the project root (client + server on port 4000).'
        )
      } else {
        onError(
          'Login failed — run npm run db:seed --prefix server (retry if Neon was sleeping).'
        )
      }
    } finally {
      setLoadingEmail(null)
    }
  }

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/80 dark:bg-amber-950/30 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 !text-lg shrink-0">
          developer_mode
        </span>
        <div>
          <p className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider">
            Dev quick login
          </p>
          <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-0.5">
            Password for all: <span className="font-mono font-bold">DevTest123!</span> — seed with{' '}
            <span className="font-mono">npm run db:seed</span>
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {DEV_LOGIN_ACCOUNTS.map((account) => (
          <button
            key={account.email}
            type="button"
            disabled={loadingEmail !== null}
            onClick={() =>
              handleQuickLogin(account.email, account.password, account.role)
            }
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-bold border transition-all',
              'border-amber-300/60 dark:border-amber-700/60',
              'bg-white/80 dark:bg-white/5 text-amber-950 dark:text-amber-100',
              'hover:bg-amber-100 dark:hover:bg-amber-900/40',
              'disabled:opacity-50',
              loadingEmail === account.email && 'animate-pulse'
            )}
          >
            {account.label}
          </button>
        ))}
      </div>
    </div>
  )
}
