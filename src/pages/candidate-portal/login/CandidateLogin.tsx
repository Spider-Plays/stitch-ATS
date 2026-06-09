import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { authApi } from '@/services/http/auth'
import { api } from '@/services/api'
import { ApiError } from '@/lib/apiClient'
import { portalHomePath } from '@/lib/portalWorkflow'
import { postAuthPath } from '@/lib/loginRedirect'
import { CandidateAuthShell } from '@/components/portal/CandidateAuthShell'
import { DevQuickLogin } from '@/dev/DevQuickLogin'
import './login.css'

const CandidateLogin = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, logout, user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [mode, setMode] = useState<'login' | 'forgot' | 'reset'>('login')
  const [forgotEmail, setForgotEmail] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [resetPassword, setResetPassword] = useState('')
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  const { register, handleSubmit } = useForm<{ email: string; password: string }>()

  const redirectAfterAuth = async () => {
    try {
      const me = await api.portal.getMe()
      navigate(portalHomePath(me), { replace: true })
    } catch {
      navigate('/portal/onboarding', { replace: true })
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const token = params.get('reset')
    if (token) {
      setResetToken(token)
      setMode('reset')
    }
  }, [location.search])

  useEffect(() => {
    if (user?.role !== 'CANDIDATE') return
    if (user.mustChangePassword) {
      navigate('/set-password', { replace: true })
      return
    }
    void redirectAfterAuth()
  }, [user, navigate])

  const onSubmit = async (data: { email: string; password: string }) => {
    setLoading(true)
    setAuthError(null)
    try {
      const session = await login(data.email, data.password)
      if (session.user.role !== 'CANDIDATE') {
        await logout()
        setAuthError('This sign-in page is for candidates only. Use the team login instead.')
        return
      }
      if (session.user.mustChangePassword) {
        navigate(postAuthPath(session.user), { replace: true })
        return
      }
      await redirectAfterAuth()
    } catch (err: unknown) {
      const code = err instanceof Error ? err.message : ''
      if (code === 'ACCOUNT_DISABLED') {
        setAuthError('This account has been disabled.')
      } else if (code === 'SERVER_UNAVAILABLE') {
        setAuthError('Cannot reach the server. Start the API and try again.')
      } else {
        setAuthError('Invalid email or password.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <CandidateAuthShell
      title={
        mode === 'forgot'
          ? 'Reset password'
          : mode === 'reset'
            ? 'Set new password'
            : 'Welcome back'
      }
      subtitle={
        mode === 'forgot'
          ? 'We will email you a reset link if your account exists.'
          : mode === 'reset'
            ? 'Choose a new password for your candidate account.'
            : 'Sign in to track applications, interviews, and offers.'
      }
      footer={
        mode === 'login' ? (
          <p className="text-center text-sm text-slate-600">
            New here?{' '}
            <Link to="/portal/signup" className="font-bold text-[#0f3d38] hover:underline">
              Create candidate account
            </Link>
          </p>
        ) : undefined
      }
    >
      {authError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle size={18} className="shrink-0" />
          {authError}
        </div>
      )}
      {infoMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm">
          {infoMessage}
        </div>
      )}

      {mode === 'forgot' && (
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            setLoading(true)
            setAuthError(null)
            try {
              const res = await authApi.forgotPassword(forgotEmail)
              setInfoMessage(res.message)
              setMode('login')
            } catch (err) {
              setAuthError(err instanceof ApiError ? err.message : 'Request failed')
            } finally {
              setLoading(false)
            }
          }}
          className="space-y-4"
        >
          <input
            type="email"
            required
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            className="w-full px-4 py-3.5 rounded-xl border border-slate-200 font-medium"
            placeholder="you@email.com"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#0f3d38] text-white rounded-xl font-bold text-sm"
          >
            Send reset link
          </button>
          <button
            type="button"
            onClick={() => setMode('login')}
            className="w-full text-sm font-bold text-slate-500"
          >
            Back to sign in
          </button>
        </form>
      )}

      {mode === 'reset' && (
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            setLoading(true)
            setAuthError(null)
            try {
              const res = await authApi.resetPassword(resetToken, resetPassword)
              setInfoMessage(res.message)
              setMode('login')
            } catch (err) {
              setAuthError(err instanceof ApiError ? err.message : 'Reset failed')
            } finally {
              setLoading(false)
            }
          }}
          className="space-y-4"
        >
          <input
            type="password"
            required
            minLength={8}
            value={resetPassword}
            onChange={(e) => setResetPassword(e.target.value)}
            className="w-full px-4 py-3.5 rounded-xl border border-slate-200 font-medium"
            placeholder="New password"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#0f3d38] text-white rounded-xl font-bold text-sm"
          >
            Update password
          </button>
        </form>
      )}

      {mode === 'login' && (
        <>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
              <input
                type="email"
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-[#0f3d38] focus:ring-0 font-medium"
                placeholder="you@email.com"
                {...register('email')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-[#0f3d38] focus:ring-0 font-medium pr-12"
                  placeholder="••••••••"
                  {...register('password')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#0f3d38] text-white rounded-xl font-bold text-sm hover:bg-[#0c322e] flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign in
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </>
              )}
            </button>
          </form>
          <button
            type="button"
            onClick={() => {
              setMode('forgot')
              setAuthError(null)
              setInfoMessage(null)
            }}
            className="w-full text-sm font-bold text-slate-500 hover:text-[#0f3d38]"
          >
            Forgot password?
          </button>
          {import.meta.env.DEV && (
            <DevQuickLogin
              filterRole="CANDIDATE"
              onSuccess={() => void redirectAfterAuth()}
              onError={(msg) => {
                setAuthError(msg || null)
                setInfoMessage(null)
              }}
            />
          )}
        </>
      )}
    </CandidateAuthShell>
  )
}

export default CandidateLogin
