import React from 'react'
import { Link } from 'react-router-dom'
import { APP_NAME } from '../../config/branding'

const Signup = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-8">
            <div className="w-full max-w-lg space-y-6 text-center">
                <h2 className="text-3xl font-black text-primary dark:text-white">Create an account</h2>
                <p className="text-primary/60 dark:text-white/60 font-medium">
                    Self-service registration is not enabled. Contact your {APP_NAME} administrator for access.
                </p>
                <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary dark:bg-white text-white dark:text-primary rounded-xl font-bold text-sm"
                >
                    Back to sign in
                    <span className="material-symbols-outlined !text-lg">arrow_forward</span>
                </Link>
            </div>
        </div>
    )
}

export default Signup
