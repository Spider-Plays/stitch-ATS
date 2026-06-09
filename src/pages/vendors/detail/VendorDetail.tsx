import React, { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AnimatedTabNav } from '@/components/motion/AnimatedTabNav'
import { TabContent } from '@/components/motion/TabContent'
import { api } from '@/services/api'
import { useToastStore } from '@/store/toastStore'
import { ApiError } from '@/lib/apiClient'
import type { VendorStatus } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { isAdminRole } from '@/permissions'
import {
  sanitizeVendorProfileTab,
  VENDOR_PROFILE_TABS,
  type VendorProfileTab,
} from '@/pages/vendors/detail/vendor-profile.utils'
import { VendorProfileHeader } from '@/pages/vendors/detail/components/VendorProfileHeader'
import { VendorProfileOverview } from '@/pages/vendors/detail/components/VendorProfileOverview'
import { VendorProfileJobs } from '@/pages/vendors/detail/components/VendorProfileJobs'
import { VendorProfileUsers } from '@/pages/vendors/detail/components/VendorProfileUsers'
import { VendorProfileSubmissions } from '@/pages/vendors/detail/components/VendorProfileSubmissions'
import { VendorProfileSidebar } from '@/pages/vendors/detail/components/VendorProfileSidebar'
import './detail.css'

