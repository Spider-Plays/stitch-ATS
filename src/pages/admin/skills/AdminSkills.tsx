import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { ApiError } from '@/lib/apiClient'
import { AdminPageShell } from '@/components/admin/AdminPageShell'
import { SkillCatalogEditor } from '@/components/admin/SkillCatalogEditor'
import './skills.css'

const AdminSkills = () => {
  const { data: skills = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['skill-catalog'],
    queryFn: api.skills.list,
    retry: 1,
  })

  const errorMessage =
    error instanceof ApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : 'Could not load skills'

  return (
    <AdminPageShell
      title="Skill catalog"
      description="Skills listed here are available when creating requirements and candidate profiles."
    >
      {isLoading && (
        <p className="text-page-desc">Loading skills…</p>
      )}

      {isError && !isLoading && (
        <div className="mb-6 p-4 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200 text-sm space-y-3">
          <p className="font-bold">{errorMessage}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 rounded-lg bg-amber-800 text-white text-sm font-bold hover:bg-amber-900"
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {skills.length === 0 ? (
            <p className="text-sm text-primary/50 dark:text-white/50 mb-4">
              No skills yet — add your first one below.
            </p>
          ) : null}
          <SkillCatalogEditor skills={skills} variant="page" />
        </>
      )}
    </AdminPageShell>
  )
}

export default AdminSkills
