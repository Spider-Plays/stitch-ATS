import React, { useMemo, useState } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { RequirementStatus, User } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import clsx from 'clsx'
import { format } from 'date-fns'
import {
    Check, X, Edit, Clock, MapPin, Users, AlertCircle, Monitor, Briefcase, FileText,
    ChevronRight, Trash2, UserMinus,
} from 'lucide-react'
import { useToastStore } from '@/store/toastStore'
import { useConfirm } from '@/hooks/useConfirm'
import { ApiError } from '@/lib/apiClient'
import { AnimatedTabNav } from '@/components/motion/AnimatedTabNav'
import { TabContent } from '@/components/motion/TabContent'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { AppSelect } from '@/components/ui/AppSelect'
import { departmentSelectOptions } from '@/lib/selectOptions'
import { AdminRequirementEdit } from '@/components/admin/AdminRequirementEdit'
import { InterviewPlanEditor } from '@/components/interviews/InterviewPlanEditor'
import { RequirementPortalControls } from '@/components/requirements/RequirementPortalControls'
import { ListSearchBar } from '@/components/ui/ListSearchBar'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { matchesAnySearch } from '@/lib/textSearch'
import {
  employmentTypeLabel,
  workModeLabel,
  seniorityLabel,
  formatExperienceRange,
  formatRequirementLocation,
  formatDateLabel,
} from '@/lib/requirementFields'
import {
    canApproveRequirement,
    canEditRequirement,
    canUseAdminRequirementEditor,
    canUseHiringManagerEditPage,
    requiresHrHeadDelegationForApproval,
    isAdminRole,
} from '@/permissions'
import { canEditInterviewPlan as canEditInterviewPlanByRole } from '@/permissions'
import { hasOrgWideAccess } from '@/permissions'
import { RequirementApprovalModal } from '@/components/requirements/RequirementApprovalModal'
import { RequirementTimeline } from '@/components/requirements/RequirementTimeline'
import { RequirementHiringPanel } from '@/components/requirements/RequirementHiringPanel'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import './detail.css'

const TABS = [
    { id: 'details', label: 'Requirement Details' },
    { id: 'interview-plan', label: 'Interview Stages' },
    { id: 'recruiters', label: 'Recruiter Assignment' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'candidates', label: 'Candidates' },
]

const CANDIDATES_PREVIEW_LIMIT = 5

