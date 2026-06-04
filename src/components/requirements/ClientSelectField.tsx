import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import { SearchableSelect } from '../ui/SearchableSelect'

type ClientSelectFieldProps = {
  value: string
  onChange: (value: string) => void
  error?: string
  /** Show link to admin catalog (for staff who cannot add clients on this form). */
  showAdminLink?: boolean
}

export function ClientSelectField({
  value,
  onChange,
  error,
  showAdminLink = true,
}: ClientSelectFieldProps) {
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['client-catalog'],
    queryFn: api.clients.list,
  })

  const options = useMemo(
    () => clients.map((c) => ({ value: c.name, label: c.name })),
    [clients]
  )

  return (
    <div className="space-y-2">
      <SearchableSelect
        value={value}
        onChange={onChange}
        options={options}
        placeholder={isLoading ? 'Loading clients…' : 'Select one client'}
        searchPlaceholder="Search clients…"
        emptyLabel={
          clients.length === 0
            ? 'No clients in catalog — ask an admin to add them.'
            : 'No matching client'
        }
        allowClear={false}
      />
      <p className="text-[11px] text-primary/50 dark:text-white/50">
        One client per job requirement. Choose from the catalog only.
      </p>
      {error && <p className="text-xs font-bold text-red-500">{error}</p>}

      {showAdminLink && (
        <Link
          to="/admin/clients"
          className="inline-block text-[10px] font-bold text-primary/60 dark:text-white/60 hover:underline"
        >
          Manage client catalog in Admin →
        </Link>
      )}

      {clients.length === 0 && !isLoading && (
        <p className="text-xs text-primary/50 dark:text-white/50">
          An admin must add clients under Admin → Clients before you can post a job.
        </p>
      )}
    </div>
  )
}
