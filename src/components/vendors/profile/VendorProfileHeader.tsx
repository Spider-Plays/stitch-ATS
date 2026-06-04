import React from 'react'
import {
  Edit2,
  Globe,
  Mail,
  MapPin,
  Phone,
  Store,
  Users,
} from 'lucide-react'
import clsx from 'clsx'
import type { VendorDetail, VendorStatus } from '../../../types'
import { vendorStatusClass, vendorStatusLabel } from '../../../lib/vendorPage'
import {
  VENDOR_PROFILE_INPUT,
  VENDOR_PROFILE_LABEL,
  vendorInitials,
} from '../../../lib/vendorProfilePage'
import { AppSelect } from '../../ui/AppSelect'
import { VENDOR_STATUS_OPTIONS } from '../../../lib/selectOptions'

type FieldProps = { label: string; children: React.ReactNode; required?: boolean }

function Field({ label, children, required }: FieldProps) {
  return (
    <div>
      <label className={VENDOR_PROFILE_LABEL}>
        {required && <span className="text-red-500 mr-0.5">*</span>}
        {label}
      </label>
      {children}
    </div>
  )
}

type VendorProfileHeaderProps = {
  vendor: VendorDetail
  displayName: string
  isEditing: boolean
  editName: string
  editCode: string
  editEmail: string
  setEditName: (v: string) => void
  setEditCode: (v: string) => void
  setEditEmail: (v: string) => void
  canEdit: boolean
  isSaving: boolean
  statusPending: boolean
  onStartEdit: () => void
  onCancelEdit: () => void
  onSave: () => void
  onStatusChange: (status: VendorStatus) => void
}

export function VendorProfileHeader({
  vendor,
  displayName,
  isEditing,
  editName,
  editCode,
  editEmail,
  setEditName,
  setEditCode,
  setEditEmail,
  canEdit,
  isSaving,
  statusPending,
  onStartEdit,
  onCancelEdit,
  onSave,
  onStatusChange,
}: VendorProfileHeaderProps) {
  return (
    <header className="rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm overflow-hidden">
      <div className="p-6 md:p-8">
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
          <div className="flex gap-4 md:gap-5 min-w-0 flex-1">
            <div
              className={clsx(
                'shrink-0 size-16 md:size-20 rounded-2xl flex items-center justify-center font-black text-2xl md:text-3xl',
                vendor.status === 'ACTIVE'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : vendor.status === 'SUSPENDED'
                    ? 'bg-red-500/10 text-red-700 dark:text-red-300'
                    : 'bg-primary/10 dark:bg-white/10 text-primary dark:text-white'
              )}
            >
              {vendorInitials(displayName)}
            </div>

            {isEditing ? (
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                <Field label="Vendor name" required>
                  <input
                    className={VENDOR_PROFILE_INPUT}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </Field>
                <Field label="Vendor code">
                  <input
                    className={VENDOR_PROFILE_INPUT}
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                    placeholder="e.g. ACME"
                  />
                </Field>
                <Field label="Primary email" required>
                  <input
                    type="email"
                    className={VENDOR_PROFILE_INPUT}
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                  />
                </Field>
              </div>
            ) : (
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl md:text-page-title truncate">
                    {displayName}
                  </h1>
                  {vendor.code && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-primary/5 dark:bg-white/10 text-primary/70 dark:text-white/60">
                      {vendor.code}
                    </span>
                  )}
                  <span
                    className={clsx(
                      'shrink-0 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border',
                      vendorStatusClass(vendor.status)
                    )}
                  >
                    {vendorStatusLabel(vendor.status)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-primary/60 dark:text-white/60">
                  <span className="inline-flex items-center gap-1.5 min-w-0">
                    <Mail size={14} className="shrink-0" />
                    <span className="truncate">{vendor.email}</span>
                  </span>
                  {vendor.contactName && (
                    <span className="inline-flex items-center gap-1.5">
                      <Users size={14} />
                      {vendor.contactName}
                    </span>
                  )}
                  {vendor.phone && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone size={14} />
                      {vendor.phone}
                    </span>
                  )}
                  {vendor.website && (
                    <a
                      href={
                        vendor.website.startsWith('http')
                          ? vendor.website
                          : `https://${vendor.website}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 hover:text-primary dark:hover:text-white"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Globe size={14} />
                      Website
                    </a>
                  )}
                  {vendor.address && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={14} />
                      {vendor.address}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {canEdit && !isEditing && (
              <button
                type="button"
                onClick={onStartEdit}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary/10 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-bold text-primary dark:text-white hover:bg-primary/5 dark:hover:bg-white/10 transition-colors"
              >
                <Edit2 size={16} />
                Edit
              </button>
            )}
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={onCancelEdit}
                  disabled={isSaving}
                  className="px-4 py-2.5 rounded-xl border border-primary/10 dark:border-white/10 text-sm font-bold text-primary dark:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onSave}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50"
                >
                  {isSaving ? 'Saving…' : 'Save'}
                </button>
              </>
            ) : (
              <AppSelect
                value={vendor.status}
                onChange={(v) => onStatusChange(v as VendorStatus)}
                options={VENDOR_STATUS_OPTIONS}
                disabled={statusPending || !canEdit}
                aria-label="Vendor status"
              />
            )}
          </div>
        </div>

        {!isEditing && (
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Store size={14} />
            Staffing partner · Added{' '}
            {new Date(vendor.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        )}
      </div>
    </header>
  )
}
