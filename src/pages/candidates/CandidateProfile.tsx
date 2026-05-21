import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
    Mail, Share2, Edit2, MapPin, Calendar,
    Briefcase, CheckCircle,
    FileText, Brain, Sparkles, MessageSquare,
    CalendarCheck, UserX, Download, ChevronRight, Trash2,
    Linkedin, Phone, Globe
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../services/api'
import { ApiError } from '../../lib/apiClient'
import clsx from 'clsx'
import { useToastStore } from '../../store/toastStore'
import { Candidate, ActivityLog } from '../../types'
import { motion, AnimatePresence } from 'framer-motion'

const INPUT =
    'w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none'
const LABEL = 'block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1'

const ACTION_LABELS: Record<string, string> = {
    CREATED: 'Candidate created',
    UPDATED: 'Profile updated',
    STATUS_CHANGED: 'Stage changed',
    RESUME_UPLOADED: 'Resume uploaded',
}

function formatActivityDetails(log: ActivityLog): string | null {
    const d = log.details
    if (!d) return null
    if (typeof d === 'string') return d
    if (log.action === 'STATUS_CHANGED' && d.newStatus) return `New stage: ${d.newStatus}`
    if (log.action === 'RESUME_UPLOADED' && d.fileName) return `File: ${d.fileName}`
    if (Array.isArray(d)) return d.join(', ')
    if (typeof d === 'object') {
        return Object.entries(d)
            .map(([k, v]) => `${k}: ${v}`)
            .join(' · ')
    }
    return null
}

