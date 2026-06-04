import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatedTabNav } from '../../components/motion/AnimatedTabNav'
import { TabContent } from '../../components/motion/TabContent'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../services/api'
import { ApiError } from '../../lib/apiClient'
import { useToastStore } from '../../store/toastStore'
import { useConfirm } from '../../hooks/useConfirm'
import { Candidate, CandidateStatus } from '../../types'
import { isIndianItCity, normalizeIndianItCity } from '../../lib/indianItCities'
import type { CandidateProfileTab } from '../../lib/candidateProfilePage'
import {
  getCandidateProfileTabs,
  isInterviewerCandidateView,
  sanitizeCandidateProfileTab,
} from '../../lib/candidateProfilePermissions'
import { CandidateProfileHeader } from '../../components/candidates/profile/CandidateProfileHeader'
import { CandidateProfileSidebar } from '../../components/candidates/profile/CandidateProfileSidebar'
import { CandidateProfileOverview } from '../../components/candidates/profile/CandidateProfileOverview'
import { CandidateProfileResume } from '../../components/candidates/profile/CandidateProfileResume'
import { CandidateProfileActivity } from '../../components/candidates/profile/CandidateProfileActivity'
import { CandidateProfileInterviews } from '../../components/candidates/profile/CandidateProfileInterviews'
import { CandidateStageDetailsModal } from '../../components/candidates/CandidateStageDetailsModal'
import { useCandidateStageChange } from '../../hooks/useCandidateStageChange'
import { canScheduleInterviews } from '../../lib/interviewPermissions'

