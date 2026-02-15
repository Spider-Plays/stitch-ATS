import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export const RequireAuth = ({ children, allowedRoles }: { children: JSX.Element, allowedRoles?: string[] }) => {
    const { user, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return <div className="h-screen flex items-center justify-center">Loading...</div>
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect based on role if unauthorized
        if (user.role === 'CANDIDATE') return <Navigate to="/portal/dashboard" replace />
        return <Navigate to="/dashboard" replace />
    }

    return children
}
