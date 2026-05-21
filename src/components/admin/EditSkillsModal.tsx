import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { useToastStore } from '../../store/toastStore'
import { ApiError } from '../../lib/apiClient'
import type { SkillCatalogItem } from '../../services/http/skills'
import clsx from 'clsx'

type EditSkillsModalProps = {
  open: boolean
  onClose: () => void
  skills: SkillCatalogItem[]
}

export function EditSkillsModal({ open, onClose, skills }: EditSkillsModalProps) {
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

  if (!open) return null

  const byCategory = skills.reduce<Record<string, SkillCatalogItem[]>>((acc, s) => {
    const cat = s.category || 'General'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-lg max-h-[85vh] rounded-2xl shadow-xl border border-primary/10 dark:border-white/10 flex flex-col"
        role="dialog"
        aria-labelledby="edit-skills-title"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-primary/10 dark:border-white/10">
          <div>
            <h2 id="edit-skills-title" className="text-lg font-black text-primary dark:text-white">
              Edit skill catalog
            </h2>
            <p className="text-xs text-primary/50 dark:text-white/50 mt-0.5">
              Admin only — skills appear in candidate and requirement dropdowns.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-primary/5 dark:hover:bg-white/5 text-primary/60"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="px-6 py-4 border-b border-primary/10 dark:border-white/10 space-y-3">
          <p className="text-xs font-bold text-primary/50 uppercase tracking-wider">Add skill</p>
          <div className="flex flex-col sm:flex-row gap-2">
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

        <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar space-y-4">
          {Object.keys(byCategory)
            .sort()
            .map((cat) => (
              <div key={cat}>
                <p className="text-xs font-bold text-primary/40 uppercase tracking-wider mb-2">{cat}</p>
                <ul className="flex flex-wrap gap-2">
                  {byCategory[cat].map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center gap-1 pl-3 pr-1 py-1 rounded-full bg-primary/5 dark:bg-white/10 border border-primary/10 dark:border-white/10 text-xs font-bold text-primary dark:text-white"
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

        <div className="px-6 py-4 border-t border-primary/10 dark:border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-primary/10 dark:bg-white/10 text-sm font-bold text-primary dark:text-white"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
