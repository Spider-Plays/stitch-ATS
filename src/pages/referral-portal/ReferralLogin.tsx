import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { AlertCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { authApi } from '../../services/http/auth'
import { ApiError } from '../../lib/apiClient'
import { APP_NAME } from '../../config/branding'
import { StitchLogo } from '../../components/branding/StitchLogo'
import { DevQuickLogin } from '../../dev/DevQuickLogin'
import { isReferralPortalRole } from '../../lib/referralPortalRoles'

const ReferralLogin = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, logout, user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit } = useForm<{ email: string; password: string }>()

  useEffect(() => {
    if (user && isReferralPortalRole(user.role)) {
      navigate('/referral-portal/dashboard', { replace: true })
    }
  }, [user, navigate])

  const onSubmit = async (data: { email: string; password: string }) => {
    setLoading(true)
    setAuthError(null)
    try {
      const session = await login(data.email, data.password)
      if (!isReferralPortalRole(session.user.role)) {
        await logout()
        setAuthError('This sign-in is for employees using the referral portal.')
        return
      }
      navigate('/referral-portal/dashboard', { replace: true })
    } catch {
      setAuthError('Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex app-shell-bg">
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden bg-gradient-to-br from-violet-900 via-indigo-900 to-slate-900 text-white p-12 flex-col justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_30%,_rgba(167,139,250,0.25),_transparent_55%)]" />
        <div className="relative z-10 space-y-8">
          <StitchLogo tone="primary" size="lg" onDark />
          <p className="text-violet-300/80 text-sm font-bold uppercase tracking-widest">
            Employee referral
          </p>
          <h1 className="text-4xl font-black tracking-tight leading-tight max-w-md">
            Refer great people. Earn rewards when they join.
          </h1>
          <p className="mt-4 text-violet-100/70 max-w-md text-lg font-medium">
            Browse open roles, submit referrals with resume parsing, and track every candidate you
            introduce through hiring.
          </p>
        </div>
        <ul className="relative z-10 space-y-3 text-sm font-medium text-violet-100/80">
          <li className="flex items-center gap-2">
            <span className="material-symbols-outlined text-violet-300">check_circle</span>
            Open roles with referral bonuses
          </li>
          <li className="flex items-center gap-2">
            <span className="material-symbols-outlined text-violet-300">check_circle</span>
            Resume upload &amp; smart profile fill
          </li>
          <li className="flex items-center gap-2">
            <span className="material-symbols-outlined text-violet-300">check_circle</span>
            Live pipeline &amp; hire tracking
          </li>
        </ul>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex justify-center">
            <StitchLogo tone="primary" size="xl" />
          </div>
          <div>
            <Link to="/login" className="text-xs font-bold text-violet-700 hover:underline">
              Team login (recruiters)
            </Link>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-4">
              Sign in to {APP_NAME} Referrals
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Use the account HR created for you, or your company email if you have portal access.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {authError && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 text-red-800 text-sm font-medium border border-red-100">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                {authError}
              </div>
            )}
            <div>
              <label className="text-xs font-bold uppercase text-slate-500">Email</label>
              <input
                type="email"
                autoComplete="email"
                className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 font-medium"
                {...register('email', { required: true })}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-slate-500">Password</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 font-medium pr-12"
                  {...register('password', { required: true })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold hover:opacity-95 disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {import.meta.env.DEV && (
            <DevQuickLogin
              filterRole="EMPLOYEE"
              onError={(msg) => setAuthError(msg || null)}
              onLoggedIn={() => navigate('/referral-portal/dashboard', { replace: true })}
            />
          )}

          <p className="text-xs text-center text-slate-400">
            Recruiters and HR can also open referrals from the main app sidebar.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ReferralLogin
