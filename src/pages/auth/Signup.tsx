import React from 'react'
import { Link } from 'react-router-dom'
import { APP_NAME } from '../../config/branding'
import { StitchLogo } from '../../components/branding/StitchLogo'

const Signup = () => {
    return (
        <div className="min-h-screen flex items-center justify-center app-shell-bg p-8">
            <div className="login-panel w-full max-w-lg space-y-8 text-center animate-scale-in">
                <div className="flex justify-center mb-2">
                    <StitchLogo tone="primary" size="xl" className="justify-center" />
                </div>
                <h2 className="text-page-title">Create an account</h2>

                <div className="app-card p-6 text-left space-y-3 border-emerald-500/20 bg-emerald-500/5">
                    <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">I&apos;m a candidate</p>
                    <p className="text-sm text-muted-foreground">
                        Register to browse open roles, complete your profile, and track your application.
                    </p>
                    <Link
                        to="/portal/signup"
                        className="btn-filled inline-flex items-center gap-2 text-sm"
                    >
                        Create candidate account
                        <span className="material-symbols-outlined !text-lg">arrow_forward</span>
                    </Link>
                </div>

                <div className="app-card p-6 text-left space-y-3">
                    <p className="text-sm font-bold text-foreground">I&apos;m on the hiring team</p>
                    <p className="text-muted-foreground text-sm">
                        Staff accounts are created by your {APP_NAME} administrator.
                    </p>
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline"
                    >
                        Team sign in
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default Signup
