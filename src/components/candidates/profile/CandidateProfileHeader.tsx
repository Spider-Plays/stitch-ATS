import React from 'react'
import {
  Building2,
  Calendar,
  Edit2,
  GitBranch,
  Mail,
  MapPin,
  Phone,
  Trash2,
  User,
} from 'lucide-react'
import clsx from 'clsx'
import type { Candidate } from '../../../types'
import { IndianItCitySelect } from '../IndianItCitySelect'
import { AppSelect } from '../../ui/AppSelect'
import { CANDIDATE_SOURCE_OPTIONS } from '../../../lib/selectOptions'
import { candidateStatusClass, candidateStatusLabel, recruiterDisplay } from '../../../lib/candidatePage'
import { isCareersCandidate, isEmployeeReferralCandidate } from '../../../lib/featureCandidates'
import { candidateInitials, PROFILE_INPUT, PROFILE_LABEL } from '../../../lib/candidateProfilePage'
import { getIndianItCityState } from '../../../lib/indianItCities'

type FieldProps = { label: string; children: React.ReactNode }

function Field({ label, children }: FieldProps) {
  return (
    <div>
      <label className={PROFILE_LABEL}>{label}</label>
      {children}
    </div>
  )
}

type CandidateProfileHeaderProps = {
  candidate: Candidate
  displayData: Candidate
  isEditing: boolean
  editData: Candidate | null
  setEditData: React.Dispatch<React.SetStateAction<Candidate | null>>
  canEdit: boolean
  isAdmin: boolean
  isInterviewerView?: boolean
  isSaving: boolean
  onStartEdit: () => void
  onCancelEdit: () => void
  onSave: () => void
  onDelete: () => void
}

export function CandidateProfileHeader({
  candidate,
  displayData,
  isEditing,
  editData,
  setEditData,
  canEdit,
  isAdmin,
  isInterviewerView = false,
  isSaving,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: CandidateProfileHeaderProps) {
  const locationState = displayData.location
    ? getIndianItCityState(displayData.location)
    : undefined

  return (
    <header className="app-card overflow-hidden">
      <div className="p-6 md:p-8">
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
          <div className="flex gap-4 md:gap-5 min-w-0 flex-1">
            <div
              className={clsx(
                'shrink-0 size-16 md:size-20 rounded-2xl flex items-center justify-center font-black text-2xl md:text-3xl',
                'bg-primary/10 dark:bg-white/10 text-primary dark:text-white'
              )}
            >
              {candidate.avatar ? (
                <img
                  src={candidate.avatar}
                  alt=""
                  className="size-full object-cover rounded-2xl"
                />
              ) : (
                candidateInitials(displayData.name)
              )}
            </div>

            {isEditing && editData ? (
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                <Field label="Full name">
                  <input
                    className={PROFILE_INPUT}
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  />
                </Field>
                <Field label="Role / job title">
                  <input
                    className={clsx(PROFILE_INPUT, 'opacity-70')}
                    value={editData.jobTitle || editData.role}
                    readOnly
                    title="Change job requirement on the Overview tab"
                  />
                </Field>
                <Field label="Email">
                  <input
                    className={PROFILE_INPUT}
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  />
                </Field>
                <Field label="Phone">
                  <input
                    className={PROFILE_INPUT}
                    value={editData.phone || ''}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  />
                </Field>
                <Field label="Location">
                  <IndianItCitySelect
                    value={editData.location || ''}
                    onChange={(location) => setEditData({ ...editData, location })}
                    allowClear
                  />
                </Field>
                <Field label="Source">
                  <AppSelect
                    value={editData.source || 'Direct Application'}
                    onChange={(source) => setEditData({ ...editData, source })}
                    options={CANDIDATE_SOURCE_OPTIONS}
                    aria-label="Candidate source"
                  />
                </Field>
              </div>
            ) : (
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl md:text-4xl font-black text-primary dark:text-white tracking-tight">
                    {displayData.name}
                  </h1>
                  {!isInterviewerView && (
                    <span
                      className={clsx(
                        'px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border',
                        candidateStatusClass(displayData.status)
                      )}
                    >
                      {candidateStatusLabel(displayData.status)}
                    </span>
                  )}
                  {!isInterviewerView && isEmployeeReferralCandidate(displayData) && (
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-violet-500/12 text-violet-800 dark:text-violet-300 border border-violet-200/70 dark:border-violet-500/35">
                      ERP
                    </span>
                  )}
                  {!isInterviewerView && isCareersCandidate(displayData) && (
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-sky-500/12 text-sky-800 dark:text-sky-300 border border-sky-200/70 dark:border-sky-500/35">
                      Portal
                    </span>
                  )}
                </div>

                {!isInterviewerView && (
                  <p className="text-base font-bold text-primary/80 dark:text-white/80">
                    {displayData.jobTitle || displayData.role}
                  </p>
                )}

                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium text-primary/60 dark:text-white/60">
                  {!isInterviewerView && displayData.reqId && (
                    <span className="font-mono font-bold text-primary/80 dark:text-white/80">
                      {displayData.reqId}
                    </span>
                  )}
                  {!isInterviewerView && displayData.client && (
                    <span className="inline-flex items-center gap-1">
                      <Building2 size={14} />
                      {displayData.client}
                    </span>
                  )}
                  {displayData.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={14} />
                      {displayData.location}
                      {locationState ? `, ${locationState}` : ''}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-primary/50 dark:text-white/50">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail size={14} />
                    {displayData.email}
                  </span>
                  {displayData.phone && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone size={14} />
                      {displayData.phone}
                    </span>
                  )}
                  {!isInterviewerView && (
                    <>
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar size={14} />
                        Applied {new Date(displayData.appliedDate).toLocaleDateString()}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <User size={14} />
                        {recruiterDisplay(displayData)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={onCancelEdit}
                  disabled={isSaving}
                  className="px-4 py-2.5 rounded-xl border border-primary/10 dark:border-white/10 text-sm font-bold text-primary/70 dark:text-white/70 hover:bg-primary/5 dark:hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onSave}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold disabled:opacity-50"
                >
                  {isSaving ? 'Saving…' : 'Save changes'}
                </button>
              </>
            ) : (
              <>
                {canEdit && (
                  <button
                    type="button"
                    onClick={onStartEdit}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90"
                  >
                    <Edit2 size={16} />
                    Edit profile
                  </button>
                )}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={onDelete}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200/80 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 text-sm font-bold hover:bg-red-100 dark:hover:bg-red-500/20"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {!isEditing && !isInterviewerView && (
        <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-primary/10 dark:border-white/10 divide-x divide-y lg:divide-y-0 divide-primary/10 dark:divide-white/10">
          {[
            { label: 'Experience', value: displayData.totalExperience || '—' },
            { label: 'Current company', value: displayData.currentCompany || '—' },
            { label: 'Notice period', value: displayData.noticePeriod || '—' },
            { label: 'Source', value: displayData.source || '—' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="px-5 py-4 bg-primary/[0.02] dark:bg-white/[0.02]"
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </p>
              <p className="text-lg font-black text-primary dark:text-white mt-1 truncate" title={stat.value}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </header>
  )
}
