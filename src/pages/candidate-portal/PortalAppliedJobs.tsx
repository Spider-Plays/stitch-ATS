import { Navigate, useParams } from 'react-router-dom'

/** Redirect legacy /portal/applied routes to unified jobs page */
export default function PortalAppliedJobs() {
  const { requirementId } = useParams()
  if (requirementId) {
    return <Navigate to={`/portal/jobs/applied/${requirementId}`} replace />
  }
  return <Navigate to="/portal/jobs?tab=applied" replace />
}
