import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Requirement } from '../../types'
import { SkillSelectSection } from '../skills/SkillSelectSection'
import { ClientSelectField } from './ClientSelectField'
import { useToastStore } from '../../store/toastStore'
import { ApiError } from '../../lib/apiClient'
import type { EmploymentType, WorkMode } from '../../lib/requirementFields'
import { buildLocationDisplay, formatRequirementLocation } from '../../lib/requirementFields'
import { AppSelect } from '../ui/AppSelect'
import {
  EMPLOYMENT_TYPE_OPTIONS,
  REQUIREMENT_PRIORITY_OPTIONS,
  SENIORITY_OPTIONS,
  WORK_MODE_OPTIONS,
} from '../../lib/selectOptions'

type HiringManagerRequirementEditProps = {
  requirement: Requirement
}

export function HiringManagerRequirementEdit({ requirement }: HiringManagerRequirementEditProps) {
  const queryClient = useQueryClient()
  const { addToast } = useToastStore()

  const [title, setTitle] = useState(requirement.title)
  const [client, setClient] = useState(requirement.client ?? '')
  const [locationCity, setLocationCity] = useState(requirement.locationCity ?? '')
  const [workMode, setWorkMode] = useState<WorkMode | ''>(requirement.workMode ?? '')
  const [isRemote, setIsRemote] = useState(requirement.isRemote ?? false)
  const [openings, setOpenings] = useState(requirement.openings)
  const [priority, setPriority] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>(
    requirement.priority ?? 'MEDIUM'
  )
  const [seniorityLevel, setSeniorityLevel] = useState<Requirement['seniorityLevel'] | ''>(
    requirement.seniorityLevel ?? ''
  )
  const [employmentType, setEmploymentType] = useState<EmploymentType>(
    requirement.employmentType ?? 'FULL_TIME'
  )
  const [experienceMinYears, setExperienceMinYears] = useState(
    requirement.experienceMinYears?.toString() ?? ''
  )
  const [experienceMaxYears, setExperienceMaxYears] = useState(
    requirement.experienceMaxYears?.toString() ?? ''
  )
  const [salaryBand, setSalaryBand] = useState(requirement.salaryBand ?? '')
  const [targetStartDate, setTargetStartDate] = useState(
    requirement.targetStartDate?.slice(0, 10) ?? ''
  )
  const [hiringDeadline, setHiringDeadline] = useState(
    requirement.hiringDeadline?.slice(0, 10) ?? ''
  )
  const [jobDescription, setJobDescription] = useState(
    requirement.jobDescription || requirement.description || ''
  )
  const [primarySkills, setPrimarySkills] = useState(requirement.primarySkills ?? [])
  const [secondarySkills, setSecondarySkills] = useState(requirement.secondarySkills ?? [])

  useEffect(() => {
    setTitle(requirement.title)
    setClient(requirement.client ?? '')
    setLocationCity(requirement.locationCity ?? '')
    setWorkMode(requirement.workMode ?? '')
    setIsRemote(requirement.isRemote ?? false)
    setOpenings(requirement.openings)
    setPriority(requirement.priority ?? 'MEDIUM')
    setSeniorityLevel(requirement.seniorityLevel ?? '')
    setEmploymentType(requirement.employmentType ?? 'FULL_TIME')
    setExperienceMinYears(requirement.experienceMinYears?.toString() ?? '')
    setExperienceMaxYears(requirement.experienceMaxYears?.toString() ?? '')
    setSalaryBand(requirement.salaryBand ?? '')
    setTargetStartDate(requirement.targetStartDate?.slice(0, 10) ?? '')
    setHiringDeadline(requirement.hiringDeadline?.slice(0, 10) ?? '')
    setJobDescription(requirement.jobDescription || requirement.description || '')
    setPrimarySkills(requirement.primarySkills ?? [])
    setSecondarySkills(requirement.secondarySkills ?? [])
  }, [requirement])

  const saveMutation = useMutation({
    mutationFn: () =>
      api.requirements.update(requirement.id, {
        title: title.trim(),
        client: client.trim(),
        location: buildLocationDisplay({
          locationCity,
          workMode: workMode || undefined,
          isRemote,
        }),
        locationCity: locationCity.trim() || undefined,
        workMode: workMode || undefined,
        isRemote,
        openings,
        priority,
        seniorityLevel: seniorityLevel || undefined,
        employmentType,
        experienceMinYears: experienceMinYears ? Number(experienceMinYears) : undefined,
        experienceMaxYears: experienceMaxYears ? Number(experienceMaxYears) : undefined,
        salaryBand: salaryBand.trim() || undefined,
        targetStartDate: targetStartDate || undefined,
        hiringDeadline: hiringDeadline || undefined,
        jobDescription: jobDescription.trim(),
        description: jobDescription.trim().slice(0, 2000),
        primarySkills,
        secondarySkills,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requirement', requirement.id] })
      queryClient.invalidateQueries({ queryKey: ['requirements'] })
      addToast('Requirement updated', 'success')
    },
    onError: (err: unknown) => {
      addToast(err instanceof ApiError ? err.message : 'Failed to save', 'error')
    },
  })

  const inputClass =
    'mt-1 w-full px-3 py-2 rounded-xl border border-primary/10 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-medium text-primary dark:text-white'

  const labelClass = 'text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider'

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-page-title">
          Edit requirement
        </h1>
        <p className="text-sm text-primary/60 dark:text-white/60 mt-1 font-medium">
          Update job details for your team. Department and hiring manager are managed by HR.
        </p>
        {requirement.jobCode && (
          <p className="text-xs font-mono text-primary/50 dark:text-white/50 mt-2">
            {requirement.jobCode} · {requirement.department} · {requirement.hiringManager}
          </p>
        )}
      </div>

      <section className="app-card p-6 md:p-8 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>Job title</label>
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Client</label>
            <div className="mt-1">
              <ClientSelectField value={client} onChange={setClient} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Department</label>
            <p className="mt-1 px-3 py-2 rounded-xl bg-primary/5 dark:bg-white/5 text-sm font-bold text-primary dark:text-white">
              {requirement.department}
            </p>
          </div>
          <div>
            <label className={labelClass}>Hiring manager</label>
            <p className="mt-1 px-3 py-2 rounded-xl bg-primary/5 dark:bg-white/5 text-sm font-bold text-primary dark:text-white">
              {requirement.hiringManager}
            </p>
          </div>
          <div>
            <label className={labelClass}>Seniority</label>
            <AppSelect
              value={seniorityLevel}
              onChange={(v) => setSeniorityLevel(v as Requirement['seniorityLevel'] | '')}
              options={SENIORITY_OPTIONS}
              aria-label="Seniority"
            />
          </div>
          <div>
            <label className={labelClass}>Employment type</label>
            <AppSelect
              value={employmentType}
              onChange={(v) => setEmploymentType(v as EmploymentType)}
              options={EMPLOYMENT_TYPE_OPTIONS}
              aria-label="Employment type"
            />
          </div>
          <div>
            <label className={labelClass}>Work mode</label>
            <AppSelect
              value={workMode}
              onChange={(v) => setWorkMode(v as WorkMode | '')}
              options={WORK_MODE_OPTIONS}
              aria-label="Work mode"
            />
          </div>
          <div>
            <label className={labelClass}>City</label>
            <input
              className={inputClass}
              value={locationCity}
              onChange={(e) => setLocationCity(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-primary/50 dark:text-white/50">
              Location preview:{' '}
              {formatRequirementLocation({
                locationCity,
                workMode: workMode || undefined,
                isRemote,
              }) || '—'}
            </p>
          </div>
          <div className="flex items-end sm:col-span-2">
            <label className="flex items-center gap-2 text-sm font-bold text-primary dark:text-white pb-2">
              <input
                type="checkbox"
                checked={isRemote}
                onChange={(e) => setIsRemote(e.target.checked)}
              />
              Fully remote
            </label>
          </div>
          <div>
            <label className={labelClass}>Exp. min (yrs)</label>
            <input
              type="number"
              min={0}
              className={inputClass}
              value={experienceMinYears}
              onChange={(e) => setExperienceMinYears(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Exp. max (yrs)</label>
            <input
              type="number"
              min={0}
              className={inputClass}
              value={experienceMaxYears}
              onChange={(e) => setExperienceMaxYears(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>CTC band</label>
            <input className={inputClass} value={salaryBand} onChange={(e) => setSalaryBand(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Openings</label>
            <input
              type="number"
              min={1}
              className={inputClass}
              value={openings}
              onChange={(e) => setOpenings(Number(e.target.value) || 1)}
            />
          </div>
          <div>
            <label className={labelClass}>Target start</label>
            <input
              type="date"
              className={inputClass}
              value={targetStartDate}
              onChange={(e) => setTargetStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Hiring deadline</label>
            <input
              type="date"
              className={inputClass}
              value={hiringDeadline}
              onChange={(e) => setHiringDeadline(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Priority</label>
            <AppSelect
              value={priority}
              onChange={(v) => setPriority(v as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW')}
              options={REQUIREMENT_PRIORITY_OPTIONS}
              aria-label="Priority"
            />
          </div>
        </div>

        <SkillSelectSection
          primarySkills={primarySkills}
          secondarySkills={secondarySkills}
          onPrimaryChange={setPrimarySkills}
          onSecondaryChange={setSecondarySkills}
        />

        <div>
          <label className={labelClass}>Job description</label>
          <textarea
            rows={10}
            className={inputClass}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-3 pt-2 border-t border-primary/10 dark:border-white/10">
          <button
            type="button"
            disabled={saveMutation.isPending || !title.trim()}
            onClick={() => saveMutation.mutate()}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Saving…' : 'Save changes'}
          </button>
          <Link
            to={`/requirements/${requirement.id}`}
            className="px-6 py-2.5 rounded-xl border border-primary/10 dark:border-white/10 text-sm font-bold text-primary dark:text-white hover:bg-primary/5 dark:hover:bg-white/5"
          >
            Cancel
          </Link>
        </div>
      </section>
    </div>
  )
}