const CandidateProfile = () => {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addToast } = useToastStore()
  const confirm = useConfirm()
  const queryClient = useQueryClient()

  const isInterviewerView = isInterviewerCandidateView(user?.role)
  const profileTabs = getCandidateProfileTabs(user?.role)

  const tabFromUrl = searchParams.get('tab')
  const initialTab = sanitizeCandidateProfileTab(
    user?.role,
    tabFromUrl === 'resume' ||
      tabFromUrl === 'interviews' ||
      tabFromUrl === 'activity' ||
      tabFromUrl === 'overview'
      ? tabFromUrl
      : 'overview'
  )
  const [activeTab, setActiveTab] = useState<CandidateProfileTab>(initialTab)
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (
      tab === 'resume' ||
      tab === 'interviews' ||
      tab === 'activity' ||
      tab === 'overview'
    ) {
      setActiveTab(sanitizeCandidateProfileTab(user?.role, tab))
    }
  }, [searchParams, user?.role])
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [resumeBlobUrl, setResumeBlobUrl] = useState<string | null>(null)
  const [resumeLoading, setResumeLoading] = useState(false)
  const [isUploadingResume, setIsUploadingResume] = useState(false)
  const [editData, setEditData] = useState<Candidate | null>(null)
  const [skillsError, setSkillsError] = useState<string | undefined>()
  const {
    pendingModal: stageModal,
    isSubmitting: stageSubmitting,
    requestStageChange,
    confirmModal: handleStageModalConfirm,
    closeModal: closeStageModal,
  } = useCandidateStageChange()

  const {
    data: candidate,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['candidate', id],
    queryFn: () => api.candidates.get(id!),
    enabled: !!id,
  })

  const { data: interviews = [] } = useQuery({
    queryKey: ['candidate-interviews', id],
    queryFn: () => api.interviews.getByCandidateId(id!),
    enabled: !!id && !isInterviewerView,
  })

  const { data: activityLogs = [], isLoading: activityLoading } = useQuery({
    queryKey: ['candidate-activity', id],
    queryFn: () => api.activityLogs.getByEntity(id!),
    enabled: !!id && !isInterviewerView,
  })

  const { data: requirements = [] } = useQuery({
    queryKey: ['requirements'],
    queryFn: api.requirements.list,
    enabled: !isInterviewerView,
  })

  React.useEffect(() => {
    if (candidate && !isEditing) setEditData(candidate)
  }, [candidate, isEditing])

  const hasResume = !!(candidate?.hasResume || candidate?.resumeFileName)
  const isPdfResume = !!(
    candidate?.resumeMimeType === 'application/pdf' ||
    candidate?.resumeFileName?.toLowerCase().endsWith('.pdf')
  )

  React.useEffect(() => {
    if (!id || !hasResume) {
      setResumeBlobUrl(null)
      return
    }

    let objectUrl: string | null = null
    let cancelled = false

    const load = async () => {
      setResumeLoading(true)
      try {
        const blob = await api.candidates.fetchResume(id)
        if (cancelled || !blob) return
        objectUrl = URL.createObjectURL(blob)
        setResumeBlobUrl(objectUrl)
      } catch {
        if (!cancelled) setResumeBlobUrl(null)
      } finally {
        if (!cancelled) setResumeLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [id, hasResume, candidate?.resumeFileName])

  const canEdit =
    user?.role === 'ADMIN' ||
    user?.role === 'HR_HEAD' ||
    user?.role === 'HR_MANAGER' ||
    user?.role === 'RECRUITER' ||
    user?.role === 'TEAM_LEAD'
  const canManageInterviews = canScheduleInterviews(user?.role)
  const isAdmin = user?.role === 'ADMIN'

  const handleDeleteProfile = async () => {
    if (!id || !candidate) return
    const ok = await confirm({
      title: 'Delete candidate',
      message: `Permanently delete ${candidate.name}? All interviews, offers, and feedback for this candidate will be removed.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    })
    if (!ok) return
    try {
      await api.candidates.delete(id)
      addToast('Candidate profile deleted', 'success')
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      navigate('/candidates')
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Failed to delete candidate'
      addToast(msg, 'error')
    }
  }

  const startEditing = () => {
    if (!candidate) return
    setEditData({
      ...candidate,
      primarySkills: candidate.primarySkills ?? [],
      secondarySkills: candidate.secondarySkills ?? [],
    })
    setSkillsError(undefined)
    setActiveTab('overview')
    setIsEditing(true)
  }

  const cancelEditing = () => {
    if (candidate) setEditData(candidate)
    setSkillsError(undefined)
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!candidate || !editData) return
    if (!editData.name?.trim()) {
      addToast('Name is required', 'error')
      return
    }
    if (!editData.email?.trim()) {
      addToast('Email is required', 'error')
      return
    }
    const rawLocation = editData.location?.trim()
    let locationToSave: string | undefined
    if (rawLocation) {
      if (isIndianItCity(rawLocation)) {
        locationToSave = rawLocation
      } else {
        const normalized = normalizeIndianItCity(rawLocation)
        if (!normalized) {
          addToast('Select a valid city from the location list', 'error')
          return
        }
        locationToSave = normalized
      }
    }

    if (!editData.requirementId) {
      addToast('Select a job requirement', 'error')
      setActiveTab('overview')
      return
    }
    if ((editData.primarySkills?.length ?? 0) < 1) {
      setSkillsError('Select at least one primary skill')
      setActiveTab('overview')
      addToast('Select at least one primary skill', 'error')
      return
    }
    setSkillsError(undefined)

    setIsSaving(true)
    try {
      await api.candidates.update(candidate.id, {
        name: editData.name.trim(),
        email: editData.email.trim(),
        phone: editData.phone?.trim() || undefined,
        location: locationToSave,
        source: editData.source,
        requirementId: editData.requirementId,
        role: (editData.jobTitle || editData.role)?.trim(),
        jobTitle: (editData.jobTitle || editData.role)?.trim(),
        primarySkills: editData.primarySkills,
        secondarySkills: editData.secondarySkills ?? [],
        totalExperience: editData.totalExperience?.trim() || undefined,
        currentCompany: editData.currentCompany?.trim() || undefined,
        currentCTC: editData.currentCTC?.trim() || undefined,
        expectedCTC: editData.expectedCTC?.trim() || undefined,
        noticePeriod: editData.noticePeriod?.trim() || undefined,
        linkedIn: editData.linkedIn?.trim() || undefined,
        portfolio: editData.portfolio?.trim() || undefined,
      })

      addToast('Profile updated successfully', 'success')
      await queryClient.invalidateQueries({ queryKey: ['candidate', id] })
      await queryClient.invalidateQueries({ queryKey: ['candidate-activity', id] })
      await queryClient.invalidateQueries({ queryKey: ['candidates'] })
      if (candidate.requirementId) {
        await queryClient.invalidateQueries({
          queryKey: ['candidates', 'requirement', candidate.requirementId],
        })
      }
      if (editData.requirementId !== candidate.requirementId) {
        await queryClient.invalidateQueries({
          queryKey: ['candidates', 'requirement', editData.requirementId],
        })
      }
      setIsEditing(false)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to update profile'
      addToast(msg, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleResumeUpload = async (file: File) => {
    if (!candidate) return
    setIsUploadingResume(true)
    try {
      await api.candidates.uploadResume(candidate.id, file)
      addToast('Resume uploaded', 'success')
      await queryClient.invalidateQueries({ queryKey: ['candidate', id] })
      await queryClient.invalidateQueries({ queryKey: ['candidate-activity', id] })
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to upload resume'
      addToast(msg, 'error')
    } finally {
      setIsUploadingResume(false)
    }
  }

  const handleMoveStage = (newStage: CandidateStatus) => {
    if (!candidate) return
    requestStageChange(candidate, newStage)
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-24 text-center text-muted-foreground font-medium animate-pulse">
        Loading candidate profile…
      </div>
    )
  }

  if (isError || !candidate) {
    return (
      <div className="max-w-7xl mx-auto py-16 text-center space-y-4">
        <p className="text-primary dark:text-white font-bold">
          {error instanceof ApiError ? error.message : 'Could not load candidate profile.'}
        </p>
        <p className="text-sm text-primary/50 dark:text-white/50">
          Make sure the API server is running on port 4000.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={() => refetch()}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const displayData = isEditing && editData ? editData : candidate

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6 pb-12 animate-in fade-in duration-500">
      {stageModal && (
        <CandidateStageDetailsModal
          open
          targetStatus={stageModal.status}
          candidateName={stageModal.candidateName}
          onClose={closeStageModal}
          onConfirm={handleStageModalConfirm}
          isSubmitting={stageSubmitting}
        />
      )}

      <CandidateProfileHeader
        candidate={candidate}
        displayData={displayData}
        isEditing={isEditing}
        editData={editData}
        setEditData={setEditData}
        canEdit={canEdit}
        isAdmin={isAdmin}
        isInterviewerView={isInterviewerView}
        isSaving={isSaving}
        onStartEdit={startEditing}
        onCancelEdit={cancelEditing}
        onSave={handleSave}
        onDelete={handleDeleteProfile}
      />

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 overflow-visible">
        <div className="flex-1 min-w-0 space-y-4">
          <AnimatedTabNav
            layoutId="candidate-profile-tabs"
            variant="pill"
            className="overflow-x-auto custom-scrollbar"
            aria-label="Candidate profile sections"
            tabs={profileTabs.map((tab) => ({
              id: tab.id,
              label: (
                <>
                  {tab.label}
                  {!isInterviewerView && tab.id === 'interviews' && interviews.length > 0 && (
                    <span className="ml-1.5 text-[10px] tabular-nums opacity-80">
                      ({interviews.length})
                    </span>
                  )}
                </>
              ),
            }))}
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as CandidateProfileTab)}
          />

          <div className="app-card p-5 md:p-6 min-h-[320px] shadow-sm">
            <TabContent activeKey={activeTab + (isEditing ? '-edit' : '')}>
                {activeTab === 'overview' && (
                  <CandidateProfileOverview
                    displayData={displayData}
                    isEditing={isEditing}
                    editData={editData}
                    setEditData={setEditData}
                    requirements={requirements}
                    isAdmin={isAdmin}
                    isInterviewerView={isInterviewerView}
                    skillsError={skillsError}
                  />
                )}
                {isEditing && activeTab !== 'overview' && (
                  <div className="mb-4 p-4 rounded-xl border border-amber-200/60 dark:border-amber-500/30 bg-amber-500/10 text-sm font-medium text-amber-900 dark:text-amber-200">
                    Job assignment and skills are edited on the{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('overview')}
                      className="font-bold underline"
                    >
                      Overview
                    </button>{' '}
                    tab. Save changes from the header when finished.
                  </div>
                )}
                {activeTab === 'resume' && (
                  <CandidateProfileResume
                    candidate={candidate}
                    hasResume={hasResume}
                    isPdfResume={isPdfResume}
                    resumeBlobUrl={resumeBlobUrl}
                    resumeLoading={resumeLoading}
                    canEdit={canEdit}
                    isUploadingResume={isUploadingResume}
                    onUpload={handleResumeUpload}
                  />
                )}
                {activeTab === 'interviews' && (
                  <CandidateProfileInterviews
                    candidate={candidate}
                    requirement={requirements.find(
                      (r) => r.id === candidate.requirementId
                    )}
                    interviews={interviews}
                    canManage={canManageInterviews}
                    userRole={user?.role}
                    currentUserId={user?.uid}
                  />
                )}
                {activeTab === 'activity' && (
                  <CandidateProfileActivity
                    activityLogs={activityLogs}
                    activityLoading={activityLoading}
                  />
                )}
            </TabContent>
          </div>
        </div>

        {!isInterviewerView && (
          <CandidateProfileSidebar
            candidate={candidate}
            displayData={displayData}
            hasResume={hasResume}
            canEdit={canEdit}
            onMoveStage={handleMoveStage}
            onOpenInterviewsTab={() => setActiveTab('interviews')}
          />
        )}
      </div>
    </div>
  )
}

export default CandidateProfile
