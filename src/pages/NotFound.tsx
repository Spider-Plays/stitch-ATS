import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, AlertTriangle } from 'lucide-react'

const NotFound = () => {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-white dark:bg-[#15191d] flex items-center justify-center p-4">
            <div className="text-center max-w-lg">
                <div className="mb-6 flex justify-center">
                    <div className="size-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                        <AlertTriangle className="text-red-600 dark:text-red-500" size={48} />
                    </div>
                </div>

                <h1 className="text-8xl font-black text-primary dark:text-white mb-2 tracking-tighter">404</h1>
                <h2 className="text-2xl font-bold text-primary/80 dark:text-white/80 mb-4">Page Not Found</h2>
                <p className="text-primary/60 dark:text-white/60 mb-8 font-medium">
                    The page you are looking for doesn't exist or has been moved.
                </p>

                <button
                    onClick={() => navigate('/')}
                    className="bg-primary dark:bg-white text-white dark:text-primary px-8 py-3 rounded-xl font-bold flex items-center gap-2 mx-auto hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 dark:shadow-none"
                >
                    <Home size={18} />
                    Go Home
                </button>
            </div>
        </div>
    )
}

export default NotFound
