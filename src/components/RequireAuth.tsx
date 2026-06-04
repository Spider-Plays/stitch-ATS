import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { canAccessPage, firstAllowedPath, pathnameToPageKey } from '../lib/pageAccess'
import { featureTagFromPath, hasFeatureTag } from '../lib/userTags'

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
        const loginPath = location.pathname.startsWith('/portal')
            ? '/portal/login'
            : location.pathname.startsWith('/referral-portal')
              ? '/referral-portal/login'
              : '/login'
        return <Navigate to={loginPath} state={{ from: location }} replace />
    }

    if (
        user.role === 'CANDIDATE' &&
        !location.pathname.startsWith('/portal') &&
        location.pathname !== '/login'
    ) {
        return <Navigate to="/portal/dashboard" replace />
    }

    if (
        user.role === 'EMPLOYEE' &&
        !location.pathname.startsWith('/referral-portal') &&
        location.pathname !== '/login' &&
        location.pathname !== '/referral-portal/login'
    ) {
        return <Navigate to="/referral-portal/dashboard" replace />
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        if (user.role === 'CANDIDATE') return <Navigate to="/portal/login" replace />
        if (user.role === 'EMPLOYEE') return <Navigate to="/referral-portal/dashboard" replace />
        if (user.role === 'VENDOR') return <Navigate to="/vendor-portal/dashboard" replace />
        if (user.role === 'ADMIN') return <Navigate to="/admin" replace />
        return <Navigate to="/dashboard" replace />
    }

    if (!skipPageCheck && user.role !== 'CANDIDATE' && user.role !== 'VENDOR' && user.role !== 'EMPLOYEE') {
        const featureTag = featureTagFromPath(location.pathname)
        if (featureTag) {
            if (!hasFeatureTag(user.role, user.tags, featureTag)) {
                return <Navigate to={firstAllowedPath(allowedPages)} replace />
            }
        } else {
            const pageKey = pathnameToPageKey(location.pathname)
            if (pageKey && !canAccessPage(allowedPages, pageKey)) {
                const fallback = firstAllowedPath(allowedPages)
                return <Navigate to={fallback} replace />
            }
        }
    }

    return children
}
