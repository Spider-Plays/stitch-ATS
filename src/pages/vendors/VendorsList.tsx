import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, Store } from 'lucide-react'
import { api } from '../../services/api'
import { ListSearchBar } from '../../components/ui/ListSearchBar'
import { matchesAnySearch } from '../../lib/textSearch'
import clsx from 'clsx'
import type { Vendor } from '../../types'
import { ApiError } from '../../lib/apiClient'

const statusClass: Record<Vendor['status'], string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  INACTIVE: 'bg-slate-100 text-slate-600 border-slate-200',
  SUSPENDED: 'bg-red-100 text-red-700 border-red-200',
}

const VendorsList = () => {
  const [search, setSearch] = useState('')
    const { data: vendors = [], isLoading, isError, error } = useQuery({
        queryKey: ['vendors'],
        queryFn: api.vendors.list,
    })

  const filtered = useMemo(
    () =>
      vendors.filter((v) =>
        matchesAnySearch([v.name, v.code, v.email, v.contactName, v.status], search)
      ),
    [vendors, search]
  )

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary dark:text-white tracking-tight">
            Vendor management
          </h1>
          <p className="text-primary/60 dark:text-white/60 font-medium mt-1">
            Manage staffing vendors, job assignments, and portal access.
          </p>
        </div>
        <Link
          to="/vendors/new"
          className="flex items-center gap-2 px-6 py-3 bg-primary dark:bg-white text-white dark:text-primary rounded-xl font-bold text-sm hover:opacity-90"
        >
          <Plus size={18} /> Add vendor
        </Link>
      </div>

      <ListSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search vendors..."
        className="max-w-md"
      />

      {isError ? (
        <div className="p-8 rounded-2xl border border-red-200 bg-red-50 text-center">
          <p className="font-bold text-red-800">Could not load vendors</p>
          <p className="text-sm text-red-600 mt-2">
            {error instanceof ApiError
              ? error.status === 404
                ? 'Vendor API is unavailable. Restart the API server (npm run dev:server).'
                : error.message.includes('prisma') || error.message.includes('generate')
                  ? 'Restart the API server after: cd server && npx prisma generate'
                  : error.message
              : 'Unknown error'}
          </p>
        </div>
      ) : isLoading ? (
        <p className="text-center py-12 text-primary/40">Loading vendors...</p>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-primary/20 rounded-2xl">
          <Store className="mx-auto text-primary/30 mb-3" size={40} />
          <p className="font-medium text-primary/50">No vendors found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((v) => (
            <Link
              key={v.id}
              to={`/vendors/${v.id}`}
              className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-primary/10 dark:border-white/10 hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Store className="text-emerald-700" size={20} />
                </div>
                <span
                  className={clsx(
                    'px-2 py-0.5 rounded text-[10px] font-bold uppercase border',
                    statusClass[v.status]
                  )}
                >
                  {v.status}
                </span>
              </div>
              <h3 className="font-bold text-primary dark:text-white">{v.name}</h3>
              {v.code && (
                <p className="text-xs font-mono text-primary/50 mt-0.5">{v.code}</p>
              )}
              <p className="text-sm text-primary/60 mt-2 truncate">{v.email}</p>
              <div className="flex gap-4 mt-4 text-xs font-bold text-primary/50">
                <span>{v.assignmentCount ?? 0} jobs</span>
                <span>{v.submissionCount ?? 0} submissions</span>
                <span>{v.userCount ?? 0} users</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default VendorsList
