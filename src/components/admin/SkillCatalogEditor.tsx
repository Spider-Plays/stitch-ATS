import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { useToastStore } from '../../store/toastStore'
import { ApiError } from '../../lib/apiClient'
import type { SkillCatalogItem } from '../../services/http/skills'
import clsx from 'clsx'

type SkillCatalogEditorProps = {
  skills: SkillCatalogItem[]
  variant?: 'page' | 'modal'
}

export function SkillCatalogEditor({ skills, variant = 'page' }: SkillCatalogEditorProps) {
  const queryClient = useQueryClient()
  const { addToast } = useToastStore()
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState('General')

  const createMutation = useMutation({
    mutationFn: () => api.skills.create(newName, newCategory),
    onSuccess: () => {
      setNewName('')
      queryClient.invalidateQueries({ queryKey: ['skill-catalog'] })
      addToast('Skill added', 'success')
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Failed to add skill'
      addToast(msg, 'error')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.skills.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skill-catalog'] })
      addToast('Skill removed', 'success')
    },
    onError: () => addToast('Failed to remove skill', 'error'),
  })

  const byCategory = skills.reduce<Record<string, SkillCatalogItem[]>>((acc, s) => {
    const cat = s.category || 'General'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  return (
    <div className={variant === 'page' ? 'space-y-6' : ''}>
      <div className={clsx(
        variant === 'page'
          ? 'bg-white dark:bg-white/5 rounded-2xl border border-primary/10 dark:border-white/10 p-6'
          : 'px-6 py-4 border-b border-primary/10 dark:border-white/10 space-y-3'
      )}>
        <p className="text-xs font-bold text-primary/50 dark:text-white/50 uppercase tracking-wider">
          Add skill
        </p>
        <div className="flex flex-col sm:flex-row gap-2 mt-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Apache Airflow"
            className="flex-1 px-3 py-2 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] text-sm font-medium text-primary dark:text-white"
          />
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Category"
            className="sm:w-36 px-3 py-2 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] text-sm font-medium text-primary dark:text-white"
          />
          <button
            type="button"
            disabled={newName.trim().length < 2 || createMutation.isPending}
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
          : 'flex-1 overflow-y-auto px-6 py-4 custom-scrollbar space-y-4'
      )}>
        {Object.keys(byCategory)
          .sort()
          .map((cat) => (
            <div key={cat} className={variant === 'page' ? 'mb-6 last:mb-0' : ''}>
              <p className="text-xs font-bold text-primary/40 dark:text-white/40 uppercase tracking-wider mb-2">
                {cat}
              </p>
              <ul className="flex flex-wrap gap-2">
                {byCategory[cat].map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center gap-1 pl-3 pr-1 py-1.5 rounded-full bg-primary/5 dark:bg-white/10 border border-primary/10 dark:border-white/10 text-sm font-bold text-primary dark:text-white"
                  >
                    {s.name}
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Remove "${s.name}" from the catalog?`)) {
                          deleteMutation.mutate(s.id)
                        }
                      }}
                      className={clsx(
                        'p-0.5 rounded-full text-primary/40 hover:text-red-500',
                        deleteMutation.isPending && 'opacity-50'
                      )}
                      aria-label={`Remove ${s.name}`}
                    >
                      <span className="material-symbols-outlined !text-sm">close</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </div>
    </div>
  )
}
