import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import clsx from 'clsx'
import { ActivityLog } from '../../types'
import { ListSearchBar } from '../../components/ui/ListSearchBar'
import { matchesAnySearch } from '../../lib/textSearch'

interface NotificationAction {
    label: string
    primary: boolean
}

interface NotificationItem {
    id: string
    type: 'ACTION_REQUIRED' | 'UPDATE' | 'SYSTEM'
    title: string
    subtitle: string
    time: string
    read: boolean
    icon: string
    colorClass: string
    link?: string
    image?: string
    actions?: NotificationAction[]
    timestamp: number // For sorting
}

const Notifications = () => {
    const { user } = useAuth()
    const [searchTerm, setSearchTerm] = useState('')
    const isHr = ['ADMIN', 'HR_MANAGER', 'HR_HEAD'].includes(user?.role || '')

    const { data: pendingRequirements = [], isLoading: isLoadingReqs } = useQuery({
        queryKey: ['pendingRequirements'],
        queryFn: api.requirements.getPending,
        enabled: isHr
    })

    const { data: activityLogs = [], isLoading: isLoadingLogs } = useQuery({
        queryKey: ['activityLogs'],
        queryFn: () => api.activityLogs.list()
    })

    const isLoading = isLoadingReqs || isLoadingLogs

    // Combine real pending requirements with activity logs
    let notifications: NotificationItem[] = []

    // 1. Pending Requirements (High Priority)
    if (pendingRequirements.length > 0) {
        notifications = notifications.concat(pendingRequirements.map(req => ({
            id: `req-${req.id}`,
            type: 'ACTION_REQUIRED' as const,
            title: 'Requirement Approval Needed',
            subtitle: `${req.title} • ${req.department}`,
            time: new Date(req.createdAt).toLocaleDateString(),
            read: false,
            icon: 'gavel',
            colorClass: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400',
            link: `/requirements/${req.id}`,
            actions: [
                { label: 'Review', primary: true }
            ],
            timestamp: new Date(req.createdAt).getTime()
        })))
    }

    // 2. Activity Logs
    if (activityLogs.length > 0) {
        notifications = notifications.concat(activityLogs.map((log: ActivityLog) => {
            let title = 'System Activity'
            let subtitle = log.action
            let icon = 'info'
            let colorClass = 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400'
            let link = '#'

            // Customize based on entity type and action
            if (log.entityType === 'REQUIREMENT') {
                link = `/requirements/${log.entityId}`
                icon = 'work'
                if (log.action === 'CREATED') {
                    title = 'New Requirement Created'
                    subtitle = `${log.details?.title} by ${log.performerName || 'User'}`
                    colorClass = 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400'
                } else if (log.action === 'APPROVED') {
                    title = 'Requirement Approved'
                    subtitle = `${log.details?.title} approved by ${log.performerName || 'User'}`
                    colorClass = 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400'
                } else if (log.action === 'REJECTED') {
                    title = 'Requirement Rejected'
                    subtitle = `${log.details?.title} rejected by ${log.performerName || 'User'}`
                    colorClass = 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400'
                } else if (log.action === 'UPDATED') {
                    title = 'Requirement Updated'
                    subtitle = `${log.details?.title} updated by ${log.performerName || 'User'}`
                }
            } else if (log.entityType === 'CANDIDATE') {
                link = `/candidates/${log.entityId}`
                icon = 'person'
                if (log.action === 'CREATED') {
                    title = 'New Candidate Added'
                    subtitle = `${log.details?.name} for ${log.details?.jobTitle}`
                    colorClass = 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400'
                } else if (log.action === 'STATUS_UPDATED') {
                    title = 'Candidate Stage Moved'
                    subtitle = `${log.details?.name} moved to ${log.details?.status}`
                    colorClass = 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400'
                }
            }

            return {
                id: log.id,
                type: 'UPDATE' as const,
                title,
                subtitle,
                time: new Date(log.timestamp).toLocaleDateString() + ' ' + new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                read: true, // Auto-mark logs as read for now
                icon,
                colorClass,
                link,
                image: undefined, // Could fetch user avatar if needed
                timestamp: new Date(log.timestamp).getTime()
            }
        }))
    }

    // Sort by timestamp descending
    notifications.sort((a, b) => b.timestamp - a.timestamp)

    const filteredNotifications = useMemo(
        () =>
            notifications.filter((n) =>
                matchesAnySearch([n.title, n.subtitle, n.type], searchTerm)
            ),
        [notifications, searchTerm]
    )

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-primary dark:text-white tracking-tight">Notifications</h1>
                    <p className="text-primary/60 dark:text-white/60 font-medium mt-1">Stay updated on your hiring pipeline.</p>
                </div>
                <div className="flex gap-3">
                    <button className="text-sm font-bold text-primary dark:text-white hover:bg-primary/5 dark:hover:bg-white/5 px-4 py-2 rounded-xl transition-colors">
                        Mark all as read
                    </button>
                    <button className="text-sm font-bold text-primary dark:text-white hover:bg-primary/5 dark:hover:bg-white/5 px-4 py-2 rounded-xl transition-colors">
                        Settings
                    </button>
                </div>
            </div>

            <div className="mb-4">
                <ListSearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search notifications..."
                    className="max-w-none"
                />
            </div>

            <div className="bg-white dark:bg-white/5 border border-primary/10 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex border-b border-primary/10 dark:border-white/10 overflow-x-auto">
                    <button className="px-6 py-4 text-sm font-bold text-primary dark:text-white border-b-2 border-primary dark:border-white">All</button>
                    <button className="px-6 py-4 text-sm font-bold text-primary/40 dark:text-white/40 border-b-2 border-transparent hover:text-primary dark:hover:text-white hover:bg-primary/5 dark:hover:bg-white/5 transition-all">Action Required</button>
                    <button className="px-6 py-4 text-sm font-bold text-primary/40 dark:text-white/40 border-b-2 border-transparent hover:text-primary dark:hover:text-white hover:bg-primary/5 dark:hover:bg-white/5 transition-all">Updates</button>
                    <button className="px-6 py-4 text-sm font-bold text-primary/40 dark:text-white/40 border-b-2 border-transparent hover:text-primary dark:hover:text-white hover:bg-primary/5 dark:hover:bg-white/5 transition-all">System</button>
                </div>

                <div className="divide-y divide-primary/5 dark:divide-white/5">
                    {isLoading && <div className="p-8 text-center text-primary/40">Loading notifications...</div>}

                    {!isLoading && filteredNotifications.length === 0 && (
                        <div className="p-12 text-center text-primary/40">
                            <span className="material-symbols-outlined !text-4xl mb-2">notifications_off</span>
                            <p>{searchTerm.trim() ? 'No notifications match your search' : 'No new notifications'}</p>
                        </div>
                    )}

                    {filteredNotifications.map(notification => (
                        <div key={notification.id} className={clsx("p-6 hover:bg-primary/[0.02] dark:hover:bg-white/[0.02] transition-colors relative group", !notification.read && "bg-primary/[0.01]")}>
                            {!notification.read && (
                                <div className="absolute left-0 top-6 bottom-6 w-1 bg-primary rounded-r"></div>
                            )}
                            <div className="flex gap-4">
                                <div className={clsx("size-10 rounded-full flex items-center justify-center shrink-0", notification.colorClass)}>
                                    {notification.image ? (
                                        <img src={notification.image} className="size-full rounded-full object-cover" />
                                    ) : (
                                        <span className="material-symbols-outlined">{notification.icon}</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-sm font-bold text-primary dark:text-white leading-tight">
                                            {notification.title}
                                        </h3>
                                        <span className="text-[10px] font-bold text-primary/40 dark:text-white/40">{notification.time}</span>
                                    </div>
                                    <p className="text-xs text-primary/60 dark:text-white/60 mt-1 font-medium">{notification.subtitle}</p>

                                    {notification.actions && (
                                        <div className="flex gap-2 mt-3">
                                            {notification.actions.map(action => (
                                                <Link
                                                    key={action.label}
                                                    to={notification.link || '#'}
                                                    className={clsx(
                                                        "text-xs px-3 py-1.5 rounded-lg font-bold transition-colors inline-block",
                                                        action.primary
                                                            ? "bg-primary dark:bg-white text-white dark:text-primary hover:opacity-90"
                                                            : "bg-primary/5 dark:bg-white/10 text-primary dark:text-white hover:bg-primary/10 dark:hover:bg-white/20"
                                                    )}
                                                >
                                                    {action.label}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                    { /* Make entire card clickable if link exists and no actions */}
                                    {!notification.actions && notification.link && (
                                        <Link to={notification.link} className="absolute inset-0 z-10" />
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] text-center">
                    <button className="text-xs font-bold text-primary dark:text-white hover:underline">Load older notifications</button>
                </div>
            </div>
        </div>
    )
}

export default Notifications
