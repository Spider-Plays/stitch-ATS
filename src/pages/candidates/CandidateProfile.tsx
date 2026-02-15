import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
    ArrowLeft, Mail, Share2, Edit2, MapPin, Calendar,
    Briefcase, GraduationCap, Clock, CheckCircle,
    FileText, Brain, Sparkles, MessageSquare,
    CalendarCheck, UserX, Download, ChevronRight,
    MoreHorizontal, Phone, Linkedin, Globe
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../services/api'
import clsx from 'clsx'
import { useToastStore } from '../../store/toastStore'
import { CandidateStatus } from '../../types'
import { motion, AnimatePresence } from 'framer-motion'

const CandidateProfile = () => {
    const { id } = useParams<{ id: string }>()
    const { user } = useAuth()
    const { addToast } = useToastStore()
    const queryClient = useQueryClient()

    // UI States
    const [activeTab, setActiveTab] = useState('parsed')
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isMoveStageOpen, setIsMoveStageOpen] = useState(false)

    // Data Fetching
    const { data: candidate, isLoading } = useQuery({
        queryKey: ['candidate', id],
        queryFn: () => api.candidates.get(id!),
        enabled: !!id
    })

    const { data: interviews = [] } = useQuery({
        queryKey: ['candidate-interviews', id],
        queryFn: () => api.interviews.getByCandidateId(id!),
        enabled: !!id
    })

    const [editData, setEditData] = useState<any>(null)

    // Initialize edit data
    React.useEffect(() => {
        if (candidate) setEditData(candidate)
    }, [candidate])

    // Permissions
    const canEdit = user?.role === 'RECRUITER' || user?.role === 'TEAM_LEAD' || user?.role === 'ADMIN'
    const isHiringManager = user?.role === 'HIRING_MANAGER'

    // Actions
    const handleSave = async () => {
        setIsSaving(true)
        try {
            // Update Details
            const updatePayload = {
                name: editData.name,
                email: editData.email,
                phone: editData.phone,
                source: editData.source,
                requirementId: editData.requirementId,
                resumeUrl: editData.resumeUrl || '',
                totalExperience: editData.totalExperience,
                currentCompany: editData.currentCompany,
                currentCTC: editData.currentCTC,
                expectedCTC: editData.expectedCTC,
                noticePeriod: editData.noticePeriod,
                linkedIn: editData.linkedIn,
                updatedAt: new Date().toISOString()
            }

            await api.candidates.update(candidate!.id, updatePayload)
            addToast('Profile details updated', 'success')

            // Clear UI Blocking State Immediately
            queryClient.invalidateQueries({ queryKey: ['candidate', id] })
            setIsEditing(false)
            setIsSaving(false)
        } catch (error) {
            console.error("Save failed", error)
            addToast('Failed to update profile', 'error')
            setIsSaving(false)
        }
    }

    const handleMoveStage = async (newStage: string) => {
        if (!candidate) return
        try {
            await api.candidates.updateStatus(candidate.id, newStage as any)
            addToast(`Moved to ${newStage}`, 'success')
            queryClient.invalidateQueries({ queryKey: ['candidate', id] })
            queryClient.invalidateQueries({ queryKey: ['candidates'] })
            setIsMoveStageOpen(false)
        } catch (error) {
            console.error("Move stage failed", error)
            addToast('Failed to move stage', 'error')
        }
    }

    if (isLoading || !candidate) return <div className="p-12 text-center text-slate-500">Loading profile...</div>

    const displayData = isEditing ? editData : candidate

    return (
        <div className="max-w-[1440px] mx-auto w-full">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-6 font-medium">
                <Link to="/candidates" className="hover:text-primary transition-colors">Candidates</Link>
                <ChevronRight size={14} />
                <span className="text-slate-900">{candidate.name}</span>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Main Content Area */}
                <div className="flex-1 flex flex-col gap-6">

                    {/* Profile Header Card */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="flex gap-5 items-center w-full">
                                <div className="size-24 rounded-full border-4 border-slate-50 bg-slate-100 flex items-center justify-center text-slate-300 overflow-hidden shadow-sm shrink-0">
                                    {displayData.avatar ? (
                                        <img src={displayData.avatar} alt={displayData.name} className="size-full object-cover" />
                                    ) : (
                                        <span className="material-symbols-outlined text-4xl">person</span>
                                    )}
                                </div>

                                {isEditing ? (
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input
                                            className="form-input rounded-lg border-slate-300 text-sm font-bold"
                                            value={editData.name}
                                            onChange={e => setEditData({ ...editData, name: e.target.value })}
                                            placeholder="Full Name"
                                        />
                                        <input
                                            className="form-input rounded-lg border-slate-300 text-sm"
                                            value={editData.role}
                                            disabled // Role shouldn't be edited here typically, or maybe it should but keeping conservative as per previous requirement
                                            title="Role cannot be edited directly"
                                            placeholder="Role"
                                        />
                                        <input
                                            className="form-input rounded-lg border-slate-300 text-sm"
                                            value={editData.email}
                                            onChange={e => setEditData({ ...editData, email: e.target.value })}
                                            placeholder="Email"
                                        />
                                        <input
                                            className="form-input rounded-lg border-slate-300 text-sm"
                                            value={editData.phone || ''}
                                            onChange={e => setEditData({ ...editData, phone: e.target.value })}
                                            placeholder="Phone"
                                        />
                                        <input
                                            className="form-input rounded-lg border-slate-300 text-sm"
                                            value={editData.totalExperience || ''}
                                            onChange={e => setEditData({ ...editData, totalExperience: e.target.value })}
                                            placeholder="Total Experience"
                                        />
                                        <input
                                            className="form-input rounded-lg border-slate-300 text-sm"
                                            value={editData.currentCompany || ''}
                                            onChange={e => setEditData({ ...editData, currentCompany: e.target.value })}
                                            placeholder="Current Company"
                                        />
                                        <input
                                            className="form-input rounded-lg border-slate-300 text-sm"
                                            value={editData.currentCTC || ''}
                                            onChange={e => setEditData({ ...editData, currentCTC: e.target.value })}
                                            placeholder="Current CTC"
                                        />
                                        <input
                                            className="form-input rounded-lg border-slate-300 text-sm"
                                            value={editData.expectedCTC || ''}
                                            onChange={e => setEditData({ ...editData, expectedCTC: e.target.value })}
                                            placeholder="Expected CTC"
                                        />
                                        <input
                                            className="form-input rounded-lg border-slate-300 text-sm"
                                            value={editData.noticePeriod || ''}
                                            onChange={e => setEditData({ ...editData, noticePeriod: e.target.value })}
                                            placeholder="Notice Period"
                                        />
                                        <input
                                            className="form-input rounded-lg border-slate-300 text-sm"
                                            value={editData.linkedIn || ''}
                                            onChange={e => setEditData({ ...editData, linkedIn: e.target.value })}
                                            placeholder="LinkedIn URL"
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h1 className="text-2xl font-bold text-slate-900">{displayData.name}</h1>
                                            <span className={clsx(
                                                "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider",
                                                displayData.status === 'HIRED' ? "bg-emerald-100 text-emerald-700" :
                                                    displayData.status === 'REJECTED' ? "bg-rose-100 text-rose-700" :
                                                        "bg-blue-100 text-blue-700"
                                            )}>
                                                {displayData.status}
                                            </span>
                                        </div>
                                        <p className="text-slate-600 font-medium">{displayData.role}</p>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-slate-500">
                                            {displayData.location && (
                                                <div className="flex items-center gap-1">
                                                    <MapPin size={14} /> {displayData.location}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1">
                                                <Mail size={14} /> {displayData.email}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar size={14} /> Applied {new Date(displayData.appliedDate).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 w-full md:w-auto shrink-0">
                                {isEditing ? (
                                    <>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="h-10 px-4 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            className="h-10 px-4 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-2"
                                        >
                                            {isSaving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button className="h-10 px-4 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                                            <Share2 size={18} /> Share
                                        </button>
                                        {canEdit && (
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="h-10 px-4 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                            >
                                                <Edit2 size={18} /> Edit Profile
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Stats Strip */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-100">
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Experience</p>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <p className="text-xl font-bold text-slate-900">{displayData.totalExperience || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Company</p>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <p className="text-xl font-bold text-slate-900 truncate max-w-full" title={displayData.currentCompany}>
                                        {displayData.currentCompany || '--'}
                                    </p>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Notice Period</p>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <p className="text-xl font-bold text-slate-900">{displayData.noticePeriod || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs Section */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex-1 min-h-[500px]">
                        <div className="border-b border-slate-200 bg-slate-50/50 px-6">
                            <div className="flex gap-8 overflow-x-auto no-scrollbar">
                                {[
                                    { id: 'parsed', label: 'Parsed Data' },
                                    { id: 'resume', label: 'Original Resume' },
                                    { id: 'activity', label: 'Activity Timeline' },
                                    { id: 'skills', label: 'Skills' }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={clsx(
                                            "py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-colors",
                                            activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700"
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
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                >
                                    {activeTab === 'parsed' && (
                                        <div className="space-y-8">
                                            <section>
                                                <div className="flex items-center gap-2 mb-6">
                                                    <Briefcase className="text-primary" size={20} />
                                                    <h3 className="text-lg font-bold text-slate-900">Professional Summary</h3>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Company</p>
                                                        <p className="font-bold text-slate-700">{displayData.currentCompany || 'N/A'}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Experience</p>
                                                        <p className="font-bold text-slate-700">{displayData.totalExperience || 'N/A'}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Role</p>
                                                        <p className="font-bold text-slate-700">{displayData.role || 'N/A'}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current CTC</p>
                                                        <p className="font-bold text-emerald-600">{displayData.currentCTC || 'N/A'}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Expected CTC</p>
                                                        <p className="font-bold text-primary">{displayData.expectedCTC || 'N/A'}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Notice Period</p>
                                                        <p className="font-bold text-slate-700">{displayData.noticePeriod || 'N/A'}</p>
                                                    </div>
                                                    {displayData.linkedIn && (
                                                        <div className="space-y-1 col-span-full">
                                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">LinkedIn Profile</p>
                                                            <a href={displayData.linkedIn} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1 font-bold">
                                                                <Linkedin size={14} /> {displayData.linkedIn}
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            </section>
                                        </div>
                                    )}

                                    {activeTab === 'resume' && (
                                        <div className="h-full flex flex-col gap-4">
                                            {isEditing && (
                                                <div className="p-4 border border-dashed border-slate-300 rounded-lg bg-slate-50">
                                                    <label className="block text-sm font-bold text-slate-700 mb-2">Resume URL</label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                                            <Globe size={16} />
                                                        </span>
                                                        <input
                                                            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary"
                                                            value={editData.resumeUrl || ''}
                                                            onChange={e => setEditData({ ...editData, resumeUrl: e.target.value })}
                                                            placeholder="https://example.com/resume.pdf"
                                                        />
                                                    </div>
                                                    <p className="mt-2 text-xs text-slate-500">Enter a direct link to the candidate's resume (Google Drive, Dropbox, etc.)</p>
                                                </div>
                                            )}

                                            {displayData.resumeUrl ? (
                                                <div className="flex-1 h-[600px] bg-slate-50 border border-slate-200 rounded-lg overflow-hidden flex flex-col">
                                                    <div className="p-3 border-b border-slate-200 bg-white flex justify-between items-center">
                                                        <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                            <FileText size={16} /> Resume Preview
                                                        </span>
                                                        <a href={displayData.resumeUrl} target="_blank" rel="noreferrer" className="text-primary hover:text-primary/80 flex items-center gap-1 font-bold text-sm">
                                                            <Download size={16} /> Open Link
                                                        </a>
                                                    </div>
                                                    <iframe src={displayData.resumeUrl} className="w-full h-full" title="Resume" />
                                                </div>
                                            ) : (
                                                <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
                                                    <FileText className="mx-auto text-slate-300 mb-4" size={48} />
                                                    <h3 className="text-lg font-bold text-slate-900">No Resume Link Provided</h3>
                                                    <p className="text-slate-500">Edit the profile to add a resume URL.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {(activeTab === 'activity' || activeTab === 'skills') && (
                                        <div className="p-12 text-center text-slate-400">
                                            Content for {activeTab} coming soon.
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Sidebar (AI Assist & Management) */}
                <aside className="w-full lg:w-[380px] flex flex-col gap-6">
                    {/* AI Insight Card */}
                    <div className="bg-primary text-white rounded-xl p-6 shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Brain size={64} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles className="text-emerald-400" size={20} />
                                <h3 className="text-lg font-bold">AI Match Insight</h3>
                            </div>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="relative size-20 flex items-center justify-center border-4 border-emerald-400/30 rounded-full">
                                    <div className="absolute inset-0 border-4 border-emerald-400 rounded-full border-t-transparent animate-spin-slow" style={{ animationDuration: '3s' }}></div>
                                    <span className="text-xl font-bold">--</span>
                                </div>
                                <div>
                                    <p className="text-emerald-400 font-bold">Analysis Pending</p>
                                    <p className="text-white/70 text-sm">Waiting for resume parsing</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Interview Guide */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="text-primary" size={20} />
                                <h3 className="font-bold text-slate-900">Interview Guide</h3>
                            </div>
                            <button className="text-primary text-xs font-bold hover:underline">REGENERATE</button>
                        </div>
                        <p className="text-slate-500 text-xs mb-4">AI-generated questions based on profile gaps:</p>
                        <div className="space-y-4">
                            <div className="p-3 bg-slate-50 rounded-lg border-l-4 border-primary/30">
                                <p className="text-sm text-slate-700 italic">"Can you describe a specific time you managed a conflict within your engineering team?"</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions (Management) */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm sticky top-6">
                        <h3 className="font-bold text-slate-900 mb-4">Manage Candidate</h3>

                        {canEdit ? (
                            <div className="flex flex-col gap-3">
                                <div className="relative">
                                    <button
                                        onClick={() => setIsMoveStageOpen(!isMoveStageOpen)}
                                        className="w-full h-11 bg-primary text-white rounded-lg font-bold text-sm hover:opacity-95 transition-opacity flex items-center justify-center gap-2"
                                    >
                                        <CalendarCheck size={18} />
                                        Move Stage ({displayData.status})
                                    </button>
                                    {isMoveStageOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                                            {['SOURCED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'].map((status) => (
                                                <button
                                                    key={status}
                                                    disabled={status === displayData.status}
                                                    onClick={() => handleMoveStage(status)}
                                                    className={clsx(
                                                        "w-full text-left px-4 py-3 text-xs font-bold transition-colors flex items-center justify-between border-b last:border-0 border-slate-50",
                                                        status === displayData.status
                                                            ? "bg-primary/5 text-primary cursor-default"
                                                            : "hover:bg-slate-50 text-slate-700"
                                                    )}
                                                >
                                                    {status}
                                                    {status === displayData.status && <CheckCircle size={14} />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button className="w-full h-11 bg-slate-100 text-slate-700 rounded-lg font-bold text-sm hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                                    <Mail size={18} />
                                    Send Message
                                </button>

                                <button
                                    onClick={() => handleMoveStage('REJECTED')}
                                    className="w-full h-11 border border-rose-200 text-rose-600 rounded-lg font-bold text-sm hover:bg-rose-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    <UserX size={18} />
                                    Reject Candidate
                                </button>
                            </div>
                        ) : (
                            <div className="p-4 bg-slate-50 rounded-lg text-center">
                                <p className="text-sm text-slate-500">You have read-only access to this candidate.</p>
                            </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <button className="w-full text-center text-slate-400 text-xs font-medium hover:text-slate-600">
                                Download Parsed Report (PDF)
                            </button>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    )
}

export default CandidateProfile
