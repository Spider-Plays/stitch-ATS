import React, { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { APP_NAME } from '../../config/branding'
import { AlertCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { authApi } from '../../services/http/auth'
import { ApiError } from '../../lib/apiClient'
import { firstAllowedPath, PageKey } from '../../lib/pageAccess'

const Login = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { login, user, allowedPages } = useAuth()
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

    const redirectByRole = (role: string, allowedPages: PageKey[] = []) => {
        if (role === 'CANDIDATE') navigate('/portal/dashboard')
        else if (role === 'VENDOR') navigate('/vendor-portal/dashboard')
        else if (allowedPages.length > 0) navigate(firstAllowedPath(allowedPages), { replace: true })
        else if (role === 'ADMIN') navigate('/admin/users')
        else navigate(from === '/' ? '/dashboard' : from, { replace: true })
    }

    const onSubmit = async (data: { email: string; password: string }) => {
        setLoading(true)
        setAuthError(null)

        try {
            const session = await login(data.email, data.password)
            redirectByRole(session.user.role, session.allowedPages)
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
        if (user) redirectByRole(user.role || 'CANDIDATE', allowedPages)
    }, [user, allowedPages])

    return (
        <div className="min-h-screen flex bg-background-light dark:bg-background-dark">
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary text-white p-12 flex-col justify-between">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/80"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="size-10 bg-white rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary !text-2xl">grid_view</span>
                        </div>
                        <span className="text-2xl font-black tracking-tight">{APP_NAME}</span>
                    </div>
                </div>

                <div className="relative z-10 max-w-lg">
                    <h1 className="text-5xl font-black mb-6 tracking-tight">Recruit top talent at warp speed.</h1>
                    <p className="text-white/80 text-lg font-medium leading-relaxed">
                        The all-in-one platform for modern recruiting teams. Streamline your entire hiring pipeline from sourcing to offer letter.
                    </p>
                </div>

                <div className="relative z-10 flex gap-4 text-sm font-medium text-white/60">
                    <span>© 2024 {APP_NAME}</span>
                    <span>Privacy Policy</span>
                    <span>Terms of Service</span>
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center p-8 bg-white dark:bg-background-dark">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                            <div className="size-12 bg-primary rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-white !text-2xl">grid_view</span>
                            </div>
                            <span className="text-2xl font-black text-primary dark:text-white tracking-tight">{APP_NAME}</span>
                        </div>
                        <h2 className="text-3xl font-black text-primary dark:text-white tracking-tight">Welcome back</h2>
                        <p className="mt-2 text-primary/60 dark:text-white/60 font-medium">Please enter your details to sign in.</p>
                    </div>

                    <div className="space-y-6">
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
                                        className="w-full px-4 py-3.5 rounded-xl border border-primary/10 font-medium"
                                        placeholder="you@company.com"
                                    />
                                </div>
                                <button type="submit" disabled={loading} className="w-full py-4 bg-primary text-white rounded-xl font-bold text-sm">
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
                                        className="w-full px-4 py-3.5 rounded-xl border border-primary/10 font-medium"
                                    />
                                </div>
                                <button type="submit" disabled={loading} className="w-full py-4 bg-primary text-white rounded-xl font-bold text-sm">
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
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 dark:text-white/40">mail</span>
                                    <input
                                        type="email"
                                        className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-medium text-primary dark:text-white placeholder:text-primary/30"
                                        placeholder="you@company.com"
                                        {...register('email')}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider">Password</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 dark:text-white/40">lock</span>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-medium text-primary dark:text-white placeholder:text-primary/30"
                                        placeholder="••••••••"
                                        {...register('password')}
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        <span className="material-symbols-outlined text-primary/40 dark:text-white/40 hover:text-primary dark:hover:text-white">
                                            {showPassword ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-primary dark:bg-white text-white dark:text-primary rounded-xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-primary/20 dark:shadow-none flex items-center justify-center gap-2"
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

                        {mode === 'login' && (
                            <button
                                type="button"
                                onClick={() => { setMode('forgot'); setAuthError(null); setInfoMessage(null) }}
                                className="w-full text-sm font-bold text-primary/60 hover:text-primary"
                            >
                                Forgot password?
                            </button>
                        )}

                    </div>

                </div>
            </div>
        </div>
    )
}

export default Login
