import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { FeatureTagKey, hasFeatureTag } from '@/permissions'
import { firstAllowedPath } from '@/permissions'

export const RequireFeatureTag = ({
  tag,
  children,
}: {
  tag: FeatureTagKey
  children: JSX.Element
}) => {
  const { user, allowedPages } = useAuth()

  if (!user || !hasFeatureTag(user.role, user.tags, tag)) {
    return <Navigate to={firstAllowedPath(allowedPages)} replace />
  }

  return children
}
