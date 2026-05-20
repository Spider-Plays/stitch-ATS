import React from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Mail } from 'lucide-react'
import { EmptyState } from '../../components/ui/EmptyState'

const CandidateDashboard = () => {
    const { user } = useAuth()

    return (
        <div className="max-w-[1440px] mx-auto w-full p-4 md:p-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-8">
                <div className="bg-white dark:bg-white/5 rounded-2xl border border-primary/10 dark:border-white/10 p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                        <div className="size-20 rounded-full border-4 border-white dark:border-white/10 shadow-sm overflow-hidden bg-primary/5 dark:bg-white/5">
                            <img
                                src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}`}
                                alt={user?.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-primary dark:text-white tracking-tight">{user?.name}</h1>
                            <p className="text-primary/70 dark:text-white/70 font-medium mt-1">{user?.role}</p>
                            <div className="flex items-center gap-2 mt-2 text-sm text-primary/60 dark:text-white/60 font-medium">
                                <Mail size={14} /> {user?.email}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-white/5 rounded-2xl border border-primary/10 dark:border-white/10 shadow-sm">
                        <EmptyState
                            icon="work"
                            title="No applications yet"
                            description="Your job applications and status updates will appear here."
                        />
                    </div>
                    <div className="bg-white dark:bg-white/5 rounded-2xl border border-primary/10 dark:border-white/10 shadow-sm">
                        <EmptyState
                            icon="event"
                            title="No interviews scheduled"
                            description="Interview invitations will show up in this section."
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CandidateDashboard
