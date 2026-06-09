import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Store, Building2, UserPlus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/services/api'
import { useToastStore } from '@/store/toastStore'
import { ApiError } from '@/lib/apiClient'
import { PageHero } from '@/components/layout/PageHero'
import { VENDOR_PROFILE_INPUT, VENDOR_PROFILE_LABEL } from '@/pages/vendors/detail/vendor-profile.utils'
import './new.css'

const schema = z.object({
  name: z.string().min(1, 'Vendor name is required'),
  code: z.string().max(32).optional(),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  contactName: z.string().optional(),
  notes: z.string().optional(),
  inviteContact: z.boolean().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

function FieldLabel({
  children,
  required = true,
}: {
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <label className={VENDOR_PROFILE_LABEL}>
      {required && <span className="text-red-500 mr-0.5">*</span>}
      {children}
    </label>
  )
}

const NewVendor = () => {
  const navigate = useNavigate()
  const { addToast } = useToastStore()
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { inviteContact: true },
  })

  const inviteContact = watch('inviteContact')

  const createMutation = useMutation({
    mutationFn: (data: FormValues) =>
      api.vendors.create({
        name: data.name,
        code: data.code,
        email: data.email,
        phone: data.phone,
        website: data.website,
        address: data.address,
        contactName: data.contactName,
        notes: data.notes,
        inviteContact: data.inviteContact,
        contactEmail: data.contactEmail || undefined,
      }),
    onSuccess: (res) => {
      addToast('Vendor created', 'success')
      if (res.emailWarning) {
        addToast(
          res.devHint ? `${res.emailWarning} ${res.devHint}` : res.emailWarning,
          'warning'
        )
      }
      navigate(`/vendors/${res.vendor.id}`)
    },
    onError: (err: unknown) => {
      addToast(err instanceof ApiError ? err.message : 'Failed to create vendor', 'error')
    },
  })

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <PageHero
        icon={Store}
        eyebrow="New partner"
        title="Add vendor"
        description="Create a staffing vendor and optionally invite their primary contact to the portal."
      />

      <form
        onSubmit={handleSubmit((d) => createMutation.mutate(d))}
        className="space-y-6"
      >
        <section className="bg-white dark:bg-white/5 p-6 md:p-8 rounded-2xl border border-primary/10 dark:border-white/10 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-primary/10 dark:border-white/10">
            <Building2 size={18} className="text-primary dark:text-white" />
            <h2 className="text-sm font-bold text-primary dark:text-white">Company</h2>
          </div>
          <div className="space-y-2">
            <FieldLabel>Vendor name</FieldLabel>
            <input className={VENDOR_PROFILE_INPUT} {...register('name')} />
            {errors.name && (
              <p className="text-xs text-red-500 font-bold">{errors.name.message}</p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <FieldLabel required={false}>Vendor code</FieldLabel>
              <input className={VENDOR_PROFILE_INPUT} placeholder="e.g. ACME" {...register('code')} />
            </div>
            <div className="space-y-2">
              <FieldLabel>Primary email</FieldLabel>
              <input className={VENDOR_PROFILE_INPUT} type="email" {...register('email')} />
              {errors.email && (
                <p className="text-xs text-red-500 font-bold">{errors.email.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <FieldLabel required={false}>Phone</FieldLabel>
              <input className={VENDOR_PROFILE_INPUT} {...register('phone')} />
            </div>
            <div className="space-y-2">
              <FieldLabel required={false}>Contact name</FieldLabel>
              <input className={VENDOR_PROFILE_INPUT} {...register('contactName')} />
            </div>
          </div>
          <div className="space-y-2">
            <FieldLabel required={false}>Website</FieldLabel>
            <input className={VENDOR_PROFILE_INPUT} {...register('website')} />
          </div>
          <div className="space-y-2">
            <FieldLabel required={false}>Address</FieldLabel>
            <textarea className={VENDOR_PROFILE_INPUT} rows={2} {...register('address')} />
          </div>
          <div className="space-y-2">
            <FieldLabel required={false}>Internal notes</FieldLabel>
            <textarea className={VENDOR_PROFILE_INPUT} rows={2} {...register('notes')} />
          </div>
        </section>

        <section className="bg-white dark:bg-white/5 p-6 md:p-8 rounded-2xl border border-primary/10 dark:border-white/10 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-primary/10 dark:border-white/10">
            <UserPlus size={18} className="text-primary dark:text-white" />
            <h2 className="text-sm font-bold text-primary dark:text-white">Portal access</h2>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-primary dark:text-white cursor-pointer">
            <input type="checkbox" {...register('inviteContact')} className="rounded" />
            Invite primary contact to vendor portal
          </label>
          {inviteContact && (
            <div className="space-y-2 pl-4 border-l-2 border-primary/10 dark:border-white/10">
              <FieldLabel required={false}>Invite email (defaults to primary)</FieldLabel>
              <input className={VENDOR_PROFILE_INPUT} type="email" {...register('contactEmail')} />
            </div>
          )}
        </section>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:items-center gap-3">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full sm:w-auto py-4 px-8 bg-primary text-primary-foreground rounded-xl font-bold disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {createMutation.isPending ? 'Creating…' : 'Create vendor'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default NewVendor