const CandidateProfile = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()
    const { addToast } = useToastStore()
    const queryClient = useQueryClient()

    const [activeTab, setActiveTab] = useState('parsed')
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isMoveStageOpen, setIsMoveStageOpen] = useState(false)
    const [resumeBlobUrl, setResumeBlobUrl] = useState<string | null>(null)
    const [resumeLoading, setResumeLoading] = useState(false)
    const [isUploadingResume, setIsUploadingResume] = useState(false)
    const [editData, setEditData] = useState<Candidate | null>(null)

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
        enabled: !!id,
    })

    const { data: activityLogs = [], isLoading: activityLoading } = useQuery({
        queryKey: ['candidate-activity', id],
        queryFn: () => api.activityLogs.getByEntity(id!),
        enabled: !!id,
    })

    React.useEffect(() => {
        if (candidate && !isEditing) setEditData(candidate)
    }, [candidate, isEditing])

    const hasResume = !!(candidate?.hasResume || candidate?.resumeFileName)
    const isPdfResume =
        candidate?.resumeMimeType === 'application/pdf' ||
        candidate?.resumeFileName?.toLowerCase().endsWith('.pdf')

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
    const isAdmin = user?.role === 'ADMIN'

    const handleDeleteProfile = async () => {
        if (!id || !candidate) return
        if (
            !confirm(
                `Permanently delete ${candidate.name}? All interviews, offers, and feedback for this candidate will be removed.`
            )
        ) {
            return
        }
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
        setEditData({ ...candidate })
        setIsEditing(true)
    }

    const cancelEditing = () => {
        if (candidate) setEditData(candidate)
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

        setIsSaving(true)
        try {
            await api.candidates.update(candidate.id, {
                name: editData.name.trim(),
                email: editData.email.trim(),
                phone: editData.phone?.trim() || undefined,
                location: editData.location?.trim() || undefined,
                source: editData.source,
                requirementId: editData.requirementId || undefined,
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
            setIsEditing(false)
        } catch (err) {
            console.error('Save failed', err)
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
            console.error('Resume upload failed', err)
            const msg = err instanceof ApiError ? err.message : 'Failed to upload resume'
            addToast(msg, 'error')
        } finally {
            setIsUploadingResume(false)
        }
    }

    const handleMoveStage = async (newStage: string) => {
        if (!candidate) return
        try {
            await api.candidates.updateStatus(candidate.id, newStage as Candidate['status'])
            addToast(`Moved to ${newStage}`, 'success')
            await queryClient.invalidateQueries({ queryKey: ['candidate', id] })
            await queryClient.invalidateQueries({ queryKey: ['candidates'] })
            await queryClient.invalidateQueries({ queryKey: ['candidate-activity', id] })
            setIsMoveStageOpen(false)
        } catch (err) {
            console.error('Move stage failed', err)
            const msg = err instanceof ApiError ? err.message : 'Failed to move stage'
            addToast(msg, 'error')
        }
    }

    if (isLoading) {
        return <div className="p-12 text-center text-slate-500">Loading profile...</div>
    }

    if (isError || !candidate) {
        return (
            <div className="p-12 text-center space-y-4">
                <p className="text-slate-600 font-medium">
                    {error instanceof ApiError ? error.message : 'Could not load candidate profile.'}
                </p>
                <p className="text-sm text-slate-400">Make sure the API server is running on port 4000.</p>
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={() => refetch()}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold"
                    >
                        Retry
                    </button>
                    <Link to="/candidates" className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-700">
                        Back to candidates
                    </Link>
                </div>
            </div>
        )
    }

    const displayData = isEditing && editData ? editData : candidate

    const Field = ({
        label,
        children,
    }: {
        label: string
        children: React.ReactNode
    }) => (
        <div>
            <label className={LABEL}>{label}</label>
            {children}
        </div>
    )

    return (
        <div className="max-w-[1440px] mx-auto w-full">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-6 font-medium">
                <Link to="/candidates" className="hover:text-primary transition-colors">Candidates</Link>
                <ChevronRight size={14} />
                <span className="text-slate-900">{candidate.name}</span>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1 flex flex-col gap-6">
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                            <div className="flex gap-5 items-start w-full min-w-0">
                                <div className="size-20 rounded-full border-4 border-slate-50 bg-slate-100 flex items-center justify-center text-slate-300 shrink-0">
                                    <span className="material-symbols-outlined text-3xl">person</span>
                                </div>

                                {isEditing && editData ? (
                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                                        <Field label="Full name">
                                            <input
                                                className={INPUT}
                                                value={editData.name}
                                                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                            />
                                        </Field>
                                        <Field label="Role / job title">
                                            <input className={clsx(INPUT, 'bg-slate-50 text-slate-500')} value={editData.role} disabled />
                                        </Field>
                                        <Field label="Email">
                                            <input
                                                className={INPUT}
                                                type="email"
                                                value={editData.email}
                                                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                            />
                                        </Field>
                                        <Field label="Phone">
                                            <input
                                                className={INPUT}
                                                value={editData.phone || ''}
                                                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                            />
                                        </Field>
                                        <Field label="Location">
                                            <input
                                                className={INPUT}
                                                value={editData.location || ''}
                                                onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                                                placeholder="City, country"
                                            />
                                        </Field>
                                        <Field label="Source">
                                            <select
                                                className={INPUT}
                                                value={editData.source || ''}
                                                onChange={(e) => setEditData({ ...editData, source: e.target.value })}
                                            >
                                                <option value="Direct Application">Direct Application</option>
                                                <option value="LinkedIn">LinkedIn</option>
                                                <option value="Referral">Referral</option>
                                                <option value="Agency">Agency</option>
                                                <option value="Recruiter Added">Recruiter Added</option>
                                            </select>
                                        </Field>
                                    </div>
                                ) : (
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h1 className="text-2xl font-bold text-slate-900">{displayData.name}</h1>
                                            <span
                                                className={clsx(
                                                    'px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider',
                                                    displayData.status === 'HIRED'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : displayData.status === 'REJECTED'
                                                          ? 'bg-rose-100 text-rose-700'
                                                          : 'bg-blue-100 text-blue-700'
                                                )}
                                            >
                                                {displayData.status}
                                            </span>
                                        </div>
                                        <p className="text-slate-600 font-medium mt-1">{displayData.role}</p>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-slate-500">
                                            {displayData.location && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin size={14} /> {displayData.location}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <Mail size={14} /> {displayData.email}
                                            </span>
                                            {displayData.phone && (
                                                <span className="flex items-center gap-1">
                                                    <Phone size={14} /> {displayData.phone}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <Calendar size={14} /> Applied{' '}
                                                {new Date(displayData.appliedDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 shrink-0">
                                {isEditing ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={cancelEditing}
                                            disabled={isSaving}
                                            className="h-10 px-4 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            className="h-10 px-4 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
                                        >
                                            {isSaving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            className="h-10 px-4 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 flex items-center gap-2"
                                        >
                                            <Share2 size={18} /> Share
                                        </button>
                                        {canEdit && (
                                            <button
                                                type="button"
                                                onClick={startEditing}
                                                className="h-10 px-4 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 flex items-center gap-2"
                                            >
                                                <Edit2 size={18} /> Edit Profile
                                            </button>
                                        )}
                                        {isAdmin && (
                                            <button
                                                type="button"
                                                onClick={handleDeleteProfile}
                                                className="h-10 px-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 flex items-center gap-2"
                                            >
                                                <Trash2 size={18} /> Delete profile
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-100">
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Experience</p>
                                <p className="text-xl font-bold text-slate-900 mt-1">{displayData.totalExperience || 'N/A'}</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Company</p>
                                <p className="text-xl font-bold text-slate-900 mt-1 truncate" title={displayData.currentCompany}>
                                    {displayData.currentCompany || '—'}
                                </p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Notice Period</p>
                                <p className="text-xl font-bold text-slate-900 mt-1">{displayData.noticePeriod || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex-1 min-h-[500px]">
                        <div className="border-b border-slate-200 bg-slate-50/50 px-6">
                            <div className="flex gap-8 overflow-x-auto no-scrollbar">
                                {[
                                    { id: 'parsed', label: 'Professional' },
                                    { id: 'resume', label: 'Resume' },
                                    { id: 'activity', label: 'Activity' },
                                    { id: 'details', label: 'Details' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className={clsx(
                                            'py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-colors',
                                            activeTab === tab.id
                                                ? 'border-primary text-primary'
                                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                        )}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-6">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab + (isEditing ? '-edit' : '')}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {activeTab === 'parsed' && (
                                        <div className="space-y-6">
                                            {isEditing && editData ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    <Field label="Total experience">
                                                        <input
                                                            className={INPUT}
                                                            value={editData.totalExperience || ''}
                                                            onChange={(e) =>
                                                                setEditData({ ...editData, totalExperience: e.target.value })
                                                            }
                                                            placeholder="e.g. 5 years"
                                                        />
                                                    </Field>
                                                    <Field label="Current company">
                                                        <input
                                                            className={INPUT}
                                                            value={editData.currentCompany || ''}
                                                            onChange={(e) =>
                                                                setEditData({ ...editData, currentCompany: e.target.value })
                                                            }
                                                        />
                                                    </Field>
                                                    <Field label="Current CTC">
                                                        <input
                                                            className={INPUT}
                                                            value={editData.currentCTC || ''}
                                                            onChange={(e) =>
                                                                setEditData({ ...editData, currentCTC: e.target.value })
                                                            }
                                                        />
                                                    </Field>
                                                    <Field label="Expected CTC">
                                                        <input
                                                            className={INPUT}
                                                            value={editData.expectedCTC || ''}
                                                            onChange={(e) =>
                                                                setEditData({ ...editData, expectedCTC: e.target.value })
                                                            }
                                                        />
                                                    </Field>
                                                    <Field label="Notice period">
                                                        <input
                                                            className={INPUT}
                                                            value={editData.noticePeriod || ''}
                                                            onChange={(e) =>
                                                                setEditData({ ...editData, noticePeriod: e.target.value })
                                                            }
                                                        />
                                                    </Field>
                                                    <Field label="LinkedIn URL">
                                                        <input
                                                            className={INPUT}
                                                            value={editData.linkedIn || ''}
                                                            onChange={(e) =>
                                                                setEditData({ ...editData, linkedIn: e.target.value })
                                                            }
                                                            placeholder="https://linkedin.com/in/..."
                                                        />
                                                    </Field>
                                                    <Field label="Portfolio URL">
                                                        <input
                                                            className={INPUT}
                                                            value={editData.portfolio || ''}
                                                            onChange={(e) =>
                                                                setEditData({ ...editData, portfolio: e.target.value })
                                                            }
                                                            placeholder="https://..."
                                                        />
                                                    </Field>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    {[
                                                        ['Current Company', displayData.currentCompany],
                                                        ['Total Experience', displayData.totalExperience],
                                                        ['Role', displayData.role],
                                                        ['Current CTC', displayData.currentCTC],
                                                        ['Expected CTC', displayData.expectedCTC],
                                                        ['Notice Period', displayData.noticePeriod],
                                                        ['Source', displayData.source],
                                                    ].map(([label, value]) => (
                                                        <div key={label as string} className="space-y-1">
                                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                                {label}
                                                            </p>
                                                            <p className="font-bold text-slate-700">{(value as string) || 'N/A'}</p>
                                                        </div>
                                                    ))}
                                                    {displayData.linkedIn && (
                                                        <div className="space-y-1 sm:col-span-2">
                                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                                LinkedIn
                                                            </p>
                                                            <a
                                                                href={displayData.linkedIn}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-primary hover:underline flex items-center gap-1 font-bold text-sm"
                                                            >
                                                                <Linkedin size={14} /> {displayData.linkedIn}
                                                            </a>
                                                        </div>
                                                    )}
                                                    {displayData.portfolio && (
                                                        <div className="space-y-1 sm:col-span-2">
                                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                                Portfolio
                                                            </p>
                                                            <a
                                                                href={displayData.portfolio}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-primary hover:underline flex items-center gap-1 font-bold text-sm"
                                                            >
                                                                <Globe size={14} /> {displayData.portfolio}
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {isEditing && (
                                                <p className="text-xs text-slate-500">
                                                    Click <strong>Save Changes</strong> at the top to save professional details.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'resume' && (
                                        <div className="flex flex-col gap-4">
                                            {canEdit && (
                                                <div className="p-4 border border-dashed border-slate-300 rounded-lg bg-slate-50">
                                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                                        {hasResume ? 'Replace resume' : 'Upload resume'}
                                                    </label>
                                                    <input
                                                        type="file"
                                                        accept=".pdf,.doc,.docx"
                                                        disabled={isUploadingResume}
                                                        className="w-full text-sm disabled:opacity-50"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0]
                                                            if (file) handleResumeUpload(file)
                                                            e.target.value = ''
                                                        }}
                                                    />
                                                    <p className="mt-2 text-xs text-slate-500">
                                                        PDF, DOC, or DOCX · max 5 MB · uploads immediately
                                                    </p>
                                                </div>
                                            )}

                                            {resumeLoading ? (
                                                <p className="py-12 text-center text-slate-500">Loading resume...</p>
                                            ) : hasResume ? (
                                                <div className="min-h-[500px] border border-slate-200 rounded-lg overflow-hidden flex flex-col bg-slate-50">
                                                    <div className="p-3 border-b bg-white flex justify-between items-center gap-4">
                                                        <span className="text-sm font-bold text-slate-700 flex items-center gap-2 truncate">
                                                            <FileText size={16} />
                                                            {candidate.resumeFileName}
                                                        </span>
                                                        {resumeBlobUrl && (
                                                            <a
                                                                href={resumeBlobUrl}
                                                                download={candidate.resumeFileName || 'resume'}
                                                                className="text-primary font-bold text-sm flex items-center gap-1 shrink-0"
                                                            >
                                                                <Download size={16} /> Download
                                                            </a>
                                                        )}
                                                    </div>
                                                    {isPdfResume && resumeBlobUrl ? (
                                                        <iframe
                                                            src={resumeBlobUrl}
                                                            className="w-full flex-1 min-h-[480px] bg-white"
                                                            title="Resume preview"
                                                        />
                                                    ) : (
                                                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                                                            <FileText className="text-slate-300 mb-4" size={48} />
                                                            <p className="font-bold text-slate-900">Preview not available for Word files</p>
                                                            {resumeBlobUrl && (
                                                                <a
                                                                    href={resumeBlobUrl}
                                                                    download={candidate.resumeFileName || 'resume'}
                                                                    className="mt-4 px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm"
                                                                >
                                                                    Download resume
                                                                </a>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
                                                    <FileText className="mx-auto text-slate-300 mb-4" size={48} />
                                                    <p className="font-bold text-slate-900">No resume uploaded yet</p>
                                                    <p className="text-slate-500 text-sm mt-1">
                                                        {canEdit
                                                            ? 'Use the file picker above to upload a resume.'
                                                            : 'No resume on file for this candidate.'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'activity' && (
                                        <div className="space-y-6">
                                            {interviews.length > 0 && (
                                                <section>
                                                    <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                                                        <CalendarCheck size={16} className="text-primary" />
                                                        Interviews ({interviews.length})
                                                    </h3>
                                                    <ul className="space-y-2">
                                                        {interviews.map((iv) => (
                                                            <li
                                                                key={iv.id}
                                                                className="p-3 rounded-lg border border-slate-100 bg-slate-50 text-sm"
                                                            >
                                                                <span className="font-bold text-slate-800">{iv.type}</span>
                                                                <span className="text-slate-500"> · {iv.status}</span>
                                                                <span className="block text-slate-500 text-xs mt-1">
                                                                    {new Date(iv.scheduledAt).toLocaleString()}
                                                                </span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </section>
                                            )}

                                            <section>
                                                <h3 className="text-sm font-bold text-slate-900 mb-3">Timeline</h3>
                                                {activityLoading ? (
                                                    <p className="text-slate-500 text-sm">Loading activity...</p>
                                                ) : activityLogs.length === 0 ? (
                                                    <p className="text-slate-500 text-sm py-8 text-center border border-dashed border-slate-200 rounded-lg">
                                                        No activity recorded yet for this candidate.
                                                    </p>
                                                ) : (
                                                    <ul className="space-y-3">
                                                        {activityLogs.map((log) => {
                                                            const detail = formatActivityDetails(log)
                                                            return (
                                                                <li
                                                                    key={log.id}
                                                                    className="flex gap-4 p-4 rounded-lg border border-slate-100 bg-white"
                                                                >
                                                                    <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                                        <Briefcase size={16} className="text-primary" />
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="font-bold text-slate-900 text-sm">
                                                                            {ACTION_LABELS[log.action] || log.action}
                                                                        </p>
                                                                        {detail && (
                                                                            <p className="text-xs text-slate-500 mt-0.5">{detail}</p>
                                                                        )}
                                                                        <p className="text-xs text-slate-400 mt-1">
                                                                            {new Date(log.timestamp).toLocaleString()}
                                                                            {log.performerName ? ` · ${log.performerName}` : ''}
                                                                        </p>
                                                                    </div>
                                                                </li>
                                                            )
                                                        })}
                                                    </ul>
                                                )}
                                            </section>
                                        </div>
                                    )}

                                    {activeTab === 'details' && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="space-y-1">
                                                <p className={LABEL.replace('mb-1', '')}>Email</p>
                                                <p className="font-medium text-slate-800">{displayData.email}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className={LABEL.replace('mb-1', '')}>Phone</p>
                                                <p className="font-medium text-slate-800">{displayData.phone || '—'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className={LABEL.replace('mb-1', '')}>Source</p>
                                                <p className="font-medium text-slate-800">{displayData.source || '—'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className={LABEL.replace('mb-1', '')}>Match score</p>
                                                <p className="font-medium text-slate-800">{displayData.matchScore ?? 0}%</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className={LABEL.replace('mb-1', '')}>Job title</p>
                                                <p className="font-medium text-slate-800">{displayData.jobTitle || displayData.role}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className={LABEL.replace('mb-1', '')}>Applied</p>
                                                <p className="font-medium text-slate-800">
                                                    {new Date(displayData.appliedDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                            {displayData.reqId && (
                                                <div className="space-y-1">
                                                    <p className={LABEL.replace('mb-1', '')}>Req ID</p>
                                                    <p className="font-mono font-bold text-slate-800">{displayData.reqId}</p>
                                                </div>
                                            )}
                                            {displayData.client && (
                                                <div className="space-y-1">
                                                    <p className={LABEL.replace('mb-1', '')}>Client</p>
                                                    <p className="font-medium text-slate-800">{displayData.client}</p>
                                                </div>
                                            )}
                                            {(displayData.recruiterName || displayData.source === 'Candidate Portal') && (
                                                <div className="space-y-1">
                                                    <p className={LABEL.replace('mb-1', '')}>Recruiter</p>
                                                    <p className="font-medium text-slate-800">
                                                        {displayData.recruiterName ?? 'Self-applied (portal)'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                <aside className="w-full lg:w-[380px] flex flex-col gap-6">
                    <div className="bg-primary text-white rounded-xl p-6 shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles className="text-emerald-400" size={20} />
                                <h3 className="text-lg font-bold">AI Match Insight</h3>
                            </div>
                            <p className="text-white/70 text-sm">
                                {hasResume
                                    ? 'Resume on file — parsing can be added in a future release.'
                                    : 'Upload a resume to enable future AI matching.'}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm sticky top-6">
                        <h3 className="font-bold text-slate-900 mb-4">Manage Candidate</h3>

                        {canEdit ? (
                            <div className="flex flex-col gap-3">
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setIsMoveStageOpen(!isMoveStageOpen)}
                                        className="w-full h-11 bg-primary text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2"
                                    >
                                        <CalendarCheck size={18} />
                                        Move Stage ({displayData.status})
                                    </button>
                                    {isMoveStageOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                                            {['SOURCED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'].map(
                                                (status) => (
                                                    <button
                                                        key={status}
                                                        type="button"
                                                        disabled={status === displayData.status}
                                                        onClick={() => handleMoveStage(status)}
                                                        className={clsx(
                                                            'w-full text-left px-4 py-3 text-xs font-bold border-b last:border-0 border-slate-50',
                                                            status === displayData.status
                                                                ? 'bg-primary/5 text-primary'
                                                                : 'hover:bg-slate-50 text-slate-700'
                                                        )}
                                                    >
                                                        {status}
                                                        {status === displayData.status && (
                                                            <CheckCircle size={14} className="inline ml-2" />
                                                        )}
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleMoveStage('REJECTED')}
                                    className="w-full h-11 border border-rose-200 text-rose-600 rounded-lg font-bold text-sm hover:bg-rose-50 flex items-center justify-center gap-2"
                                >
                                    <UserX size={18} />
                                    Reject Candidate
                                </button>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500 text-center py-4">Read-only access</p>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    )
}

export default CandidateProfile
