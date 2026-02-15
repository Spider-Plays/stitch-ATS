import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { api } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import { AlertCircle, Loader2 } from 'lucide-react'

const Signup = () => {
    const navigate = useNavigate()
    const { loginWithGoogle, user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [authError, setAuthError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)

    const { register, handleSubmit, watch, formState: { errors } } = useForm()
    const password = watch('password')

    React.useEffect(() => {
        if (user) {
            navigate('/portal/dashboard')
        }
    }, [user, navigate])

    const onSubmit = async (data: any) => {
        setLoading(true)
        setAuthError(null)

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password)
            const firebaseUser = userCredential.user

            await updateProfile(firebaseUser, {
                displayName: data.fullName
            })

            try {
                await api.users.create({
                    uid: firebaseUser.uid,
                    name: data.fullName,
                    email: data.email,
                    role: 'CANDIDATE',
                    permissions: [],
                    themePreference: 'system',
                    createdAt: new Date().toISOString(),
                    status: 'ACTIVE',
                    authProvider: 'password'
                })
            } catch (dbError) {
                console.error("Firestore creation warning:", dbError)
            }

            navigate('/portal/dashboard')
        } catch (err: any) {
            console.error(err)
            if (err.code === 'auth/email-already-in-use') {
                setAuthError('Email is already registered. Please login.')
            } else if (err.code === 'auth/weak-password') {
                setAuthError('Password should be at least 6 characters.')
            } else {
                setAuthError(err.message || 'Failed to create account. Please try again.')
            }
            setLoading(false)
        }
    }

    const handleGoogleSignup = async () => {
        setLoading(true)
        setAuthError(null)
        try {
            await loginWithGoogle()
        } catch (err: any) {
            console.error(err)
            setAuthError('Google sign-in failed. Please try again.')
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen bg-background-light dark:bg-background-dark text-primary dark:text-white antialiased transition-colors duration-200">
            {/* Left Side: Signup Form */}
            <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-24 xl:px-32 bg-white dark:bg-background-dark">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-2">
                            <div className="bg-primary text-white p-1.5 rounded-lg">
                                <span className="material-symbols-outlined">lan</span>
                            </div>
                            <span className="text-xl font-bold tracking-tight text-primary dark:text-white">TalentFlow AI</span>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-3xl font-extrabold tracking-tight text-primary dark:text-white">Create Account</h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Join Stitch to manage your career and applications.
                        </p>
                    </div>

                    <div className="mt-10">
                        {authError && (
                            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
                                <AlertCircle size={18} className="shrink-0" />
                                {authError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-primary dark:text-gray-300" htmlFor="fullName">Full Name</label>
                                <div className="mt-1 relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">person</span>
                                    <input
                                        id="fullName"
                                        {...register('fullName', { required: 'Full name is required' })}
                                        className="block w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 pl-10 pr-3 py-3 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:text-white sm:text-sm transition-all"
                                        placeholder="John Doe"
                                    />
                                </div>
                                {errors.fullName && <p className="mt-1 text-xs text-red-500 font-bold">{String(errors.fullName.message)}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-primary dark:text-gray-300" htmlFor="email">Email Address</label>
                                <div className="mt-1 relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">mail</span>
                                    <input
                                        id="email"
                                        type="email"
                                        {...register('email', {
                                            required: 'Email is required',
                                            pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                                        })}
                                        className="block w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 pl-10 pr-3 py-3 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:text-white sm:text-sm transition-all"
                                        placeholder="name@company.com"
                                    />
                                </div>
                                {errors.email && <p className="mt-1 text-xs text-red-500 font-bold">{String(errors.email.message)}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-primary dark:text-gray-300" htmlFor="password">Password</label>
                                <div className="mt-1 relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">lock</span>
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 chars' } })}
                                        className="block w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 pl-10 pr-12 py-3 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:text-white sm:text-sm transition-all"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        <span className="material-symbols-outlined text-gray-400 text-lg hover:text-primary transition-colors">
                                            {showPassword ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </button>
                                </div>
                                {errors.password && <p className="mt-1 text-xs text-red-500 font-bold">{String(errors.password.message)}</p>}
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex w-full justify-center rounded-xl bg-primary dark:bg-white dark:text-primary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-opacity-90 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'Create Account'}
                                </button>
                            </div>
                        </form>

                        <div className="mt-6">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="w-full border-t border-gray-200 dark:border-white/10"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="bg-white dark:bg-background-dark px-2 text-gray-500">Or join with</span>
                                </div>
                            </div>
                            <div className="mt-6">
                                <button
                                    type="button"
                                    onClick={handleGoogleSignup}
                                    disabled={loading}
                                    className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-sm font-bold text-primary dark:text-white shadow-sm hover:bg-gray-50 dark:hover:bg-white/10 active:scale-[0.98] transition-all"
                                >
                                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                                        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.909 3.292-2.09 4.413-1.212 1.144-2.853 2.047-5.75 2.047-4.524 0-8.23-3.664-8.23-8.21s3.706-8.21 8.23-8.21c2.454 0 4.27.962 5.597 2.222l2.316-2.316C18.423 2.21 15.86 1 12.48 1 6.14 1 1 6.14 1 12.48s5.14 11.48 11.48 11.48c3.424 0 6.01-1.123 8.01-3.218 2.065-2.065 2.715-4.945 2.715-7.303 0-.693-.053-1.36-.16-1.956H12.48z" fill="currentColor"></path>
                                    </svg>
                                    <span>Sign up with Google</span>
                                </button>
                            </div>
                        </div>

                        <p className="mt-8 text-center text-sm text-gray-500">
                            Already have an account?
                            <Link to="/login" className="font-bold leading-6 text-primary dark:text-blue-400 hover:underline ml-1">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side: Hero Section (Shared with Login) */}
            <div className="relative hidden w-0 flex-1 lg:block overflow-hidden">
                <div className="absolute inset-0 bg-primary z-0">
                    <div
                        className="absolute inset-0 opacity-20"
                        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}
                    ></div>
                    <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500 rounded-full blur-[120px] opacity-20"></div>
                    <div className="absolute top-1/4 -left-24 w-64 h-64 bg-emerald-500 rounded-full blur-[100px] opacity-10"></div>
                </div>
                <div className="relative z-10 flex h-full flex-col items-center justify-center px-12 text-center">
                    <div className="max-w-xl">
                        <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white ring-1 ring-inset ring-white/20 mb-6 animate-pulse">
                            New Feature: AI Resume Scoring
                        </span>
                        <h1 className="text-6xl font-black tracking-tight text-white mb-6 leading-tight">
                            The Future of Recruitment, <span className="text-blue-300">Powered by AI.</span>
                        </h1>
                        <p className="text-lg text-gray-300 mb-10 leading-relaxed font-medium">
                            Streamline your hiring with AI-driven insights. Experience the ATS that transforms complex candidate data into your next great hire.
                        </p>
                        <div className="grid grid-cols-3 gap-8 pt-10 border-t border-white/10">
                            <div>
                                <p className="text-3xl font-black text-white">65%</p>
                                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-bold">Faster Screening</p>
                            </div>
                            <div>
                                <p className="text-3xl font-black text-white">10k+</p>
                                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-bold">Hires Made</p>
                            </div>
                            <div>
                                <p className="text-3xl font-black text-white">4.9/5</p>
                                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-bold">User Rating</p>
                            </div>
                        </div>
                    </div>
                    {/* Decorative Card Component */}
                    <div className="mt-16 w-full max-w-md animate-in slide-in-from-bottom-8 duration-700">
                        <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 text-left shadow-2xl">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="size-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <span className="material-symbols-outlined text-white">auto_awesome</span>
                                </div>
                                <div>
                                    <h4 className="text-base font-bold text-white">AI Candidate Match</h4>
                                    <p className="text-xs text-gray-400 font-medium">Analyzing engineering roles...</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-400 w-4/5 rounded-full shadow-[0_0_12px_rgba(96,165,250,0.5)]"></div>
                                </div>
                                <div className="flex justify-between text-[10px] text-gray-400 uppercase tracking-widest font-black">
                                    <span>Skill Alignment</span>
                                    <span className="text-blue-300">88% Match</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Signup
