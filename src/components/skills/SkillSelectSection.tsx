import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { SearchableMultiSelect } from '../ui/SearchableMultiSelect'
import { EditSkillsModal } from '../admin/EditSkillsModal'
import type { SelectOption } from '../ui/SearchableSelect'
import clsx from 'clsx'

function FieldLabel({
  children,
  required = true,
}: {
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider flex items-center gap-0.5">
      {required && (
        <span className="text-red-500" aria-hidden="true">
          *
        </span>
      )}
      {children}
    </label>
  )
}

type SkillSelectSectionProps = {
  primarySkills: string[]
  secondarySkills: string[]
  onPrimaryChange: (skills: string[]) => void
  onSecondaryChange: (skills: string[]) => void
  isAdmin?: boolean
  primaryError?: string
  className?: string
}

export function SkillSelectSection({
  primarySkills,
  secondarySkills,
  onPrimaryChange,
  onSecondaryChange,
  isAdmin = false,
  primaryError,
  className,
}: SkillSelectSectionProps) {
  const [editOpen, setEditOpen] = useState(false)

  const { data: catalog = [], isLoading } = useQuery({
    queryKey: ['skill-catalog'],
    queryFn: api.skills.list,
    staleTime: 60_000,
  })

  const options: SelectOption[] = useMemo(
    () =>
      catalog.map((s) => ({
        value: s.name,
        label: s.name,
        sublabel: s.category,
      })),
    [catalog]
  )

  const secondaryOptions = useMemo(
    () => options.filter((o) => !primarySkills.includes(o.value)),
    [options, primarySkills]
  )

  const primaryOptions = useMemo(
    () => options.filter((o) => !secondarySkills.includes(o.value)),
    [options, secondarySkills]
  )

  return (
    <div className={clsx('space-y-6', className)}>
      <div className="flex items-center justify-between gap-4">
        <p className="font-bold text-sm text-primary dark:text-white flex items-center gap-0.5">
          <span className="text-red-500" aria-hidden="true">
            *
          </span>
          Skills
        </p>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="text-xs font-bold text-primary dark:text-white underline underline-offset-2 hover:opacity-80"
          >
            Edit skills
          </button>
        )}
      </div>

      {isLoading && (
        <p className="text-xs text-primary/50">Loading skill catalog…</p>
      )}

      <div className="space-y-2">
        <FieldLabel>Primary skills</FieldLabel>
        <SearchableMultiSelect
          value={primarySkills}
          onChange={onPrimaryChange}
          options={primaryOptions}
          placeholder="Select primary skills…"
          searchPlaceholder="Search skills…"
          emptyLabel="No skills available — ask an admin to edit the catalog"
        />
        {primaryError && (
          <p className="text-xs font-bold text-red-500">{primaryError}</p>
        )}
        <p className="text-xs text-primary/40 dark:text-white/40">
          Used to match this profile against job requirements.
        </p>
      </div>

      <div className="space-y-2">
        <FieldLabel required={false}>Secondary skills</FieldLabel>
        <SearchableMultiSelect
          value={secondarySkills}
          onChange={onSecondaryChange}
          options={secondaryOptions}
          placeholder="Select secondary skills (optional)…"
          searchPlaceholder="Search skills…"
        />
      </div>

      <EditSkillsModal open={editOpen} onClose={() => setEditOpen(false)} skills={catalog} />
    </div>
  )
}
