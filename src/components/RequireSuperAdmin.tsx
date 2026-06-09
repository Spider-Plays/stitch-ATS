import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { canManageUsers } from '@/permissions'

/** Restricts content to Super Admin (user management and related APIs). */
export const RequireSuperAdmin = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth()

  if (loading) return null
  if (!user || !canManageUsers(user.role)) {
    return <Navigate to="/admin" replace />
  }

  return children
}
