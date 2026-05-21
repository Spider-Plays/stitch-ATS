import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { api } from '../../services/api'
import { useToastStore } from '../../store/toastStore'
import { ApiError } from '../../lib/apiClient'

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

function FieldLabel({ children, required = true }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-xs font-bold text-primary/60 uppercase tracking-wider flex items-center gap-0.5">
      {required && <span className="text-red-500">*</span>}
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
      if (res.temporaryPassword) {
        addToast(`Portal password (email not sent): ${res.temporaryPassword}`, 'info')
      }
      navigate(`/vendors/${res.vendor.id}`)
    },
    onError: (err: unknown) => {
      addToast(err instanceof ApiError ? err.message : 'Failed to create vendor', 'error')
    },
  })

  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-primary/10 bg-primary/[0.02] font-medium text-primary dark:text-white outline-none focus:border-primary'

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link to="/vendors" className="p-2 hover:bg-primary/5 rounded-full">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="text-2xl font-black text-primary dark:text-white">Add vendor</h1>
      </div>

      <form
        onSubmit={handleSubmit((d) => createMutation.mutate(d))}
        className="bg-white dark:bg-white/5 p-8 rounded-2xl border border-primary/10 space-y-6"
      >
        <div className="space-y-2">
          <FieldLabel>Vendor name</FieldLabel>
          <input className={inputClass} {...register('name')} />
          {errors.name && <p className="text-xs text-red-500 font-bold">{errors.name.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <FieldLabel required={false}>Vendor code</FieldLabel>
            <input className={inputClass} placeholder="e.g. ACME" {...register('code')} />
          </div>
          <div className="space-y-2">
            <FieldLabel>Primary email</FieldLabel>
            <input className={inputClass} type="email" {...register('email')} />
            {errors.email && <p className="text-xs text-red-500 font-bold">{errors.email.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <FieldLabel required={false}>Phone</FieldLabel>
            <input className={inputClass} {...register('phone')} />
          </div>
          <div className="space-y-2">
            <FieldLabel required={false}>Contact name</FieldLabel>
            <input className={inputClass} {...register('contactName')} />
          </div>
        </div>
        <div className="space-y-2">
          <FieldLabel required={false}>Website</FieldLabel>
          <input className={inputClass} {...register('website')} />
        </div>
        <div className="space-y-2">
          <FieldLabel required={false}>Address</FieldLabel>
          <textarea className={inputClass} rows={2} {...register('address')} />
        </div>
        <div className="space-y-2">
          <FieldLabel required={false}>Notes</FieldLabel>
          <textarea className={inputClass} rows={2} {...register('notes')} />
        </div>

        <label className="flex items-center gap-2 text-sm font-medium text-primary">
          <input type="checkbox" {...register('inviteContact')} className="rounded" />
          Invite primary contact to vendor portal
        </label>
        {inviteContact && (
          <div className="space-y-2 pl-4 border-l-2 border-primary/10">
            <FieldLabel required={false}>Invite email (defaults to primary)</FieldLabel>
            <input className={inputClass} type="email" {...register('contactEmail')} />
          </div>
        )}

        <button
          type="submit"
          disabled={createMutation.isPending}
          className="w-full py-4 bg-primary dark:bg-white text-white dark:text-primary rounded-xl font-bold disabled:opacity-50"
        >
          {createMutation.isPending ? 'Creating...' : 'Create vendor'}
        </button>
      </form>
    </div>
  )
}

export default NewVendor
