import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'

/** Redirects candidates to profile setup until all required fields are filled. */
export function PortalProfileGate() {
  const location = useLocation()
  const { data, isLoading } = useQuery({
    queryKey: ['portal-me'],
    queryFn: api.portal.getMe,
  })

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-500">Loading your portal…</div>
    )
  }

  const complete = data?.profileComplete === true
  if (!complete) {
    const returnTo = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/portal/onboarding?returnTo=${returnTo}`} replace />
  }

  return <Outlet />
}
