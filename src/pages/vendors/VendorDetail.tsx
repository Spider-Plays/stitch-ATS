import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { useToastStore } from '../../store/toastStore'
import { ApiError } from '../../lib/apiClient'
import clsx from 'clsx'
import type { VendorStatus } from '../../types'

const VendorDetail = () => {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { addToast } = useToastStore()
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [selectedJobs, setSelectedJobs] = useState<string[]>([])

  const { data: vendor, isLoading } = useQuery({
    queryKey: ['vendor', id],
    queryFn: () => api.vendors.get(id!),
    enabled: !!id,
  })

  const { data: requirements = [] } = useQuery({
    queryKey: ['requirements'],
    queryFn: api.requirements.list,
  })

  const liveJobs = requirements.filter((r) => r.status === 'LIVE')
  const assignedIds = new Set(vendor?.assignments.map((a) => a.requirementId) ?? [])

  const statusMutation = useMutation({
    mutationFn: (status: VendorStatus) => api.vendors.update(id!, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', id] })
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      addToast('Vendor status updated', 'success')
    },
    onError: (err: unknown) =>
      addToast(err instanceof ApiError ? err.message : 'Update failed', 'error'),
  })

  const assignMutation = useMutation({
    mutationFn: () => api.vendors.assignJobs(id!, selectedJobs),
    onSuccess: () => {
      setSelectedJobs([])
      queryClient.invalidateQueries({ queryKey: ['vendor', id] })
      addToast('Jobs assigned', 'success')
    },
    onError: (err: unknown) =>
      addToast(err instanceof ApiError ? err.message : 'Assign failed', 'error'),
  })

  const unassignMutation = useMutation({
    mutationFn: (requirementId: string) => api.vendors.unassignJob(id!, requirementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', id] })
      addToast('Job unassigned', 'success')
    },
  })

  const inviteMutation = useMutation({
    mutationFn: () =>
      api.vendors.inviteUser(id!, {
        email: inviteEmail,
        name: inviteName || undefined,
      }),
    onSuccess: (res) => {
      setInviteEmail('')
      setInviteName('')
      queryClient.invalidateQueries({ queryKey: ['vendor', id] })
      addToast('User invited', 'success')
      if (res.temporaryPassword) {
        addToast(`Temp password: ${res.temporaryPassword}`, 'info')
      }
    },
    onError: (err: unknown) =>
      addToast(err instanceof ApiError ? err.message : 'Invite failed', 'error'),
  })

  if (isLoading) return <div className="p-12 text-center">Loading...</div>
  if (!vendor) return <div className="p-12 text-center">Vendor not found</div>

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link to="/vendors" className="p-2 hover:bg-primary/5 rounded-full">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-primary dark:text-white">{vendor.name}</h1>
          <p className="text-sm text-primary/60">
            {vendor.code && `${vendor.code} · `}
            {vendor.email}
          </p>
        </div>
        <select
          value={vendor.status}
          onChange={(e) => statusMutation.mutate(e.target.value as VendorStatus)}
          className="px-3 py-2 rounded-lg border border-primary/10 text-sm font-bold"
        >
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
          <option value="SUSPENDED">SUSPENDED</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Portal users', value: vendor.users.length },
          { label: 'Assigned jobs', value: vendor.assignments.length },
          { label: 'Submissions', value: vendor.submissions.length },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-white/5 p-4 rounded-xl border border-primary/10 text-center"
          >
            <p className="text-2xl font-black text-primary dark:text-white">{s.value}</p>
            <p className="text-xs font-bold text-primary/50 uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      <section className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-primary/10 space-y-4">
        <h2 className="font-bold text-lg">Assign LIVE jobs</h2>
        <div className="max-h-48 overflow-y-auto space-y-2 border border-primary/10 rounded-xl p-3">
          {liveJobs
            .filter((j) => !assignedIds.has(j.id))
            .map((j) => (
              <label key={j.id} className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedJobs.includes(j.id)}
                  onChange={(e) =>
                    setSelectedJobs((prev) =>
                      e.target.checked ? [...prev, j.id] : prev.filter((x) => x !== j.id)
                    )
                  }
                />
                <span>
                  {j.title} <span className="text-primary/40">({j.jobCode ?? j.id.slice(-6)})</span>
                </span>
              </label>
            ))}
          {liveJobs.filter((j) => !assignedIds.has(j.id)).length === 0 && (
            <p className="text-sm text-primary/40">All LIVE jobs already assigned or none available.</p>
          )}
        </div>
        <button
          type="button"
          disabled={selectedJobs.length === 0 || assignMutation.isPending}
          onClick={() => assignMutation.mutate()}
          className="px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm disabled:opacity-50"
        >
          Assign selected
        </button>

        {vendor.assignments.length > 0 && (
          <ul className="divide-y divide-primary/5 mt-4">
            {vendor.assignments.map((a) => (
              <li key={a.id} className="py-3 flex justify-between items-center gap-4">
                <div>
                  <p className="font-bold text-sm">{a.title}</p>
                  <p className="text-xs text-primary/50">
                    {a.jobCode} · {a.status}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => unassignMutation.mutate(a.requirementId)}
                  className="text-xs font-bold text-red-600 hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-primary/10 space-y-4">
        <h2 className="font-bold text-lg">Portal users</h2>
        <ul className="space-y-2">
          {vendor.users.map((u) => (
            <li
              key={u.uid}
              className="flex justify-between items-center py-2 border-b border-primary/5 last:border-0"
            >
              <div>
                <p className="font-bold text-sm">{u.name}</p>
                <p className="text-xs text-primary/50">{u.email}</p>
              </div>
              <span
                className={clsx(
                  'text-[10px] font-bold uppercase px-2 py-0.5 rounded',
                  u.status === 'DISABLED' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                )}
              >
                {u.status ?? 'ACTIVE'}
              </span>
            </li>
          ))}
          {vendor.users.length === 0 && (
            <p className="text-sm text-primary/40">No portal users yet.</p>
          )}
        </ul>
        <div className="flex flex-wrap gap-2 pt-2">
          <input
            className="flex-1 min-w-[180px] px-3 py-2 rounded-lg border border-primary/10 text-sm"
            placeholder="Email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <input
            className="flex-1 min-w-[140px] px-3 py-2 rounded-lg border border-primary/10 text-sm"
            placeholder="Name (optional)"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
          />
          <button
            type="button"
            onClick={() => inviteMutation.mutate()}
            disabled={!inviteEmail || inviteMutation.isPending}
            className="px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm disabled:opacity-50"
          >
            Invite user
          </button>
        </div>
      </section>

      <section className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-primary/10">
        <h2 className="font-bold text-lg mb-4">Recent submissions</h2>
        {vendor.submissions.length === 0 ? (
          <p className="text-sm text-primary/40">No candidates submitted yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-bold text-primary/50 uppercase">
                <th className="pb-2">Candidate</th>
                <th className="pb-2">Job</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {vendor.submissions.map((s) => (
                <tr key={s.id} className="border-t border-primary/5">
                  <td className="py-2 font-medium">{s.name}</td>
                  <td className="py-2 text-primary/60">{s.jobTitle ?? '—'}</td>
                  <td className="py-2">
                    <span className="text-[10px] font-bold uppercase">{s.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}

export default VendorDetail
