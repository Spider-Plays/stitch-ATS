import React, { useEffect, useMemo } from 'react'
import { Briefcase, Globe, Linkedin } from 'lucide-react'
import type { Candidate, Requirement } from '@/types'
import clsx from 'clsx'
import { PROFILE_INPUT, PROFILE_LABEL } from '@/pages/candidates/profile/profile.utils'
import {
  formatMilestoneDate,
  hasJoiningMilestone,
  hasOfferMilestone,
} from '@/lib/candidateMilestones'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { SkillSelectSection } from '@/components/skills/SkillSelectSection'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={PROFILE_LABEL}>{label}</label>
      {children}
    </div>
  )
}

function DetailCard({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="p-4 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02]">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-bold text-primary dark:text-white mt-1">{value || '—'}</p>
    </div>
  )
}

type CandidateProfileOverviewProps = {
  displayData: Candidate
  isEditing: boolean
  editData: Candidate | null
  setEditData: React.Dispatch<React.SetStateAction<Candidate | null>>
  requirements: Requirement[]
  isAdmin?: boolean
  isInterviewerView?: boolean
  skillsError?: string
}

export function CandidateProfileOverview({
  displayData,
  isEditing,
  editData,
  setEditData,
  requirements,
  isAdmin = false,
  isInterviewerView = false,
  skillsError,
}: CandidateProfileOverviewProps) {
  const requirementOptions = useMemo(
    () =>
      requirements
        .filter((r) => !['CLOSED', 'CANCELLED', 'REJECTED'].includes(r.status))
        .map((req) => ({
          value: req.id,
          label: req.title,
          sublabel: `${req.jobCode ?? req.id.slice(-8).toUpperCase()}${req.client ? ` · ${req.client}` : ''} · ${req.department}`,
        })),
    [requirements]
  )

  const requirementFromId = (requirementId: string) =>
    requirements.find((r) => r.id === requirementId)

  const fieldsFromRequirement = (req: Requirement | undefined) => ({
    role: req?.title ?? '',
    jobTitle: req?.title ?? '',
    client: req?.client ?? '',
    reqId: req?.jobCode,
  })

  const applyRequirement = (requirementId: string) => {
    const req = requirementFromId(requirementId)
    const derived = fieldsFromRequirement(req)
    setEditData((prev) =>
      prev
        ? {
            ...prev,
            requirementId,
            ...derived,
          }
        : prev
    )
  }

  useEffect(() => {
    if (!isEditing || !editData?.requirementId) return
    const req = requirementFromId(editData.requirementId)
    if (!req) return
    const derived = fieldsFromRequirement(req)
    const needsSync =
      (editData.jobTitle || editData.role) !== derived.role ||
      (editData.client ?? '') !== derived.client
    if (needsSync) {
      setEditData((prev) => (prev ? { ...prev, ...derived } : prev))
    }
  }, [isEditing, editData?.requirementId, requirements])

  if (isEditing && editData) {
    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-primary/10 dark:border-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02]">
            <h3 className="text-sm font-bold text-primary dark:text-white">Job assignment</h3>
            <p className="text-xs text-primary/50 dark:text-white/50 mt-0.5">
              Select a job — role and client fill in automatically.
            </p>
          </div>
          <div className="p-5 space-y-4">
            <Field label="Job requirement">
              <SearchableSelect
                value={editData.requirementId ?? ''}
                onChange={applyRequirement}
                options={requirementOptions}
                placeholder="Select job requirement"
                searchPlaceholder="Search jobs..."
                allowClear={false}
                icon={<Briefcase size={18} className="text-muted-foreground" />}
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Role / job title">
                <input
                  className={clsx(
                    PROFILE_INPUT,
                    'opacity-70 cursor-not-allowed bg-primary/[0.04] dark:bg-white/[0.04]'
                  )}
                  value={editData.jobTitle || editData.role || ''}
                  disabled
                  readOnly
                  placeholder="Select a job above"
                />
              </Field>
              <Field label="Client">
                <input
                  className={clsx(
                    PROFILE_INPUT,
                    'opacity-70 cursor-not-allowed bg-primary/[0.04] dark:bg-white/[0.04]'
                  )}
                  value={editData.client || ''}
                  disabled
                  readOnly
                  placeholder="Select a job above"
                />
              </Field>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-primary/10 dark:border-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02]">
            <h3 className="text-sm font-bold text-primary dark:text-white">Skills</h3>
            <p className="text-xs text-primary/50 dark:text-white/50 mt-0.5">
              Used for job matching when the requirement or skills change.
            </p>
          </div>
          <div className="p-5">
            <SkillSelectSection
              primarySkills={editData.primarySkills ?? []}
              secondarySkills={editData.secondarySkills ?? []}
              onPrimaryChange={(primarySkills) => setEditData({ ...editData, primarySkills })}
              onSecondaryChange={(secondarySkills) =>
                setEditData({ ...editData, secondarySkills })
              }
              isAdmin={isAdmin}
              primaryError={skillsError}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-primary/10 dark:border-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02]">
            <h3 className="text-sm font-bold text-primary dark:text-white">Professional details</h3>
            <p className="text-xs text-primary/50 dark:text-white/50 mt-0.5">
              Save from the header when you are done editing.
            </p>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Total experience">
              <input
                className={PROFILE_INPUT}
                value={editData.totalExperience || ''}
                onChange={(e) => setEditData({ ...editData, totalExperience: e.target.value })}
                placeholder="e.g. 5 years"
              />
            </Field>
            <Field label="Current company">
              <input
                className={PROFILE_INPUT}
                value={editData.currentCompany || ''}
                onChange={(e) => setEditData({ ...editData, currentCompany: e.target.value })}
              />
            </Field>
            <Field label="Current CTC">
              <input
                className={PROFILE_INPUT}
                value={editData.currentCTC || ''}
                onChange={(e) => setEditData({ ...editData, currentCTC: e.target.value })}
              />
            </Field>
            <Field label="Expected CTC">
              <input
                className={PROFILE_INPUT}
                value={editData.expectedCTC || ''}
                onChange={(e) => setEditData({ ...editData, expectedCTC: e.target.value })}
              />
            </Field>
            <Field label="Notice period">
              <input
                className={PROFILE_INPUT}
                value={editData.noticePeriod || ''}
                onChange={(e) => setEditData({ ...editData, noticePeriod: e.target.value })}
              />
            </Field>
            <Field label="LinkedIn URL">
              <input
                className={PROFILE_INPUT}
                value={editData.linkedIn || ''}
                onChange={(e) => setEditData({ ...editData, linkedIn: e.target.value })}
                placeholder="https://linkedin.com/in/..."
              />
            </Field>
            <Field label="Portfolio URL">
              <input
                className={PROFILE_INPUT}
                value={editData.portfolio || ''}
                onChange={(e) => setEditData({ ...editData, portfolio: e.target.value })}
                placeholder="https://..."
              />
            </Field>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {!isInterviewerView && (
        <section className="rounded-2xl border border-primary/10 dark:border-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02]">
            <h3 className="text-sm font-bold text-primary dark:text-white">Compensation & role</h3>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <DetailCard label="Current CTC" value={displayData.currentCTC} />
            <DetailCard label="Expected CTC" value={displayData.expectedCTC} />
            <DetailCard label="Role" value={displayData.role} />
          </div>
        </section>
      )}

      {isInterviewerView && (
        <section className="rounded-2xl border border-primary/10 dark:border-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02]">
            <h3 className="text-sm font-bold text-primary dark:text-white">Professional details</h3>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DetailCard label="Total experience" value={displayData.totalExperience} />
            <DetailCard label="Current company" value={displayData.currentCompany} />
          </div>
        </section>
      )}

      {!isInterviewerView && hasOfferMilestone(displayData) && (
        <section className="rounded-2xl border border-primary/10 dark:border-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02]">
            <h3 className="text-sm font-bold text-primary dark:text-white">Offer details</h3>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <DetailCard label="Date of offer" value={formatMilestoneDate(displayData.offerDate)} />
            <DetailCard label="Month of offer" value={displayData.offerMonth} />
            <DetailCard label="Quarter of offer" value={displayData.offerQuarter} />
            <DetailCard
              label="Expected joining"
              value={formatMilestoneDate(displayData.expectedJoiningDate)}
            />
          </div>
        </section>
      )}

      {!isInterviewerView && hasJoiningMilestone(displayData) && (
        <section className="rounded-2xl border border-primary/10 dark:border-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02]">
            <h3 className="text-sm font-bold text-primary dark:text-white">Joining details</h3>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <DetailCard label="Date of joining" value={formatMilestoneDate(displayData.joiningDate)} />
            <DetailCard label="Month of joining" value={displayData.joiningMonth} />
            <DetailCard label="Quarter of joining" value={displayData.joiningQuarter} />
          </div>
        </section>
      )}

      {!isInterviewerView && (
        <section className="rounded-2xl border border-primary/10 dark:border-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02]">
            <h3 className="text-sm font-bold text-primary dark:text-white">Assignment</h3>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <DetailCard label="Job title" value={displayData.jobTitle || displayData.role} />
            <DetailCard label="Req ID" value={displayData.reqId} />
            <DetailCard label="Client" value={displayData.client} />
            <DetailCard label="PAN" value={displayData.pan} />
            <DetailCard label="Match score" value={`${displayData.matchScore ?? 0}%`} />
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-primary/10 dark:border-white/10 p-5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Primary skills
        </p>
        {(displayData.primarySkills?.length ?? 0) > 0 ? (
          <div className="flex flex-wrap gap-2">
            {displayData.primarySkills!.map((s) => (
              <span
                key={s}
                className="px-2.5 py-1 rounded-lg bg-primary/10 dark:bg-white/10 text-xs font-bold text-primary dark:text-white"
              >
                {s}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-primary/50 dark:text-white/50">No primary skills listed</p>
        )}
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-4 mb-3">
          Secondary skills
        </p>
        {(displayData.secondarySkills?.length ?? 0) > 0 ? (
          <div className="flex flex-wrap gap-2">
            {displayData.secondarySkills!.map((s) => (
              <span
                key={s}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/10 text-xs font-bold text-slate-700 dark:text-white/80"
              >
                {s}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-primary/50 dark:text-white/50">No secondary skills listed</p>
        )}
      </section>

      {!isInterviewerView && (displayData.linkedIn || displayData.portfolio) && (
        <section className="rounded-2xl border border-primary/10 dark:border-white/10 p-5 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Links
          </p>
          {displayData.linkedIn && (
            <a
              href={displayData.linkedIn}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-sm font-bold text-primary dark:text-white hover:underline"
            >
              <Linkedin size={16} />
              {displayData.linkedIn}
            </a>
          )}
          {displayData.portfolio && (
            <a
              href={displayData.portfolio}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-sm font-bold text-primary dark:text-white hover:underline"
            >
              <Globe size={16} />
              {displayData.portfolio}
            </a>
          )}
        </section>
      )}
    </div>
  )
}