const VendorDetail = () => {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const { addToast } = useToastStore()
  const { user } = useAuth()

  const tabFromUrl = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState<VendorProfileTab>(
    sanitizeVendorProfileTab(tabFromUrl)
  )

  useEffect(() => {
    setActiveTab(sanitizeVendorProfileTab(searchParams.get('tab')))
  }, [searchParams])

  const setTab = (tab: VendorProfileTab) => {
    setActiveTab(tab)
    setSearchParams(tab === 'overview' ? {} : { tab }, { replace: true })
  }

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editName, setEditName] = useState('')
  const [editCode, setEditCode] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editWebsite, setEditWebsite] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editContactName, setEditContactName] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [selectedJobs, setSelectedJobs] = useState<string[]>([])

  const { data: vendor, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['vendor', id],
    queryFn: () => api.vendors.get(id!),
    enabled: !!id,
  })

  const { data: requirements = [] } = useQuery({
    queryKey: ['requirements'],
    queryFn: api.requirements.list,
  })

  const liveJobs = requirements.filter((r) => r.status === 'LIVE')

  const canEdit =
    isAdminRole(user?.role) ||
    user?.role === 'HR_HEAD' ||
    user?.role === 'HR_MANAGER' ||
    user?.role === 'RECRUITER'

  const syncEditFields = () => {
    if (!vendor) return
    setEditName(vendor.name)
    setEditCode(vendor.code ?? '')
    setEditEmail(vendor.email)
    setEditPhone(vendor.phone ?? '')
    setEditWebsite(vendor.website ?? '')
    setEditAddress(vendor.address ?? '')
    setEditContactName(vendor.contactName ?? '')
    setEditNotes(vendor.notes ?? '')
  }

  useEffect(() => {
    if (vendor && !isEditing) syncEditFields()
  }, [vendor, isEditing])

  const statusMutation = useMutation({
    mutationFn: (status: VendorStatus) => api.vendors.update(id!, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', id] })
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      addToast('Vendor status updated', 'success')
    },
    onError: (err: unknown) =>
      addToast(err instanceof ApiError ? err.message : 'Update failed', 'error'),
  })

  const assignMutation = useMutation({
    mutationFn: () => api.vendors.assignJobs(id!, selectedJobs),
    onSuccess: () => {
      setSelectedJobs([])
      queryClient.invalidateQueries({ queryKey: ['vendor', id] })
      addToast('Jobs assigned', 'success')
    },
    onError: (err: unknown) =>
      addToast(err instanceof ApiError ? err.message : 'Assign failed', 'error'),
  })

  const unassignMutation = useMutation({
    mutationFn: (requirementId: string) => api.vendors.unassignJob(id!, requirementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', id] })
      addToast('Job unassigned', 'success')
    },
  })

  const inviteMutation = useMutation({
    mutationFn: (data: { email: string; name?: string }) => api.vendors.inviteUser(id!, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['vendor', id] })
      if (res.emailSent) {
        addToast('User invited', 'success')
      } else if (res.emailWarning) {
        addToast(
          res.devHint ? `${res.emailWarning} ${res.devHint}` : res.emailWarning,
          'warning'
        )
      } else {
        addToast('User invited', 'success')
      }
    },
    onError: (err: unknown) =>
      addToast(err instanceof ApiError ? err.message : 'Invite failed', 'error'),
  })

  const startEditing = () => {
    syncEditFields()
    setActiveTab('overview')
    setTab('overview')
    setIsEditing(true)
  }

  const cancelEditing = () => {
    syncEditFields()
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!vendor) return
    if (!editName.trim()) {
      addToast('Vendor name is required', 'error')
      return
    }
    if (!editEmail.trim()) {
      addToast('Email is required', 'error')
      return
    }

    setIsSaving(true)
    try {
      await api.vendors.update(vendor.id, {
        name: editName.trim(),
        code: editCode.trim() || null,
        email: editEmail.trim(),
        phone: editPhone.trim() || null,
        website: editWebsite.trim() || null,
        address: editAddress.trim() || null,
        contactName: editContactName.trim() || null,
        notes: editNotes.trim() || null,
      })
      addToast('Vendor updated', 'success')
      await queryClient.invalidateQueries({ queryKey: ['vendor', id] })
      await queryClient.invalidateQueries({ queryKey: ['vendors'] })
      setIsEditing(false)
    } catch (err) {
      addToast(err instanceof ApiError ? err.message : 'Failed to update vendor', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-24 text-center text-muted-foreground font-medium animate-pulse">
        Loading vendor profile…
      </div>
    )
  }

  if (isError || !vendor) {
    return (
      <div className="max-w-7xl mx-auto py-16 text-center space-y-4">
        <p className="text-primary dark:text-white font-bold">
          {error instanceof ApiError ? error.message : 'Vendor not found'}
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

  const displayName = isEditing ? editName || vendor.name : vendor.name

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6 pb-12 animate-in fade-in duration-500">
      <VendorProfileHeader
        vendor={vendor}
        displayName={displayName}
        isEditing={isEditing}
        editName={editName}
        editCode={editCode}
        editEmail={editEmail}
        setEditName={setEditName}
        setEditCode={setEditCode}
        setEditEmail={setEditEmail}
        canEdit={canEdit}
        isSaving={isSaving}
        statusPending={statusMutation.isPending}
        onStartEdit={startEditing}
        onCancelEdit={cancelEditing}
        onSave={handleSave}
        onStatusChange={(status) => statusMutation.mutate(status)}
      />

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        <div className="flex-1 min-w-0 space-y-4">
          <AnimatedTabNav
            layoutId="vendor-profile-tabs"
            variant="pill"
            className="overflow-x-auto custom-scrollbar"
            aria-label="Vendor profile sections"
            tabs={VENDOR_PROFILE_TABS.map((tab) => ({
              id: tab.id,
              label: (
                <>
                  {tab.label}
                  {tab.id === 'jobs' && vendor.assignments.length > 0 && (
                    <span className="ml-1.5 text-[10px] tabular-nums opacity-80">
                      ({vendor.assignments.length})
                    </span>
                  )}
                  {tab.id === 'users' && vendor.users.length > 0 && (
                    <span className="ml-1.5 text-[10px] tabular-nums opacity-80">
                      ({vendor.users.length})
                    </span>
                  )}
                  {tab.id === 'submissions' && vendor.submissions.length > 0 && (
                    <span className="ml-1.5 text-[10px] tabular-nums opacity-80">
                      ({vendor.submissions.length})
                    </span>
                  )}
                </>
              ),
            }))}
            activeId={activeTab}
            onChange={(id) => setTab(id as VendorProfileTab)}
          />

          <div className="app-card p-5 md:p-6 min-h-[320px] shadow-sm">
            <TabContent activeKey={activeTab + (isEditing ? '-edit' : '')}>
                {isEditing && activeTab !== 'overview' && (
                  <div className="mb-4 p-4 rounded-xl border border-amber-200/60 dark:border-amber-500/30 bg-amber-500/10 text-sm font-medium text-amber-900 dark:text-amber-200">
                    Company details are edited on the{' '}
                    <button
                      type="button"
                      onClick={() => setTab('overview')}
                      className="font-bold underline"
                    >
                      Overview
                    </button>{' '}
                    tab. Save changes from the header when finished.
                  </div>
                )}

                {activeTab === 'overview' && (
                  <VendorProfileOverview
                    vendor={vendor}
                    isEditing={isEditing}
                    editPhone={editPhone}
                    editWebsite={editWebsite}
                    editAddress={editAddress}
                    editContactName={editContactName}
                    editNotes={editNotes}
                    setEditPhone={setEditPhone}
                    setEditWebsite={setEditWebsite}
                    setEditAddress={setEditAddress}
                    setEditContactName={setEditContactName}
                    setEditNotes={setEditNotes}
                  />
                )}
                {activeTab === 'jobs' && canEdit && (
                  <VendorProfileJobs
                    vendor={vendor}
                    liveJobs={liveJobs}
                    selectedJobs={selectedJobs}
                    setSelectedJobs={setSelectedJobs}
                    onAssign={() => assignMutation.mutate()}
                    onUnassign={(reqId) => unassignMutation.mutate(reqId)}
                    assignPending={assignMutation.isPending}
                    unassignPending={unassignMutation.isPending}
                  />
                )}
                {activeTab === 'jobs' && !canEdit && (
                  <p className="text-sm text-primary/50 dark:text-white/50">
                    You do not have permission to manage job assignments.
                  </p>
                )}
                {activeTab === 'users' && canEdit && (
                  <VendorProfileUsers
                    vendor={vendor}
                    onInvite={(data) => inviteMutation.mutate(data)}
                    invitePending={inviteMutation.isPending}
                  />
                )}
                {activeTab === 'users' && !canEdit && (
                  <p className="text-sm text-primary/50 dark:text-white/50">
                    You do not have permission to invite portal users.
                  </p>
                )}
                {activeTab === 'submissions' && <VendorProfileSubmissions vendor={vendor} />}
            </TabContent>
          </div>
        </div>

        <VendorProfileSidebar
          vendor={vendor}
          onOpenJobsTab={() => setTab('jobs')}
          onOpenUsersTab={() => setTab('users')}
          onOpenSubmissionsTab={() => setTab('submissions')}
        />
      </div>
    </div>
  )
}

export default VendorDetail
