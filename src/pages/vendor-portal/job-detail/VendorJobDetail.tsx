import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/services/api'
import { useToastStore } from '@/store/toastStore'
import { ApiError } from '@/lib/apiClient'
import { CandidateSubmissionWizard } from '@/components/candidates/CandidateSubmissionWizard'
import type { CandidateProfileFormValues } from '@/lib/candidateSubmissionForm'
import './job-detail.css'

const VendorJobDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToast } = useToastStore()

  const { data: job, isLoading } = useQuery({
    queryKey: ['vendor-portal-position', id],
    queryFn: () => api.vendorPortal.getPosition(id!),
    enabled: !!id,
  })

  const submitMutation = useMutation({
    mutationFn: async ({
      data,
      resumeFile,
    }: {
      data: CandidateProfileFormValues
      resumeFile: File | null
    }) => {
      const candidate = await api.vendorPortal.submitCandidate(id!, {
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
      })
      if (resumeFile) {
        try {
          await api.vendorPortal.uploadResume(candidate.id, resumeFile)
        } catch (uploadErr) {
          const uploadMsg =
            uploadErr instanceof ApiError ? uploadErr.message : 'Resume upload failed'
          throw new ApiError(
            `Candidate submitted but resume could not be saved: ${uploadMsg}`,
            201
          )
        }
      }
      return candidate
    },
    onSuccess: () => {
      addToast('Candidate submitted successfully', 'success')
      navigate('/vendor-portal/submissions')
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Submission failed'
      addToast(msg, err instanceof ApiError && err.status === 201 ? 'error' : 'error')
      if (err instanceof ApiError && err.status === 201) {
        navigate('/vendor-portal/submissions')
      }
    },
  })

  if (isLoading) return <div className="p-12 text-center text-slate-500">Loading...</div>
  if (!job) return <div className="p-12 text-center">Job not found</div>

  return (
    <CandidateSubmissionWizard
      variant="vendor"
      title="Submit candidate"
      subtitle="Upload a resume and complete the same profile fields your recruiting team uses for new candidates."
      backHref="/vendor-portal/positions"
      submitLabel="Submit candidate"
      jobCard={{
        jobCode: job.jobCode,
        title: job.title,
        client: job.client,
        department: job.department,
        location: job.location,
        description: job.description,
      }}
      parseResume={(file) => api.vendorPortal.parseResume(file)}
      checkEmail={(email) => api.vendorPortal.checkEmail(email)}
      isSubmitting={submitMutation.isPending}
      onToast={(message, type) => addToast(message, type)}
      onSubmit={async (values, resumeFile) => {
        await submitMutation.mutateAsync({ data: values, resumeFile })
      }}
    />
  )
}

export default VendorJobDetail
