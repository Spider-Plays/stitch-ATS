import React, { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { useAuth } from '../../hooks/useAuth'
import { Loader2, AlertCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'

const Login = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { loginWithGoogle, user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [authError, setAuthError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)

    const from = location.state?.from?.pathname || '/'
    const { register, handleSubmit, formState: { errors } } = useForm()

    const handleGoogleLogin = async () => {
        setLoading(true)
        setAuthError(null)
        try {
            await loginWithGoogle()
        } catch (err: any) {
            console.error(err)
            setAuthError('Failed to sign in with Google.')
            setLoading(false)
        }
    }

    const onSubmit = async (data: any) => {
        setLoading(true)
        setAuthError(null)

        try {
            await signInWithEmailAndPassword(auth, data.email, data.password)
        } catch (err: any) {
            console.error(err)
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                setAuthError('Invalid email or password.')
            } else if (err.code === 'auth/too-many-requests') {
                setAuthError('Too many failed attempts. Please try again later.')
            } else {
                setAuthError('Failed to sign in. Please try again.')
            }
            setLoading(false)
        }
    }

    React.useEffect(() => {
        if (user) {
            const role = user.role || 'CANDIDATE';
            if (role === 'ADMIN') {
                navigate('/admin/users')
            } else if (role === 'CANDIDATE') {
                navigate('/portal/dashboard')
            } else if (['RECRUITER', 'TEAM_LEAD', 'HR_MANAGER'].includes(role)) {
                navigate('/dashboard')
            } else if (role === 'INTERVIEWER') {
                navigate('/interviews')
            } else if (role === 'HIRING_MANAGER') {
                navigate('/requirements')
            } else {
                navigate(from === '/' ? '/portal/dashboard' : from, { replace: true })
            }
        }
    }, [user, navigate, from])

    return (
        <div className="min-h-screen flex bg-background-light dark:bg-background-dark">
            {/* Left Side - Hero/Brand */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary text-white p-12 flex-col justify-between">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/80"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="size-10 bg-white rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary !text-2xl">grid_view</span>
                        </div>
                        <span className="text-2xl font-black tracking-tight">Stitch</span>
                    </div>
                </div>

                <div className="relative z-10 max-w-lg">
                    <h1 className="text-5xl font-black mb-6 tracking-tight">Recruit top talent at warp speed.</h1>
                    <p className="text-white/80 text-lg font-medium leading-relaxed">
                        The all-in-one platform for modern recruiting teams. Streamline your entire hiring pipeline from sourcing to offer letter.
                    </p>
                </div>

                <div className="relative z-10 flex gap-4 text-sm font-medium text-white/60">
                    <span>© 2024 Stitch App</span>
                    <span>Privacy Policy</span>
                    <span>Terms of Service</span>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex flex-col justify-center items-center p-8 bg-white dark:bg-background-dark">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <div className="lg:hidden flex justify-center mb-8">
                            <div className="size-12 bg-primary rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-white !text-2xl">grid_view</span>
                            </div>
                        </div>
                        <h2 className="text-3xl font-black text-primary dark:text-white tracking-tight">Welcome back</h2>
                        <p className="mt-2 text-primary/60 dark:text-white/60 font-medium">Please enter your details to sign in.</p>
                    </div>

                    <div className="space-y-6">
                        <div className="p-4 bg-primary/5 dark:bg-white/5 rounded-xl border border-primary/10 dark:border-white/10 text-sm text-primary/60 dark:text-white/60">
                            <strong>Demo Credentials:</strong><br />
                            Use <code>admin@stitch.com</code> / <code>password</code> to login as Admin.
                        </div>

                        {authError && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
                                <AlertCircle size={18} className="shrink-0" />
                                {authError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider">Email Address</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 dark:text-white/40">mail</span>
                                    <input
                                        type="email"
                                        className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-medium text-primary dark:text-white placeholder:text-primary/30"
                                        placeholder="Enter your email"
                                        {...register("email")}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider">Password</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 dark:text-white/40">lock</span>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-medium text-primary dark:text-white placeholder:text-primary/30"
                                        placeholder="••••••••"
                                        {...register("password")}
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

                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="rounded border-primary/20 text-primary focus:ring-primary/20" />
                                    <span className="text-sm font-bold text-primary/60 dark:text-white/60">Remember me</span>
                                </label>
                                <a href="#" className="text-sm font-bold text-primary dark:text-white hover:underline">Forgot password?</a>
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

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t border-primary/10 dark:border-white/10"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-white dark:bg-background-dark px-2 text-primary/40 dark:text-white/40 font-bold uppercase tracking-wider text-[10px]">Or continue with</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full py-3.5 bg-white dark:bg-white/5 border border-primary/10 dark:border-white/10 text-primary dark:text-white rounded-xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.909 3.292-2.09 4.413-1.212 1.144-2.853 2.047-5.75 2.047-4.524 0-8.23-3.664-8.23-8.21s3.706-8.21 8.23-8.21c2.454 0 4.27.962 5.597 2.222l2.316-2.316C18.423 2.21 15.86 1 12.48 1 6.14 1 1 6.14 1 12.48s5.14 11.48 11.48 11.48c3.424 0 6.01-1.123 8.01-3.218 2.065-2.065 2.715-4.945 2.715-7.303 0-.693-.053-1.36-.16-1.956H12.48z" fill="currentColor"></path>
                            </svg>
                            Sign in with Google
                        </button>
                    </div>

                    <p className="text-center text-sm font-medium text-primary/60 dark:text-white/60">
                        Don't have an account? <Link to="/signup" className="text-primary dark:text-white font-bold hover:underline">Create an account</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Login
