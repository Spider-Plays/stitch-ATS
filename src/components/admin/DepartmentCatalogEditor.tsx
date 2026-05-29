import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { useToastStore } from '../../store/toastStore'
import { ApiError } from '../../lib/apiClient'
import type { DepartmentCatalogItem } from '../../services/http/departments'
import clsx from 'clsx'

type DepartmentCatalogEditorProps = {
  departments: DepartmentCatalogItem[]
  variant?: 'page' | 'modal'
}

export function DepartmentCatalogEditor({ departments, variant = 'page' }: DepartmentCatalogEditorProps) {
  const queryClient = useQueryClient()
  const { addToast } = useToastStore()
  const [newName, setNewName] = useState('')

  const createMutation = useMutation({
    mutationFn: () => api.departments.create(newName),
    onSuccess: () => {
      setNewName('')
      queryClient.invalidateQueries({ queryKey: ['department-catalog'] })
      addToast('Department added', 'success')
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Failed to add department'
      addToast(msg, 'error')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.departments.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department-catalog'] })
      addToast('Department removed', 'success')
    },
    onError: () => addToast('Failed to remove department', 'error'),
  })

  return (
    <div className={variant === 'page' ? 'space-y-6' : ''}>
      <div className={clsx(
        variant === 'page'
          ? 'bg-white dark:bg-white/5 rounded-2xl border border-primary/10 dark:border-white/10 p-6'
          : 'px-6 py-4 border-b border-primary/10 dark:border-white/10 space-y-3'
      )}>
        <p className="text-xs font-bold text-primary/50 dark:text-white/50 uppercase tracking-wider">
          Add department
        </p>
        <div className="flex gap-2 mt-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Engineering"
            className="flex-1 px-3 py-2 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] text-sm font-medium text-primary dark:text-white"
          />
          <button
            type="button"
            disabled={newName.trim().length < 1 || createMutation.isPending}
            onClick={() => createMutation.mutate()}
            className="px-4 py-2 rounded-xl bg-primary dark:bg-white text-white dark:text-primary text-sm font-bold disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      <div className={clsx(
        variant === 'page'
          ? 'bg-white dark:bg-white/5 rounded-2xl border border-primary/10 dark:border-white/10 p-6'
          : 'flex-1 overflow-y-auto px-6 py-4 custom-scrollbar'
      )}>
        <p className="text-xs font-bold text-primary/50 dark:text-white/50 uppercase tracking-wider mb-4">
          {departments.length} department{departments.length === 1 ? '' : 's'}
        </p>
        <ul className="flex flex-wrap gap-2">
          {departments.map((d) => (
            <li
              key={d.id}
              className="flex items-center gap-1 pl-3 pr-1 py-1.5 rounded-full bg-primary/5 dark:bg-white/10 border border-primary/10 dark:border-white/10 text-sm font-bold text-primary dark:text-white"
            >
              {d.name}
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Remove "${d.name}" from the catalog?`)) {
                    deleteMutation.mutate(d.id)
                  }
                }}
                className={clsx(
                  'p-0.5 rounded-full text-primary/40 hover:text-red-500',
                  deleteMutation.isPending && 'opacity-50'
                )}
                aria-label={`Remove ${d.name}`}
              >
                <span className="material-symbols-outlined !text-sm">close</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