const RequirementDetail = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const queryClient = useQueryClient()
    const { user } = useAuth()
    const { addToast } = useToastStore()
    const confirm = useConfirm()
    const tabFromUrl = searchParams.get('tab')
    const normalizedTab =
        tabFromUrl === 'history' || tabFromUrl === 'versions' ? 'timeline' : tabFromUrl
    const [activeTab, setActiveTab] = useState(() =>
        TABS.some((t) => t.id === normalizedTab) ? normalizedTab! : 'details'
    )
    const [selectedRecruiter, setSelectedRecruiter] = useState('')
    const [candidateSearch, setCandidateSearch] = useState('')
    const [approvalModal, setApprovalModal] = useState<{
        action: 'APPROVE' | 'REJECT'
    } | null>(null)
    const [removeRecruiterTarget, setRemoveRecruiterTarget] = useState<{
        id: string
        name: string
    } | null>(null)

    React.useEffect(() => {
        if (tabFromUrl && TABS.some((t) => t.id === tabFromUrl)) {
            setActiveTab(tabFromUrl)
        }
    }, [tabFromUrl])

    const { data: requirement, isLoading } = useQuery({
        queryKey: ['requirement', id],
        queryFn: () => api.requirements.getById(id || ''),
        enabled: !!id
    })

    // Always fetch users to get HM details
    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: () => api.users.list()
    })

    const { data: candidates = [] } = useQuery({
        queryKey: ['candidates', 'requirement', id],
        queryFn: () => api.candidates.getByRequirementId(id || ''),
        enabled: !!id
    })

    const { data: matchingData, isLoading: matchingLoading, refetch: refetchMatches } = useQuery({
        queryKey: ['requirement-matches', id],
        queryFn: () => api.requirements.getMatchingProfiles(id!),
        enabled: !!id,
    })

    const matchingProfiles = matchingData?.matches ?? []
    const suggestedMatches = matchingProfiles.filter((m) => !m.alreadyLinked)

    // Derived Data
    const recruiters = users.filter((u) => u.role === 'RECRUITER' && u.status === 'ACTIVE')
    const hiringManager = users.find(
        (u) =>
            u.uid === requirement?.hiringManager ||
            u.name === requirement?.hiringManager
    )
    const isHr = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'HR_HEAD', 'TEAM_LEAD'].includes(user?.role || '')
    const canApprove = canApproveRequirement(user?.role)
    const adminMustDelegate = requiresHrHeadDelegationForApproval(user?.role)
    const isHiringManager = user?.role === 'HIRING_MANAGER'
    const isAdmin = isAdminRole(user?.role)
    const canEditOrgWide = hasOrgWideAccess(user?.role)
    const canEditInterviewPlan = canEditInterviewPlanByRole(user?.role)
    const { data: departmentCatalog = [] } = useQuery({
        queryKey: ['department-catalog'],
        queryFn: api.departments.list,
        enabled: canEditOrgWide,
    })
    const departmentNames = departmentCatalog.map((d) => d.name)

    const recruiterOptions = useMemo(
        () =>
            recruiters
                .filter((r) => !requirement?.recruiters?.includes(r.uid))
                .map((r) => ({
                    value: r.uid,
                    label: r.name,
                })),
        [recruiters, requirement?.recruiters]
    )

    const filteredCandidates = useMemo(
        () =>
            candidates.filter((c) =>
                matchesAnySearch([c.name, c.email, c.role, c.status, c.source], candidateSearch)
            ),
        [candidates, candidateSearch]
    )

    const previewMatches = suggestedMatches.slice(0, CANDIDATES_PREVIEW_LIMIT)
    const previewLinked = filteredCandidates.slice(0, CANDIDATES_PREVIEW_LIMIT)

    // Mutations
    const approveMutation = useMutation({
        mutationFn: (options?: { onBehalfOfHrHead?: boolean }) =>
            api.requirements.approve(id!, options),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requirement', id] })
            queryClient.invalidateQueries({ queryKey: ['requirements'] })
            queryClient.invalidateQueries({ queryKey: ['pendingRequirements'] })
            setApprovalModal(null)
            addToast('Requirement approved', 'success')
        },
        onError: (err: unknown) => {
            addToast(err instanceof ApiError ? err.message : 'Failed to approve', 'error')
        },
    })

    const rejectMutation = useMutation({
        mutationFn: (options?: { onBehalfOfHrHead?: boolean }) =>
            api.requirements.reject(id!, options),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requirement', id] })
            queryClient.invalidateQueries({ queryKey: ['requirements'] })
            queryClient.invalidateQueries({ queryKey: ['pendingRequirements'] })
            setApprovalModal(null)
            addToast('Requirement rejected', 'success')
        },
        onError: (err: unknown) => {
            addToast(err instanceof ApiError ? err.message : 'Failed to reject', 'error')
        },
    })

    const linkCandidateMutation = useMutation({
        mutationFn: (candidateId: string) => api.requirements.linkCandidate(id!, candidateId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['candidates', 'requirement', id] })
            queryClient.invalidateQueries({ queryKey: ['requirement-matches', id] })
            queryClient.invalidateQueries({ queryKey: ['requirement', id] })
            addToast('Candidate linked to this requirement', 'success')
        },
        onError: () => addToast('Failed to link candidate', 'error'),
    })

    const assignRecruiterMutation = useMutation({
        mutationFn: (recruiterId: string) => api.requirements.assignRecruiter(id!, recruiterId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requirement', id] })
            queryClient.invalidateQueries({ queryKey: ['requirements'] })
            setSelectedRecruiter('')
            addToast('Recruiter assigned', 'success')
        },
        onError: (err: unknown) => {
            addToast(err instanceof ApiError ? err.message : 'Failed to assign recruiter', 'error')
        },
    })

    const unassignRecruiterMutation = useMutation({
        mutationFn: (recruiterId: string) => api.requirements.unassignRecruiter(id!, recruiterId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requirement', id] })
            queryClient.invalidateQueries({ queryKey: ['requirements'] })
            setRemoveRecruiterTarget(null)
            addToast('Recruiter removed', 'success')
        },
        onError: (err: unknown) => {
            addToast(err instanceof ApiError ? err.message : 'Failed to remove recruiter', 'error')
        },
    })

    const deleteMutation = useMutation({
        mutationFn: () => api.requirements.delete(id!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requirements'] })
            addToast('Requirement deleted', 'success')
            navigate('/requirements')
        },
        onError: () => addToast('Failed to delete requirement', 'error'),
    })

    const departmentMutation = useMutation({
        mutationFn: (department: string) => api.requirements.update(id!, { department }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requirement', id] })
            addToast('Department updated', 'success')
        },
        onError: (err: unknown) => {
            const msg = err instanceof ApiError ? err.message : 'Failed to update department'
            addToast(msg, 'error')
        },
    })

    const handleApproval = async (action: 'APPROVE' | 'REJECT') => {
        if (adminMustDelegate) {
            setApprovalModal({ action })
            return
        }
        const ok = await confirm({
            title: action === 'APPROVE' ? 'Approve requirement' : 'Reject requirement',
            message: `Are you sure you want to ${action.toLowerCase()} this requirement?`,
            confirmLabel: action === 'APPROVE' ? 'Approve' : 'Reject',
            variant: action === 'REJECT' ? 'danger' : 'primary',
        })
        if (!ok) return
        if (action === 'APPROVE') approveMutation.mutate({})
        else rejectMutation.mutate({})
    }

    const confirmApprovalModal = (options: { onBehalfOfHrHead: boolean }) => {
        if (!approvalModal) return
        if (approvalModal.action === 'APPROVE') approveMutation.mutate(options)
        else rejectMutation.mutate(options)
    }

    if (isLoading) return <div className="p-12 text-center animate-pulse">Loading requirement...</div>
    if (!requirement) return <div className="p-12 text-center">Requirement not found</div>

    const isPending = requirement.status === 'PENDING_APPROVAL'
    const isLive = requirement.status === 'LIVE'
    const isOnHold = requirement.status === 'ON_HOLD'
    const isClosed = requirement.status === 'CLOSED' || requirement.status === 'CANCELLED'
    const isCancelled = requirement.status === 'CANCELLED'
    const isRejected = requirement.status === 'REJECTED'
    const showAdminEditor =
      canUseAdminRequirementEditor(user?.role) && canEditRequirement(user?.role, requirement, user)
    const showHmEditButton = canUseHiringManagerEditPage(user?.role, requirement, user)

    return (
        <div className="p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
            {/* 2.0 Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        {requirement.priority === 'CRITICAL' && (
                            <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                                <AlertCircle size={12} fill="currentColor" className="text-red-700 dark:text-red-400" /> Urgent
                            </span>
                        )}
                        <span className={clsx(
                            "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1",
                            isPending ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                isLive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                    isOnHold ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                                    isCancelled ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                    isClosed ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400" :
                                        isRejected ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                            "bg-slate-100 text-slate-700"
                        )}>
                            <Clock size={12} />
                            {requirement.status.replace('_', ' ')}
                        </span>
                    </div>

                    <h1 className="text-4xl font-black text-primary dark:text-white tracking-tight leading-tight">
                        {requirement.title}
                    </h1>

                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm flex flex-wrap items-center gap-2">
                        {requirement.jobCode && (
                            <>
                                <span className="font-mono text-primary dark:text-white">Req: {requirement.jobCode}</span>
                                <span className="opacity-30">•</span>
                            </>
                        )}
                        {requirement.client && (
                            <>
                                <span>{requirement.client}</span>
                                <span className="opacity-30">•</span>
                            </>
                        )}
                        {requirement.department} Department
                    </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                    {/* Role-Based Actions */}
                    {canApprove && isPending && (
                        <>
                            <button
                                onClick={() => handleApproval('REJECT')}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-lg shadow-red-600/20 transition-all active:scale-95"
                            >
                                <X size={18} /> Reject
                            </button>
                            <button
                                onClick={() => handleApproval('APPROVE')}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                            >
                                <Check size={18} /> Approve
                            </button>
                        </>
                    )}

                    {isPending && !canApprove && (
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-900 dark:text-amber-100 text-sm font-medium">
                            <Clock size={18} className="shrink-0" />
                            {isHiringManager
                                ? 'Awaiting HR Head approval — hiring managers cannot approve their own requirements.'
                                : 'Awaiting HR Head approval.'}
                        </div>
                    )}

                    {showHmEditButton && (
                        <Link
                            to={`/requirements/${requirement.id}/edit`}
                            className="app-card-interactive inline-flex items-center gap-2 px-5 py-2.5 text-primary dark:text-foreground text-sm font-bold hover:bg-slate-50 dark:hover:bg-muted/60 transition-all"
                        >
                            <Edit size={16} /> Edit requirement
                        </Link>
                    )}
                    {showAdminEditor && (
                        <button
                            type="button"
                            onClick={() => setActiveTab('details')}
                            className="app-card-interactive inline-flex items-center gap-2 px-5 py-2.5 text-primary dark:text-foreground text-sm font-bold hover:bg-slate-50 dark:hover:bg-muted/60 transition-all"
                        >
                            <Edit size={16} /> {isAdmin ? 'Edit (admin)' : 'Edit'}
                        </button>
                    )}

                    {isAdmin && (
                        <button
                            type="button"
                            onClick={async () => {
                                const ok = await confirm({
                                    title: 'Delete requirement',
                                    message: `Delete "${requirement.title}"? Linked candidates will be unassigned. This cannot be undone.`,
                                    confirmLabel: 'Delete',
                                    variant: 'danger',
                                })
                                if (!ok) return
                                deleteMutation.mutate()
                            }}
                            disabled={deleteMutation.isPending}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold disabled:opacity-50"
                        >
                            <Trash2 size={16} /> Delete
                        </button>
                    )}
                </div>
            </div>

            <AnimatedTabNav
                layoutId="requirement-detail-tabs"
                variant="pill"
                className="mb-8 overflow-x-auto custom-scrollbar"
                aria-label="Requirement sections"
                tabs={TABS.map((tab) => ({ id: tab.id, label: tab.label }))}
                activeId={activeTab}
                onChange={setActiveTab}
            />

            <div className="relative min-h-[400px]">
                <TabContent activeKey={activeTab}>
                        {activeTab === 'details' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Left Column (2/3) */}
                                <div className="lg:col-span-2 space-y-6">
                                    {showAdminEditor && (
                                        <AdminRequirementEdit
                                            requirement={requirement}
                                            users={users}
                                            departmentNames={departmentNames}
                                        />
                                    )}

                                    <RequirementPortalControls
                                        requirement={requirement}
                                        userRole={user?.role}
                                        userId={user?.uid}
                                        userName={user?.name}
                                    />

                                    {/* Job Description & Skills */}
                                    <section className="app-card border-slate-200 p-8 shadow-sm">
                                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-primary dark:text-white">
                                            <FileText size={20} className="text-primary/60 dark:text-white/60" /> Job description & skills
                                        </h3>
                                        {(requirement.primarySkills?.length ?? 0) > 0 && (
                                            <div className="mb-4">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Primary skills</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {requirement.primarySkills!.map((s) => (
                                                        <span key={s} className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary dark:text-white text-xs font-bold">{s}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {(requirement.secondarySkills?.length ?? 0) > 0 && (
                                            <div className="mb-6">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Secondary skills</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {requirement.secondarySkills!.map((s) => (
                                                        <span key={s} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white/80 text-xs font-bold">{s}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed">
                                            <p className="whitespace-pre-wrap">{requirement.jobDescription || requirement.description || 'No job description provided.'}</p>
                                        </div>
                                    </section>

                                    {/* Hiring Manager Details Card */}
                                    <section className="app-card border-slate-200 p-8 shadow-sm">
                                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-primary dark:text-white">
                                            <Monitor size={20} className="text-primary/60 dark:text-white/60" /> Hiring Manager Details
                                        </h3>
                                        <div className="relative pl-6 border-l-4 border-slate-100 dark:border-white/10 italic text-slate-500">
                                            "This role is critical for the {requirement.department} team's expansion. We are looking for a candidate who can hit the ground running."
                                        </div>
                                    </section>
                                </div>

                                {/* Right Column (1/3) */}
                                <div className="space-y-6">
                                    <RequirementHiringPanel
                                        requirement={requirement}
                                        userRole={user?.role}
                                    />

                                    {/* Position Details Card */}
                                    <div className="app-card border-slate-200 p-6 shadow-sm">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Position Details</h3>

                                        <div className="space-y-6">
                                            <div>
                                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Department</p>
                                                {canEditOrgWide ? (
                                                    <AppSelect
                                                        value={requirement.department}
                                                        disabled={departmentMutation.isPending}
                                                        onChange={(next) => {
                                                            if (next && next !== requirement.department) {
                                                                departmentMutation.mutate(next)
                                                            }
                                                        }}
                                                        options={departmentSelectOptions(departmentNames, requirement.department).filter((o) => o.value !== '')}
                                                        aria-label="Department"
                                                    />
                                                ) : (
                                                    <p className="text-sm font-bold text-primary dark:text-white">
                                                        {requirement.department}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Total Openings</p>
                                                <p className="text-xl font-black text-primary dark:text-white flex items-center gap-2">
                                                    {requirement.openings} <span className="text-slate-400 text-sm font-medium">Positions</span>
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Priority</p>
                                                    <p className={clsx("text-sm font-bold", requirement.priority === 'CRITICAL' ? "text-red-600" : "text-primary dark:text-white")}>
                                                        {requirement.priority || 'Normal'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Seniority</p>
                                                    <p className="text-sm font-bold text-primary dark:text-white">
                                                        {requirement.seniorityLevel ? seniorityLabel(requirement.seniorityLevel) : '—'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Employment</p>
                                                    <p className="text-sm font-bold text-primary dark:text-white">
                                                        {employmentTypeLabel(requirement.employmentType)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Work mode</p>
                                                    <p className="text-sm font-bold text-primary dark:text-white">
                                                        {requirement.workMode
                                                            ? workModeLabel(requirement.workMode)
                                                            : requirement.isRemote
                                                              ? 'Remote'
                                                              : '—'}
                                                    </p>
                                                </div>
                                                <div className="col-span-2">
                                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Location</p>
                                                    <p className="text-sm font-bold text-primary dark:text-white">
                                                        {formatRequirementLocation(requirement)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Experience</p>
                                                    <p className="text-sm font-bold text-primary dark:text-white">
                                                        {formatExperienceRange(
                                                            requirement.experienceMinYears,
                                                            requirement.experienceMaxYears
                                                        )}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">CTC band</p>
                                                    <p className="text-sm font-bold text-primary dark:text-white">
                                                        {requirement.salaryBand || '—'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Target start</p>
                                                    <p className="text-sm font-bold text-primary dark:text-white">
                                                        {formatDateLabel(requirement.targetStartDate)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Hiring deadline</p>
                                                    <p className="text-sm font-bold text-primary dark:text-white">
                                                        {formatDateLabel(requirement.hiringDeadline)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-2">Hiring Manager</p>
                                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-xl">
                                                    <UserAvatar
                                                        name={hiringManager?.name || 'Unknown'}
                                                        avatar={hiringManager?.avatar}
                                                        size="sm"
                                                    />
                                                    <div>
                                                        <p className="font-bold text-sm text-primary dark:text-white">{hiringManager?.name || 'Unknown'}</p>
                                                        <p className="text-[10px] text-slate-500">{hiringManager?.role || 'Hiring Manager'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Approval Progress Card */}
                                    <div className="app-card border-slate-200 p-6 shadow-sm">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-white/40 mb-6">
                                            Approval Progress
                                        </h3>

                                        <div className="space-y-6">
                                            <div className="relative pl-8">
                                                <div className="absolute left-0 top-1 size-4 rounded-full bg-emerald-500 flex items-center justify-center">
                                                    <Check size={10} className="text-white" />
                                                </div>
                                                <div className="absolute left-2 top-6 w-0.5 h-10 bg-emerald-500/30"></div>
                                                <p className="text-sm font-bold text-primary dark:text-white">Requested</p>
                                                <p className="text-[10px] text-slate-500 dark:text-white/50">
                                                    {format(new Date(requirement.createdAt), 'MM/dd/yyyy')}
                                                </p>
                                            </div>

                                            <div className="relative pl-8">
                                                <div
                                                    className={clsx(
                                                        'absolute left-0 top-1 size-4 rounded-full border-2 flex items-center justify-center',
                                                        isPending
                                                            ? 'border-primary bg-primary dark:border-white dark:bg-white'
                                                            : !isPending
                                                              ? 'border-emerald-500 bg-emerald-500'
                                                              : 'border-slate-200 dark:border-white/20'
                                                    )}
                                                >
                                                    {!isPending && !isRejected && (
                                                        <Check size={10} className="text-white" />
                                                    )}
                                                    {isPending && (
                                                        <div className="size-1.5 rounded-full bg-white dark:bg-primary" />
                                                    )}
                                                </div>
                                                <div className="absolute left-2 top-6 w-0.5 h-10 bg-slate-200 dark:bg-white/10"></div>
                                                <p
                                                    className={clsx(
                                                        'text-sm font-bold',
                                                        isPending
                                                            ? 'text-primary dark:text-white'
                                                            : 'text-slate-500 dark:text-white/60'
                                                    )}
                                                >
                                                    Pending HR Decision
                                                </p>
                                                {isPending && (
                                                    <p className="text-[10px] text-slate-500 dark:text-white/50">
                                                        Current Step
                                                    </p>
                                                )}
                                            </div>

                                            <div className="relative pl-8">
                                                <div
                                                    className={clsx(
                                                        'absolute left-0 top-1 size-4 rounded-full border-2 flex items-center justify-center',
                                                        isLive
                                                            ? 'border-emerald-500 bg-emerald-500'
                                                            : isClosed
                                                              ? 'border-slate-400 bg-slate-400'
                                                              : 'border-slate-200 dark:border-white/20'
                                                    )}
                                                >
                                                    {isLive && (
                                                        <div className="size-1.5 rounded-full bg-white" />
                                                    )}
                                                </div>
                                                <p
                                                    className={clsx(
                                                        'text-sm font-bold',
                                                        isLive || isOnHold
                                                            ? 'text-primary dark:text-white'
                                                            : 'text-slate-500 dark:text-white/60'
                                                    )}
                                                >
                                                    {isClosed
                                                        ? 'Closed'
                                                        : isRejected
                                                          ? 'Rejected'
                                                          : isOnHold
                                                            ? 'On hold'
                                                            : 'Live on Job Board'}
                                                </p>
                                                {isLive ? (
                                                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                                                        Active
                                                    </p>
                                                ) : isOnHold ? (
                                                    <p className="text-[10px] text-orange-600 dark:text-orange-400">
                                                        Paused
                                                    </p>
                                                ) : (
                                                    <p className="text-[10px] text-slate-400 dark:text-white/30">
                                                        Upcoming
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'interview-plan' && id && (
                            <div className="app-card border-slate-200 p-8 shadow-sm max-w-3xl">
                                <InterviewPlanEditor
                                    requirementId={id}
                                    canEdit={canEditInterviewPlan}
                                />
                            </div>
                        )}

                        {/* Recruiter Assignment Tab */}
                        {activeTab === 'recruiters' && (
                            <div className="app-card border-slate-200 p-8 shadow-sm max-w-3xl">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-primary dark:text-white">Assigned Recruiters</h3>
                                    {isHr && (
                                        <div className="flex flex-col sm:flex-row gap-2 flex-1 max-w-md">
                                            <SearchableSelect
                                                value={selectedRecruiter}
                                                onChange={setSelectedRecruiter}
                                                options={recruiterOptions}
                                                placeholder="Select recruiter..."
                                                searchPlaceholder="Search recruiters..."
                                                className="flex-1"
                                            />
                                            <button
                                                onClick={() => selectedRecruiter && assignRecruiterMutation.mutate(selectedRecruiter)}
                                                disabled={!selectedRecruiter}
                                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold disabled:opacity-50 shrink-0"
                                            >
                                                Assign
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {requirement.recruiters?.length === 0 ? (
                                    <p className="text-slate-500 italic">No recruiters assigned yet.</p>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {requirement.recruiters?.map((rid) => {
                                            const recruiter = users.find((u) => u.uid === rid)
                                            return (
                                                <div
                                                    key={rid}
                                                    className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5"
                                                >
                                                    <div className="size-10 rounded-full bg-primary/10 dark:bg-white/10 flex items-center justify-center text-primary dark:text-white font-bold shrink-0">
                                                        {recruiter?.name?.[0] || '?'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-sm text-primary dark:text-white truncate">
                                                            {recruiter?.name || 'Unknown User'}
                                                        </p>
                                                        <p className="text-xs text-slate-500 truncate">
                                                            {recruiter?.email}
                                                        </p>
                                                    </div>
                                                    {isHr && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setRemoveRecruiterTarget({
                                                                    id: rid,
                                                                    name: recruiter?.name ?? 'this recruiter',
                                                                })
                                                            }
                                                            disabled={unassignRecruiterMutation.isPending}
                                                            className="shrink-0 p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                                                            aria-label={`Remove ${recruiter?.name ?? 'recruiter'}`}
                                                            title="Remove recruiter"
                                                        >
                                                            <UserMinus size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Timeline */}
                        {activeTab === 'timeline' && (
                            <div className="app-card border-slate-200 p-8 shadow-sm max-w-4xl">
                                <h3 className="text-lg font-bold text-primary dark:text-white">Timeline</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">
                                    Approvals, requirement edits, recruiter assignments, and portal visibility.
                                </p>
                                <RequirementTimeline requirement={requirement} users={users} />
                            </div>
                        )}

                        {/* Candidates Tab */}
                        {activeTab === 'candidates' && (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start max-w-6xl">
                                <section className="app-card border-slate-200 p-6 shadow-sm">
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <h3 className="text-lg font-bold text-primary dark:text-white">
                                            Matching profiles
                                        </h3>
                                        <div className="flex items-center gap-3">
                                            {suggestedMatches.length > CANDIDATES_PREVIEW_LIMIT && (
                                                <Link
                                                    to={`/requirements/${id}/matching-profiles`}
                                                    className="text-xs font-bold text-primary dark:text-white hover:underline"
                                                >
                                                    View all ({suggestedMatches.length})
                                                </Link>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => refetchMatches()}
                                                className="text-xs font-bold text-primary/70 dark:text-white/70 hover:underline"
                                            >
                                                Refresh
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-500 mb-4">
                                        Scores compare candidate skills and resumes to this job description. Link a match to add them to this requirement.
                                    </p>
                                    <div className="space-y-2 max-h-[min(60vh,480px)] overflow-y-auto custom-scrollbar">
                                        {matchingLoading ? (
                                            <p className="text-sm text-slate-500 italic py-2">Finding matches…</p>
                                        ) : suggestedMatches.length === 0 ? (
                                            <p className="text-sm text-slate-500 italic py-2">
                                                No strong matches yet. Add primary skills and a job description, or upload candidate resumes.
                                            </p>
                                        ) : (
                                            previewMatches.map((m) => (
                                                <div
                                                    key={m.candidateId}
                                                    className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10"
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <Link
                                                                to={`/candidates/${m.candidateId}`}
                                                                className="text-sm font-bold text-primary dark:text-white truncate block hover:underline"
                                                            >
                                                                {m.candidate.name}
                                                            </Link>
                                                            <p className="text-[10px] text-slate-500 truncate">{m.candidate.role}</p>
                                                        </div>
                                                        <span
                                                            className={clsx(
                                                                'shrink-0 px-2 py-0.5 rounded-md text-[10px] font-black',
                                                                m.matchScore >= 70
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : m.matchScore >= 40
                                                                      ? 'bg-amber-100 text-amber-800'
                                                                      : 'bg-slate-200 text-slate-600'
                                                            )}
                                                        >
                                                            {m.matchScore}%
                                                        </span>
                                                    </div>
                                                    {m.linkedToOther && (
                                                        <p className="text-[10px] text-amber-700 mt-1">Linked to another job</p>
                                                    )}
                                                    <button
                                                        type="button"
                                                        disabled={linkCandidateMutation.isPending}
                                                        onClick={() => linkCandidateMutation.mutate(m.candidateId)}
                                                        className="mt-2 text-[10px] font-bold text-primary dark:text-white hover:underline disabled:opacity-50"
                                                    >
                                                        Link to requirement
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </section>

                                <section className="app-card border-slate-200 p-6 shadow-sm">
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <h3 className="text-lg font-bold text-primary dark:text-white">
                                            Linked candidates ({candidates.length})
                                        </h3>
                                        <div className="flex items-center gap-3 flex-wrap justify-end">
                                            {candidates.length > CANDIDATES_PREVIEW_LIMIT && (
                                                <Link
                                                    to={`/requirements/${id}/linked-candidates`}
                                                    className="text-xs font-bold text-primary dark:text-white hover:underline"
                                                >
                                                    View all ({candidates.length})
                                                </Link>
                                            )}
                                            <Link
                                                to={`/candidates/new?requirementId=${id}`}
                                                className="text-xs font-bold text-primary dark:text-white hover:underline"
                                            >
                                                Add
                                            </Link>
                                            <Link
                                                to={`/pipeline/${id}`}
                                                className="text-xs font-bold text-primary/60 dark:text-white/60 hover:underline"
                                            >
                                                Pipeline
                                            </Link>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-500 mb-4">
                                        Candidates currently assigned to this requirement.
                                    </p>
                                    <ListSearchBar
                                        value={candidateSearch}
                                        onChange={setCandidateSearch}
                                        placeholder="Search linked candidates..."
                                        className="max-w-none mb-4"
                                    />
                                    <div className="space-y-2 max-h-[min(60vh,480px)] overflow-y-auto custom-scrollbar">
                                        {filteredCandidates.length === 0 ? (
                                            <p className="text-sm text-slate-500 italic py-2">
                                                {candidateSearch.trim()
                                                    ? 'No candidates match your search.'
                                                    : 'No candidates linked to this requirement yet.'}
                                            </p>
                                        ) : (
                                            previewLinked.map((c) => (
                                                <Link
                                                    key={c.id}
                                                    to={`/candidates/${c.id}`}
                                                    className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-primary/5 dark:hover:bg-white/10 transition-colors"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-primary dark:text-white truncate">
                                                            {c.name}
                                                        </p>
                                                        <p className="text-[10px] text-slate-500 truncate">{c.role}</p>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                                        {c.matchScore > 0 && (
                                                            <span
                                                                className={clsx(
                                                                    'px-2 py-0.5 rounded-md text-[10px] font-black',
                                                                    c.matchScore >= 70
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : c.matchScore >= 40
                                                                          ? 'bg-amber-100 text-amber-800'
                                                                          : 'bg-slate-200 text-slate-600'
                                                                )}
                                                            >
                                                                {Math.round(c.matchScore)}%
                                                            </span>
                                                        )}
                                                        <span className="text-[10px] font-bold uppercase text-slate-400">
                                                            {c.status}
                                                        </span>
                                                    </div>
                                                </Link>
                                            ))
                                        )}
                                    </div>
                                </section>
                            </div>
                        )}

                </TabContent>
            </div>

            <RequirementApprovalModal
                open={approvalModal !== null}
                action={approvalModal?.action ?? 'APPROVE'}
                requirementTitle={requirement.title}
                requiresHrHeadDelegation={adminMustDelegate}
                isPending={approveMutation.isPending || rejectMutation.isPending}
                onClose={() => setApprovalModal(null)}
                onConfirm={confirmApprovalModal}
            />

            <ConfirmModal
                open={removeRecruiterTarget !== null}
                title="Remove recruiter"
                message={
                    removeRecruiterTarget
                        ? `Remove ${removeRecruiterTarget.name} from this requirement? They will no longer be assigned to this job.`
                        : ''
                }
                confirmLabel="Remove"
                variant="danger"
                isPending={unassignRecruiterMutation.isPending}
                onClose={() => setRemoveRecruiterTarget(null)}
                onConfirm={() => {
                    if (removeRecruiterTarget) {
                        unassignRecruiterMutation.mutate(removeRecruiterTarget.id)
                    }
                }}
            />
        </div>
    )
}

export default RequirementDetail
