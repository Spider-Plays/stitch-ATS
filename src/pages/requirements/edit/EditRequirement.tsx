import { Navigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import { HiringManagerRequirementEdit } from '@/components/requirements/HiringManagerRequirementEdit'
import { canEditRequirement } from '@/permissions'
import './edit.css'

const EditRequirement = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()

  const { data: requirement, isLoading } = useQuery({
    queryKey: ['requirement', id],
    queryFn: () => api.requirements.getById(id || ''),
    enabled: !!id,
  })

  if (user?.role !== 'HIRING_MANAGER') {
    return <Navigate to={id ? `/requirements/${id}` : '/requirements'} replace />
  }

  if (isLoading) {
    return <div className="p-12 text-center animate-pulse text-primary/60">Loading…</div>
  }

  if (!requirement) {
    return <div className="p-12 text-center">Requirement not found</div>
  }

  if (!canEditRequirement(user?.role, requirement, user)) {
    return <Navigate to={`/requirements/${requirement.id}`} replace />
  }

  return (
    <div className="p-6 md:p-8">
      <HiringManagerRequirementEdit requirement={requirement} />
    </div>
  )
}

export default EditRequirement
