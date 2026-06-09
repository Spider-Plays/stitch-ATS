import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import { ApiError } from '../lib/apiClient'
import { useToastStore } from '../store/toastStore'
import { useAuth } from './useAuth'
import { candidateStatusLabel } from '@/pages/candidates/_shared/candidate.utils'
import {
  canChangeCandidateStage,
  HIRED_STAGE_LOCK_MESSAGE,
} from '@/permissions'
import { requiresStageDetailsModal } from '../components/candidates/CandidateStageDetailsModal'
import type { Candidate, CandidateStatus } from '../types'
import type { HiredMilestoneInput, OfferMilestoneInput } from '../lib/candidateMilestones'

type PendingModal = {
  candidateId: string
  candidateName: string
  status: 'OFFER' | 'HIRED'
}

export function useCandidateStageChange(options?: { requirementId?: string }) {
  const queryClient = useQueryClient()
  const { addToast } = useToastStore()
  const { user } = useAuth()
  const [pendingModal, setPendingModal] = useState<PendingModal | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const invalidate = async (candidateId: string) => {
    await queryClient.invalidateQueries({ queryKey: ['candidate', candidateId] })
    await queryClient.invalidateQueries({ queryKey: ['candidates'] })
    await queryClient.invalidateQueries({ queryKey: ['candidate-activity', candidateId] })
    if (options?.requirementId) {
      await queryClient.invalidateQueries({
        queryKey: ['candidates', options.requirementId],
      })
    }
  }

  const applyStageChange = async (
    candidateId: string,
    newStage: CandidateStatus,
    milestone?: OfferMilestoneInput | HiredMilestoneInput
  ) => {
    setIsSubmitting(true)
    try {
      await api.candidates.updateStatus(candidateId, newStage, milestone)
      addToast(`Moved to ${candidateStatusLabel(newStage)}`, 'success')
      setPendingModal(null)
      await invalidate(candidateId)
    } catch (err) {
      addToast(err instanceof ApiError ? err.message : 'Failed to update stage', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const requestStageChange = (candidate: Candidate, newStage: CandidateStatus) => {
    if (!canChangeCandidateStage(candidate, newStage, user?.role)) {
      if (candidate.status === 'HIRED' && newStage !== candidate.status) {
        addToast(HIRED_STAGE_LOCK_MESSAGE, 'error')
      }
      return
    }
    if (requiresStageDetailsModal(newStage)) {
      setPendingModal({
        candidateId: candidate.id,
        candidateName: candidate.name,
        status: newStage,
      })
      return
    }
    void applyStageChange(candidate.id, newStage)
  }

  const confirmModal = (milestone: OfferMilestoneInput | HiredMilestoneInput) => {
    if (!pendingModal) return
    void applyStageChange(pendingModal.candidateId, pendingModal.status, milestone)
  }

  const closeModal = () => {
    if (!isSubmitting) setPendingModal(null)
  }

  return {
    pendingModal,
    isSubmitting,
    requestStageChange,
    confirmModal,
    closeModal,
  }
}
