import React, { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Requirement, User } from '../../types'
import type { EmploymentType, WorkMode, SeniorityLevel } from '../../lib/requirementFields'
import { SearchableSelect } from '../ui/SearchableSelect'
import { ClientSelectField } from '../requirements/ClientSelectField'
import { SkillSelectSection } from '../skills/SkillSelectSection'
import { useToastStore } from '../../store/toastStore'
import { ApiError } from '../../lib/apiClient'
import { buildLocationDisplay } from '../../lib/requirementFields'
import { AppSelect } from '../ui/AppSelect'
import {
  EMPLOYMENT_TYPE_OPTIONS,
  REQUIREMENT_PRIORITY_OPTIONS,
  SENIORITY_OPTIONS,
  WORK_MODE_OPTIONS,
} from '../../lib/selectOptions'

type AdminRequirementEditProps = {
  requirement: Requirement
  users: User[]
  departmentNames: string[]
}

export function AdminRequirementEdit({ requirement, users, departmentNames }: AdminRequirementEditProps) {
  const queryClient = useQueryClient()
  const { addToast } = useToastStore()

  const [title, setTitle] = useState(requirement.title)
  const [client, setClient] = useState(requirement.client ?? '')
  const [department, setDepartment] = useState(requirement.department)
  const [hiringManager, setHiringManager] = useState(requirement.hiringManager)
  const [locationCity, setLocationCity] = useState(requirement.locationCity ?? '')
  const [workMode, setWorkMode] = useState<WorkMode | ''>(requirement.workMode ?? '')
  const [isRemote, setIsRemote] = useState(requirement.isRemote ?? false)
  const [openings, setOpenings] = useState(requirement.openings)
  const [priority, setPriority] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>(
    requirement.priority ?? 'MEDIUM'
  )
  const [seniorityLevel, setSeniorityLevel] = useState<SeniorityLevel | ''>(
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
    setDepartment(requirement.department)
    setHiringManager(requirement.hiringManager)
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

  const hiringManagerOptions = useMemo(
    () =>
      users
        .filter((u) => u.status === 'ACTIVE' && u.role === 'HIRING_MANAGER')
        .map((u) => ({
          value: u.name,
          label: u.name,
          sublabel: [u.department, u.email].filter(Boolean).join(' · '),
        })),
    [users]
  )

  const departmentOptions = useMemo(() => {
    const names = [...departmentNames]
    if (department && !names.includes(department)) names.unshift(department)
    return names.map((name) => ({ value: name, label: name }))
  }, [departmentNames, department])

  const saveMutation = useMutation({
    mutationFn: () =>
      api.requirements.update(requirement.id, {
        title: title.trim(),
        client: client.trim(),
        department: department.trim(),
        hiringManager: hiringManager.trim(),
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
    'mt-1 w-full px-3 py-2 rounded-lg border border-primary/10 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-medium text-primary dark:text-white'

  return (
    <section className="bg-amber-50/80 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-6 shadow-sm space-y-5">
      <div>
        <h3 className="text-lg font-black text-primary dark:text-white">Admin edit</h3>
        <p className="text-xs text-primary/60 dark:text-white/60 mt-1">
          Full control over this requirement — changes are versioned in history.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">Job title</label>
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">Client</label>
          <div className="mt-1">
            <ClientSelectField value={client} onChange={setClient} showAdminLink />
          </div>
          {requirement.jobCode && (
            <p className="text-xs text-primary/50 dark:text-white/50 mt-2 font-mono">
              Req ID: {requirement.jobCode} (cannot be changed)
            </p>
          )}
        </div>
        <div>
          <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">Department</label>
          <AppSelect
            value={department}
            onChange={setDepartment}
            options={departmentOptions.map((o) => ({ value: o.value, label: o.label }))}
            aria-label="Department"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">Hiring manager</label>
          <div className="mt-1">
            <SearchableSelect
              value={hiringManager}
              onChange={setHiringManager}
              options={hiringManagerOptions}
              placeholder="Select hiring manager"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">Seniority</label>
          <AppSelect
            value={seniorityLevel}
            onChange={(v) => setSeniorityLevel(v as SeniorityLevel | '')}
            options={SENIORITY_OPTIONS}
            aria-label="Seniority"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">Employment type</label>
          <AppSelect
            value={employmentType}
            onChange={(v) => setEmploymentType(v as EmploymentType)}
            options={EMPLOYMENT_TYPE_OPTIONS}
            aria-label="Employment type"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">Work mode</label>
          <AppSelect
            value={workMode}
            onChange={(v) => setWorkMode(v as WorkMode | '')}
            options={WORK_MODE_OPTIONS}
            aria-label="Work mode"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">City</label>
          <input
            className={inputClass}
            value={locationCity}
            onChange={(e) => setLocationCity(e.target.value)}
          />
        </div>
        <div className="flex items-end">
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
          <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">Exp. min (yrs)</label>
          <input
            type="number"
            min={0}
            className={inputClass}
            value={experienceMinYears}
            onChange={(e) => setExperienceMinYears(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">Exp. max (yrs)</label>
          <input
            type="number"
            min={0}
            className={inputClass}
            value={experienceMaxYears}
            onChange={(e) => setExperienceMaxYears(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">CTC band</label>
          <input className={inputClass} value={salaryBand} onChange={(e) => setSalaryBand(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">Target start</label>
          <input
            type="date"
            className={inputClass}
            value={targetStartDate}
            onChange={(e) => setTargetStartDate(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">Hiring deadline</label>
          <input
            type="date"
            className={inputClass}
            value={hiringDeadline}
            onChange={(e) => setHiringDeadline(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">Openings</label>
          <input
            type="number"
            min={1}
            className={inputClass}
            value={openings}
            onChange={(e) => setOpenings(Number(e.target.value) || 1)}
          />
        </div>
        <div>
          <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">Priority</label>
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
        isAdmin
      />

      <div>
        <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">Job description</label>
        <textarea
          rows={8}
          className={inputClass}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />
      </div>

      <button
        type="button"
        disabled={saveMutation.isPending || !title.trim() || !department.trim() || !hiringManager.trim()}
        onClick={() => saveMutation.mutate()}
        className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50"
      >
        {saveMutation.isPending ? 'Saving…' : 'Save all changes'}
      </button>
    </section>
  )
}
