import React from 'react'
import type { VendorDetail } from '../../../types'
import { VENDOR_PROFILE_INPUT, VENDOR_PROFILE_LABEL } from '../../../lib/vendorProfilePage'

type FieldProps = { label: string; children: React.ReactNode }

function Field({ label, children }: FieldProps) {
  return (
    <div>
      <label className={VENDOR_PROFILE_LABEL}>{label}</label>
      {children}
    </div>
  )
}

type VendorProfileOverviewProps = {
  vendor: VendorDetail
  isEditing: boolean
  editPhone: string
  editWebsite: string
  editAddress: string
  editContactName: string
  editNotes: string
  setEditPhone: (v: string) => void
  setEditWebsite: (v: string) => void
  setEditAddress: (v: string) => void
  setEditContactName: (v: string) => void
  setEditNotes: (v: string) => void
}

export function VendorProfileOverview({
  vendor,
  isEditing,
  editPhone,
  editWebsite,
  editAddress,
  editContactName,
  editNotes,
  setEditPhone,
  setEditWebsite,
  setEditAddress,
  setEditContactName,
  setEditNotes,
}: VendorProfileOverviewProps) {
  if (isEditing) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Contact name">
          <input
            className={VENDOR_PROFILE_INPUT}
            value={editContactName}
            onChange={(e) => setEditContactName(e.target.value)}
          />
        </Field>
        <Field label="Phone">
          <input
            className={VENDOR_PROFILE_INPUT}
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
          />
        </Field>
        <Field label="Website">
          <input
            className={VENDOR_PROFILE_INPUT}
            value={editWebsite}
            onChange={(e) => setEditWebsite(e.target.value)}
            placeholder="https://"
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Address">
            <textarea
              className={VENDOR_PROFILE_INPUT}
              rows={2}
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Internal notes">
            <textarea
              className={VENDOR_PROFILE_INPUT}
              rows={3}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
            />
          </Field>
        </div>
      </div>
    )
  }

  const rows: { label: string; value?: string | null }[] = [
    { label: 'Primary email', value: vendor.email },
    { label: 'Contact name', value: vendor.contactName },
    { label: 'Phone', value: vendor.phone },
    { label: 'Website', value: vendor.website },
    { label: 'Address', value: vendor.address },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-bold text-primary dark:text-white mb-4">Company details</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          {rows.map((row) => (
            <div key={row.label}>
              <dt className={VENDOR_PROFILE_LABEL}>{row.label}</dt>
              <dd className="text-sm font-medium text-primary dark:text-white">
                {row.value?.trim() ? (
                  row.label === 'Website' ? (
                    <a
                      href={row.value.startsWith('http') ? row.value : `https://${row.value}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary dark:text-white underline decoration-primary/30"
                    >
                      {row.value}
                    </a>
                  ) : (
                    row.value
                  )
                ) : (
                  <span className="text-primary/35 dark:text-white/35">—</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {vendor.notes?.trim() ? (
        <div className="p-4 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-black/20">
          <h3 className={VENDOR_PROFILE_LABEL}>Internal notes</h3>
          <p className="text-sm text-primary/80 dark:text-white/80 whitespace-pre-wrap">
            {vendor.notes}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No internal notes.</p>
      )}
    </div>
  )
}
