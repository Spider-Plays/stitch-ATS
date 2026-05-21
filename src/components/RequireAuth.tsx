import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { canAccessPage, firstAllowedPath, pathnameToPageKey } from '../lib/pageAccess'

export const RequireAuth = ({
    children,
    allowedRoles,
    skipPageCheck,
}: {
    children: JSX.Element
    allowedRoles?: string[]
    skipPageCheck?: boolean
}) => {
    const { user, loading, allowedPages } = useAuth()
    const location = useLocation()

    if (loading) {
        return <div className="h-screen flex items-center justify-center">Loading...</div>
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        if (user.role === 'CANDIDATE') return <Navigate to="/portal/dashboard" replace />
        if (user.role === 'VENDOR') return <Navigate to="/vendor-portal/dashboard" replace />
        if (user.role === 'ADMIN') return <Navigate to="/admin/users" replace />
        return <Navigate to="/dashboard" replace />
    }

    if (!skipPageCheck && user.role !== 'CANDIDATE' && user.role !== 'VENDOR') {
        const pageKey = pathnameToPageKey(location.pathname)
        if (pageKey && !canAccessPage(allowedPages, pageKey)) {
            const fallback = firstAllowedPath(allowedPages)
            return <Navigate to={fallback} replace />
        }
    }

    return children
}
