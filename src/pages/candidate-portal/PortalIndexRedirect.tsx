import { Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { portalHomePath } from '../../lib/portalWorkflow'

export function PortalIndexRedirect() {
  const { data, isLoading } = useQuery({
    queryKey: ['portal-me'],
    queryFn: api.portal.getMe,
  })

  if (isLoading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-slate-500">
        Loading…
      </div>
    )
  }

  return <Navigate to={portalHomePath(data)} replace />
}
