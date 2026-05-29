import React, { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Requirement, User } from '../../types'
import { SearchableSelect } from '../ui/SearchableSelect'
import { SkillSelectSection } from '../skills/SkillSelectSection'
import { useToastStore } from '../../store/toastStore'
import { ApiError } from '../../lib/apiClient'

type AdminRequirementEditProps = {
  requirement: Requirement
  users: User[]
  departmentNames: string[]
}

export function AdminRequirementEdit({ requirement, users, departmentNames }: AdminRequirementEditProps) {
  const queryClient = useQueryClient()
  const { addToast } = useToastStore()

  const [title, setTitle] = useState(requirement.title)
  const [department, setDepartment] = useState(requirement.department)
  const [hiringManager, setHiringManager] = useState(requirement.hiringManager)
  const [location, setLocation] = useState(requirement.location ?? '')
  const [openings, setOpenings] = useState(requirement.openings)
  const [priority, setPriority] = useState(requirement.priority ?? 'MEDIUM')
  const [jobDescription, setJobDescription] = useState(
    requirement.jobDescription || requirement.description || ''
  )
  const [primarySkills, setPrimarySkills] = useState(requirement.primarySkills ?? [])
  const [secondarySkills, setSecondarySkills] = useState(requirement.secondarySkills ?? [])

  useEffect(() => {
    setTitle(requirement.title)
    setDepartment(requirement.department)
    setHiringManager(requirement.hiringManager)
    setLocation(requirement.location ?? '')
    setOpenings(requirement.openings)
    setPriority(requirement.priority ?? 'MEDIUM')
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
        department: department.trim(),
        hiringManager: hiringManager.trim(),
        location: location.trim() || undefined,
        openings,
        priority,
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
          <input
            className="mt-1 w-full px-3 py-2 rounded-lg border border-primary/10 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-medium text-primary dark:text-white"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">Department</label>
          <select
            className="mt-1 w-full px-3 py-2 rounded-lg border border-primary/10 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-medium text-primary dark:text-white"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            {departmentOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
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
          <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">Location</label>
          <input
            className="mt-1 w-full px-3 py-2 rounded-lg border border-primary/10 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-medium text-primary dark:text-white"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">Openings</label>
          <input
            type="number"
            min={1}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-primary/10 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-medium text-primary dark:text-white"
            value={openings}
            onChange={(e) => setOpenings(Number(e.target.value) || 1)}
          />
        </div>
        <div>
          <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">Priority</label>
          <select
            className="mt-1 w-full px-3 py-2 rounded-lg border border-primary/10 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-medium text-primary dark:text-white"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
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
          className="mt-1 w-full px-3 py-2 rounded-lg border border-primary/10 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-primary dark:text-white"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />
      </div>

      <button
        type="button"
        disabled={saveMutation.isPending || !title.trim() || !department.trim() || !hiringManager.trim()}
        onClick={() => saveMutation.mutate()}
        className="px-6 py-2.5 rounded-xl bg-primary dark:bg-white text-white dark:text-primary text-sm font-bold disabled:opacity-50"
      >
        {saveMutation.isPending ? 'Saving…' : 'Save all changes'}
      </button>
    </section>
  )
}
