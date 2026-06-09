import React, { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { AlertCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { authApi } from '@/services/http/auth'
import { ApiError } from '@/lib/apiClient'
import { PageKey } from '@/permissions'
import { postAuthPath } from '@/lib/loginRedirect'
import type { User } from '@/types'
import { DevQuickLogin } from '@/dev/DevQuickLogin'
import { LoginHero, LoginHeroMobile } from '@/components/auth/LoginHero'
import './login.css'
const Login = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { login, logout, user, allowedPages } = useAuth()
    const [loading, setLoading] = useState(false)
    const [authError, setAuthError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [mode, setMode] = useState<'login' | 'forgot' | 'reset'>('login')
    const [forgotEmail, setForgotEmail] = useState('')
    const [resetToken, setResetToken] = useState('')
    const [resetPassword, setResetPassword] = useState('')
    const [infoMessage, setInfoMessage] = useState<string | null>(null)

    const from = location.state?.from?.pathname || '/'
    const { register, handleSubmit } = useForm<{ email: string; password: string }>()

    const redirectAfterAuth = (session: { user: User; allowedPages?: PageKey[] }) => {
        navigate(postAuthPath(session.user, session.allowedPages ?? [], from), { replace: true })
    }

    const onSubmit = async (data: { email: string; password: string }) => {
        setLoading(true)
        setAuthError(null)

        try {
            const session = await login(data.email, data.password)
            if (session.user.role === 'CANDIDATE') {
                await logout()
                setAuthError('Use the candidate portal to sign in.')
                return
            }
            if (session.user.role === 'EMPLOYEE') {
                await logout()
                setAuthError('Use the employee referral portal to sign in.')
                return
            }
            redirectAfterAuth(session)
        } catch (err: unknown) {
            console.error(err)
            const code = err instanceof Error ? err.message : ''
            if (code === 'ACCOUNT_DISABLED') {
                setAuthError('This account has been disabled.')
            } else if (code === 'SERVER_UNAVAILABLE') {
                setAuthError('Cannot reach the API server. Run npm run dev from the project root (starts client + server on port 4000).')
            } else {
                setAuthError('Invalid email or password.')
            }
        } finally {
            setLoading(false)
        }
    }

    React.useEffect(() => {
        const params = new URLSearchParams(location.search)
        const token = params.get('reset')
        if (token) {
            setResetToken(token)
            setMode('reset')
        }
    }, [location.search])

    React.useEffect(() => {
        if (!user?.role) return
        redirectAfterAuth({ user, allowedPages })
    }, [user, allowedPages])

    const pageTitle =
        mode === 'forgot' ? 'Reset password' : mode === 'reset' ? 'Set new password' : 'Welcome back'
    const pageDesc =
        mode === 'forgot'
            ? 'Enter your email and we will send a reset link.'
            : mode === 'reset'
              ? 'Choose a new password for your account.'
              : 'Sign in to your hiring workspace.'

    return (
        <div className="min-h-screen flex login-page-bg">
            <LoginHero />

            <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-10 lg:p-12">
                <div className="w-full max-w-[26rem] space-y-6 animate-scale-in">
                    <LoginHeroMobile />

                    <div className="login-panel-accent space-y-8">
                    <div className="text-center lg:text-left space-y-3">
                        {mode === 'login' && (
                            <span className="badge-eyebrow mx-auto lg:mx-0 w-fit">Team sign in</span>
                        )}
                        <h2 className="text-page-title">{pageTitle}</h2>
                        <p className="text-page-desc mx-auto lg:mx-0">{pageDesc}</p>
                    </div>

                    <div className="space-y-6">
                        {(mode === 'forgot' || mode === 'reset') && (
                            <button
                                type="button"
                                onClick={() => {
                                    setMode('login')
                                    setAuthError(null)
                                    setInfoMessage(null)
                                }}
                                className="text-sm font-bold text-primary/70 dark:text-white/70 hover:text-primary dark:hover:text-white"
                            >
                                Back to sign in
                            </button>
                        )}
                        {authError && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
                                <AlertCircle size={18} className="shrink-0" />
                                {authError}
                            </div>
                        )}

                        {infoMessage && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm">
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
                                className="space-y-6"
                            >
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-primary/60 uppercase">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={forgotEmail}
                                        onChange={(e) => setForgotEmail(e.target.value)}
                                        className="app-input w-full"
                                        placeholder="you@company.com"
                                    />
                                </div>
                                <button type="submit" disabled={loading} className="w-full py-4 btn-primary rounded-xl text-sm">
                                    Send reset link
                                </button>
                                <button type="button" onClick={() => setMode('login')} className="w-full text-sm font-bold text-primary/60">
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
                                className="space-y-6"
                            >
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-primary/60 uppercase">New password</label>
                                    <input
                                        type="password"
                                        required
                                        minLength={8}
                                        value={resetPassword}
                                        onChange={(e) => setResetPassword(e.target.value)}
                                        className="app-input w-full"
                                    />
                                </div>
                                <button type="submit" disabled={loading} className="w-full py-4 btn-primary rounded-xl text-sm">
                                    Set new password
                                </button>
                                <button type="button" onClick={() => setMode('login')} className="w-full text-sm font-bold text-primary/60">
                                    Back to sign in
                                </button>
                            </form>
                        )}

                        {mode === 'login' && (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider">Email Address</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">mail</span>
                                    <input
                                        type="email"
                                        className="app-input app-input-leading-icon w-full !py-3.5 focus:border-primary dark:focus:border-ring focus:ring-0"
                                        placeholder="you@company.com"
                                        {...register('email')}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider">
                                    Password
                                </label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">lock</span>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="app-input app-input-leading-icon w-full !pr-12 focus:!pr-12 !py-3.5 focus:border-primary dark:focus:border-ring focus:ring-0"
                                        placeholder="••••••••"
                                        {...register('password')}
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        <span className="material-symbols-outlined text-muted-foreground hover:text-primary dark:hover:text-white">
                                            {showPassword ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </button>
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMode('forgot')
                                            setAuthError(null)
                                            setInfoMessage(null)
                                        }}
                                        className="text-xs font-bold text-primary hover:underline"
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 btn-primary rounded-xl text-sm flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                ) : (
                                    <>
                                        Sign in
                                        <span className="material-symbols-outlined !text-lg">arrow_forward</span>
                                    </>
                                )}
                            </button>
                        </form>
                        )}

                        {mode === 'login' && import.meta.env.DEV && (
                            <DevQuickLogin
                                onError={(msg) => {
                                    setAuthError(msg || null)
                                    setInfoMessage(null)
                                }}
                                onLoggedIn={(session) => redirectAfterAuth(session)}
                            />
                        )}

                        {mode === 'login' && (
                            <div className="pt-6 border-t border-primary/10 dark:border-white/10 text-center space-y-3">
                                <p className="text-sm font-medium text-primary/60 dark:text-white/60">
                                    Other portals
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                    <Link
                                        to="/portal/login"
                                        className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                                    >
                                        Candidate portal
                                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                    </Link>
                                    <Link
                                        to="/referral-portal/login"
                                        className="inline-flex items-center gap-2 text-sm font-bold text-violet-700 dark:text-violet-400 hover:underline"
                                    >
                                        Employee referrals
                                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                    </Link>
                                </div>
                            </div>
                        )}

                    </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login
