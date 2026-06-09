import React, { useState } from 'react'
import { Mail, UserPlus } from 'lucide-react'
import clsx from 'clsx'
import type { VendorDetail } from '@/types'
import { Button } from '@/components/ui/Button'

type VendorProfileUsersProps = {
  vendor: VendorDetail
  onInvite: (data: { email: string; name?: string }) => void
  invitePending: boolean
}

export function VendorProfileUsers({ vendor, onInvite, invitePending }: VendorProfileUsersProps) {
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')

  const handleInvite = () => {
    if (!inviteEmail.trim()) return
    onInvite({ email: inviteEmail.trim(), name: inviteName.trim() || undefined })
    setInviteEmail('')
    setInviteName('')
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <UserPlus size={18} className="text-primary dark:text-white" />
          <h2 className="text-sm font-bold text-primary dark:text-white">
            Portal users ({vendor.users.length})
          </h2>
        </div>
        {vendor.users.length === 0 ? (
          <p className="text-sm text-muted-foreground mb-4">
            No portal users yet. Invite a contact to access the vendor portal.
          </p>
        ) : (
          <ul className="rounded-xl border border-primary/10 dark:border-white/10 divide-y divide-primary/5 dark:divide-white/5 overflow-hidden mb-6">
            {vendor.users.map((u) => (
              <li
                key={u.uid}
                className="flex justify-between items-center gap-4 py-3 px-4 bg-white dark:bg-white/[0.02]"
              >
                <div className="min-w-0">
                  <p className="font-bold text-sm text-primary dark:text-white">{u.name}</p>
                  <p className="text-xs text-primary/50 dark:text-white/50 flex items-center gap-1">
                    <Mail size={12} /> {u.email}
                  </p>
                </div>
                <span
                  className={clsx(
                    'text-[10px] font-bold uppercase px-2 py-0.5 rounded shrink-0',
                    u.status === 'DISABLED'
                      ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                  )}
                >
                  {u.status ?? 'ACTIVE'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="p-4 rounded-xl border border-dashed border-primary/15 dark:border-white/15 bg-primary/[0.02] dark:bg-black/20 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-primary/50 dark:text-white/50">
          Invite new user
        </h3>
        <div className="flex flex-wrap gap-2">
          <input
            className="flex-1 min-w-[180px] px-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-white dark:bg-white/[0.02] text-sm font-medium text-primary dark:text-white outline-none focus:border-primary"
            placeholder="Email"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <input
            className="flex-1 min-w-[140px] px-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-white dark:bg-white/[0.02] text-sm font-medium text-primary dark:text-white outline-none focus:border-primary"
            placeholder="Name (optional)"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
          />
          <Button
            type="button"
            onClick={handleInvite}
            disabled={!inviteEmail.trim() || invitePending}
            isLoading={invitePending}
          >
            Invite user
          </Button>
        </div>
      </div>
    </div>
  )
}
