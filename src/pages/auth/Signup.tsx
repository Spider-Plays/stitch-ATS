import React from 'react'
import { Link } from 'react-router-dom'
import { LOCAL_USERS } from '../../config/localUsers'

/** Sign-up uses predefined accounts only — see localUsers.ts */
const Signup = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-8">
            <div className="w-full max-w-lg space-y-6 text-center">
                <h2 className="text-3xl font-black text-primary dark:text-white">Predefined accounts only</h2>
                <p className="text-primary/60 dark:text-white/60 font-medium">
                    Registration is disabled. Use one of the demo accounts below (password: <strong>password</strong>).
                </p>
                <ul className="text-left p-4 bg-primary/5 dark:bg-white/5 rounded-xl border border-primary/10 dark:border-white/10 space-y-2 font-mono text-sm">
                    {LOCAL_USERS.map((u) => (
                        <li key={u.uid} className="text-primary/80 dark:text-white/80">
                            <span className="font-bold">{u.role}</span> — {u.email}
                        </li>
                    ))}
                </ul>
                <p className="text-sm text-primary/50 dark:text-white/50">
                    Edit <code>server/src/config/users.ts</code> and run <code>npm run db:seed</code> in the server folder.
                </p>
                <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary dark:bg-white text-white dark:text-primary rounded-xl font-bold text-sm"
                >
                    Go to sign in
                    <span className="material-symbols-outlined !text-lg">arrow_forward</span>
                </Link>
            </div>
        </div>
    )
}

export default Signup
