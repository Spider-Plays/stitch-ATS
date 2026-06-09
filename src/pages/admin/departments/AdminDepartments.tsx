import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { ApiError } from '@/lib/apiClient'
import { AdminPageShell } from '@/components/admin/AdminPageShell'
import { DepartmentCatalogEditor } from '@/components/admin/DepartmentCatalogEditor'
import './departments.css'

const AdminDepartments = () => {
  const { data: departments = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['department-catalog'],
    queryFn: api.departments.list,
    retry: 1,
  })

  const errorMessage =
    error instanceof ApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : 'Could not load departments'

  return (
    <AdminPageShell
      title="Departments"
      description="Names in this catalog appear when posting jobs and assigning user departments."
    >
      {isLoading && (
        <p className="text-page-desc">Loading departments…</p>
      )}

      {isError && !isLoading && (
        <div className="mb-6 p-4 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200 text-sm space-y-3">
          <p className="font-bold">{errorMessage}</p>
          <p className="text-amber-800/90 dark:text-amber-200/90">
            If this is a new install, run{' '}
            <code className="text-xs font-mono bg-amber-100/80 dark:bg-black/20 px-1 py-0.5 rounded">
              npx prisma db push
            </code>{' '}
            in the <code className="text-xs font-mono">server</code> folder (Neon must be awake).
          </p>
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
          {departments.length === 0 ? (
            <p className="text-sm text-primary/50 dark:text-white/50 mb-4">
              No departments yet — add your first one below.
            </p>
          ) : null}
          <DepartmentCatalogEditor departments={departments} variant="page" />
        </>
      )}
    </AdminPageShell>
  )
}

export default AdminDepartments
