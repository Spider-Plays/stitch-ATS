import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { ApiError } from '../../lib/apiClient'
import { AdminPageShell } from '../../components/admin/AdminPageShell'
import { ClientCatalogEditor } from '../../components/admin/ClientCatalogEditor'

const AdminClients = () => {
  const { data: clients = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['client-catalog'],
    queryFn: api.clients.list,
    retry: 1,
  })

  const errorMessage =
    error instanceof ApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : 'Could not load clients'

  return (
    <AdminPageShell
      title="Clients"
      description="Client names in this catalog appear when posting job requirements."
    >
      {isLoading && (
        <p className="text-page-desc">Loading clients…</p>
      )}

      {isError && !isLoading && (
        <div className="mb-6 p-4 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200 text-sm space-y-3">
          <p className="font-bold">{errorMessage}</p>
          <p className="text-amber-800/90 dark:text-amber-200/90">
            {error instanceof ApiError && error.status === 503 ? (
              <>
                Stop <code className="text-xs font-mono">npm run dev</code>, run{' '}
                <code className="text-xs font-mono bg-amber-100/80 dark:bg-black/20 px-1 py-0.5 rounded">
                  npm run db:generate --prefix server
                </code>
                , then start dev again.
              </>
            ) : (
              <>
                Run{' '}
                <code className="text-xs font-mono bg-amber-100/80 dark:bg-black/20 px-1 py-0.5 rounded">
                  npx prisma db push
                </code>{' '}
                in the <code className="text-xs font-mono">server</code> folder if this is a new install,
                then restart the API.
              </>
            )}
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
          {clients.length === 0 ? (
            <p className="text-sm text-primary/50 dark:text-white/50 mb-4">
              No clients yet — add your first one below.
            </p>
          ) : null}
          <ClientCatalogEditor clients={clients} variant="page" />
        </>
      )}
    </AdminPageShell>
  )
}

export default AdminClients
