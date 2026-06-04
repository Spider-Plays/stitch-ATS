import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '../../services/api'
import { useToastStore } from '../../store/toastStore'
import { ApiError } from '../../lib/apiClient'
import { CandidateSubmissionWizard } from '../../components/candidates/CandidateSubmissionWizard'
import type { ReferralSubmissionFormValues } from '../../lib/candidateSubmissionForm'

const ReferralJobDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToast } = useToastStore()

  const { data: job, isLoading } = useQuery({
    queryKey: ['referral-portal-position', id],
    queryFn: () => api.referralPortal.getPosition(id!),
    enabled: !!id,
  })

  const submitMutation = useMutation({
    mutationFn: async ({
      data,
      resumeFile,
    }: {
      data: ReferralSubmissionFormValues
      resumeFile: File | null
    }) => {
      const candidate = await api.referralPortal.submitReferral(id!, {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        location: data.location.trim(),
        pan: data.pan.trim().toUpperCase(),
        totalExperience: data.totalExperience.trim(),
        currentCompany: data.currentCompany.trim(),
        currentCTC: data.currentCTC.trim(),
        expectedCTC: data.expectedCTC.trim(),
        noticePeriod: data.noticePeriod.trim(),
        linkedIn: data.linkedin?.trim() || undefined,
        portfolio: data.portfolio?.trim() || undefined,
        primarySkills: data.primarySkills,
        secondarySkills: data.secondarySkills ?? [],
        referralRelationship: data.referralRelationship,
        referralNotes: data.referralNotes?.trim() || undefined,
      })
      if (resumeFile) {
        try {
          await api.referralPortal.uploadResume(candidate.id, resumeFile)
        } catch (uploadErr) {
          const uploadMsg =
            uploadErr instanceof ApiError ? uploadErr.message : 'Resume upload failed'
          throw new ApiError(
            `Referral submitted but resume could not be saved: ${uploadMsg}`,
            201
          )
        }
      }
      return candidate
    },
    onSuccess: () => {
      addToast('Referral submitted successfully', 'success')
      navigate('/referral-portal/referrals')
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Submission failed'
      addToast(msg, 'error')
      if (err instanceof ApiError && err.status === 201) {
        navigate('/referral-portal/referrals')
      }
    },
  })

  if (isLoading) return <div className="p-12 text-center text-slate-500">Loading…</div>
  if (!job) return <div className="p-12 text-center">Job not found</div>

  return (
    <CandidateSubmissionWizard
      variant="referral"
      title="Refer a candidate"
      subtitle="Upload their resume, tell us how you know them, and we'll route them to recruiting."
      backHref="/referral-portal/jobs"
      submitLabel="Submit referral"
      jobCard={{
        jobCode: job.jobCode,
        title: job.title,
        client: job.client,
        department: job.department,
        location: job.location,
        description: job.description,
        referralBonusAmount: job.referralBonusAmount,
      }}
      parseResume={(file) => api.referralPortal.parseResume(file)}
      checkEmail={(email) => api.referralPortal.checkEmail(email)}
      isSubmitting={submitMutation.isPending}
      onToast={(message, type) => addToast(message, type)}
      onSubmit={async (values, resumeFile) => {
        await submitMutation.mutateAsync({ data: values, resumeFile })
      }}
    />
  )
}

export default ReferralJobDetail
