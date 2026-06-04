import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { useToastStore } from '../../store/toastStore'
import { useConfirm } from '../../hooks/useConfirm'
import { ApiError } from '../../lib/apiClient'
import type { ClientCatalogItem } from '../../services/http/clients'
import clsx from 'clsx'

type ClientCatalogEditorProps = {
  clients: ClientCatalogItem[]
  variant?: 'page' | 'modal'
}

export function ClientCatalogEditor({ clients, variant = 'page' }: ClientCatalogEditorProps) {
  const queryClient = useQueryClient()
  const { addToast } = useToastStore()
  const confirm = useConfirm()
  const [newName, setNewName] = useState('')

  const createMutation = useMutation({
    mutationFn: () => api.clients.create(newName),
    onSuccess: () => {
      setNewName('')
      queryClient.invalidateQueries({ queryKey: ['client-catalog'] })
      addToast('Client added', 'success')
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Failed to add client'
      addToast(msg, 'error')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.clients.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-catalog'] })
      addToast('Client removed', 'success')
    },
    onError: () => addToast('Failed to remove client', 'error'),
  })

  return (
    <div className={variant === 'page' ? 'space-y-6' : ''}>
      <div
        className={clsx(
          variant === 'page'
            ? 'app-card p-6'
            : 'px-6 py-4 border-b border-primary/10 dark:border-white/10 space-y-3'
        )}
      >
        <p className="text-xs font-bold text-primary/50 dark:text-white/50 uppercase tracking-wider">
          Add client
        </p>
        <div className="flex gap-2 mt-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Acme Corp"
            className="flex-1 px-3 py-2 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] text-sm font-medium text-primary dark:text-white"
          />
          <button
            type="button"
            disabled={newName.trim().length < 1 || createMutation.isPending}
            onClick={() => createMutation.mutate()}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      <div
        className={clsx(
          variant === 'page'
            ? 'app-card p-6'
            : 'flex-1 overflow-y-auto px-6 py-4 custom-scrollbar'
        )}
      >
        <p className="text-xs font-bold text-primary/50 dark:text-white/50 uppercase tracking-wider mb-4">
          {clients.length} client{clients.length === 1 ? '' : 's'}
        </p>
        <ul className="flex flex-wrap gap-2">
          {clients.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-1 pl-3 pr-1 py-1.5 rounded-full bg-primary/5 dark:bg-white/10 border border-primary/10 dark:border-white/10 text-sm font-bold text-primary dark:text-white"
            >
              {c.name}
              <button
                type="button"
                onClick={async () => {
                  const ok = await confirm({
                    title: 'Remove client',
                    message: `Remove "${c.name}" from the catalog?`,
                    confirmLabel: 'Remove',
                    variant: 'danger',
                  })
                  if (ok) deleteMutation.mutate(c.id)
                }}
                className={clsx(
                  'p-0.5 rounded-full text-primary/40 hover:text-red-500',
                  deleteMutation.isPending && 'opacity-50'
                )}
                aria-label={`Remove ${c.name}`}
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
