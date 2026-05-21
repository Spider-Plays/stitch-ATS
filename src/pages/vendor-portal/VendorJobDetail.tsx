import React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '../../services/api'
import { useToastStore } from '../../store/toastStore'
import { ApiError } from '../../lib/apiClient'
import clsx from 'clsx'

const requiredString = (label: string) => z.string().min(1, `${label} is required`)

const schema = z.object({
  name: requiredString('Full name'),
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  phone: requiredString('Phone'),
  location: requiredString('Location'),
  pan: z
    .string()
    .min(1, 'PAN is required')
    .refine((v) => /^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(v.trim()), 'Invalid PAN format'),
  totalExperience: requiredString('Experience'),
  currentCompany: requiredString('Current company'),
  currentCTC: requiredString('Current CTC'),
  expectedCTC: requiredString('Expected CTC'),
  noticePeriod: requiredString('Notice period'),
  linkedin: z.string().url('Invalid URL').optional().or(z.literal('')),
  portfolio: z.string().url('Invalid URL').optional().or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

function FieldLabel({ children, required = true }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-0.5">
      {required && <span className="text-red-500">*</span>}
      {children}
    </label>
  )
}

const VendorJobDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToast } = useToastStore()

  const { data: job, isLoading } = useQuery({
    queryKey: ['vendor-portal-position', id],
    queryFn: () => api.vendorPortal.getPosition(id!),
    enabled: !!id,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const submitMutation = useMutation({
    mutationFn: (data: FormValues) =>
      api.vendorPortal.submitCandidate(id!, {
        ...data,
        role: job!.title,
        pan: data.pan.trim().toUpperCase(),
        linkedIn: data.linkedin?.trim() || undefined,
        portfolio: data.portfolio?.trim() || undefined,
      }),
    onSuccess: () => {
      addToast('Candidate submitted successfully', 'success')
      navigate('/vendor-portal/submissions')
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Submission failed'
      addToast(msg, 'error')
    },
  })

  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-medium focus:border-emerald-600 outline-none'

  if (isLoading) return <div className="p-12 text-center text-slate-500">Loading...</div>
  if (!job) return <div className="p-12 text-center">Job not found</div>

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Link
        to="/vendor-portal/positions"
        className="text-sm font-bold text-slate-500 hover:text-emerald-700"
      >
        ← Back to jobs
      </Link>

      <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-slate-200 dark:border-white/10">
        <p className="text-[10px] font-bold uppercase text-emerald-700">{job.jobCode}</p>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{job.title}</h1>
        <p className="text-sm text-slate-500 mt-2">
          {job.client ? `${job.client} · ` : ''}
          {job.department}
          {job.location ? ` · ${job.location}` : ''}
        </p>
        {job.description && (
          <p className="text-sm text-slate-600 mt-4 whitespace-pre-wrap">{job.description}</p>
        )}
      </div>

      <form
        onSubmit={handleSubmit((d) => submitMutation.mutate(d))}
        className="bg-white dark:bg-white/5 p-8 rounded-2xl border border-slate-200 dark:border-white/10 space-y-6"
      >
        <h2 className="font-bold text-lg text-slate-900 dark:text-white">Submit candidate</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <FieldLabel>Full name</FieldLabel>
            <input className={inputClass} {...register('name')} />
            {errors.name && <p className="text-xs text-red-500 font-bold">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <FieldLabel>Email</FieldLabel>
            <input className={inputClass} type="email" {...register('email')} />
            {errors.email && <p className="text-xs text-red-500 font-bold">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <FieldLabel>Phone</FieldLabel>
            <input className={inputClass} {...register('phone')} />
            {errors.phone && <p className="text-xs text-red-500 font-bold">{errors.phone.message}</p>}
          </div>
          <div className="space-y-2">
            <FieldLabel>PAN</FieldLabel>
            <input className={clsx(inputClass, 'uppercase')} maxLength={10} {...register('pan')} />
            {errors.pan && <p className="text-xs text-red-500 font-bold">{errors.pan.message}</p>}
          </div>
          <div className="space-y-2">
            <FieldLabel>Location</FieldLabel>
            <input className={inputClass} {...register('location')} />
            {errors.location && (
              <p className="text-xs text-red-500 font-bold">{errors.location.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <FieldLabel>Total experience</FieldLabel>
            <input className={inputClass} {...register('totalExperience')} />
            {errors.totalExperience && (
              <p className="text-xs text-red-500 font-bold">{errors.totalExperience.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <FieldLabel>Current company</FieldLabel>
            <input className={inputClass} {...register('currentCompany')} />
            {errors.currentCompany && (
              <p className="text-xs text-red-500 font-bold">{errors.currentCompany.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <FieldLabel>Current CTC</FieldLabel>
            <input className={inputClass} {...register('currentCTC')} />
            {errors.currentCTC && (
              <p className="text-xs text-red-500 font-bold">{errors.currentCTC.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <FieldLabel>Expected CTC</FieldLabel>
            <input className={inputClass} {...register('expectedCTC')} />
            {errors.expectedCTC && (
              <p className="text-xs text-red-500 font-bold">{errors.expectedCTC.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <FieldLabel>Notice period</FieldLabel>
            <input className={inputClass} {...register('noticePeriod')} />
            {errors.noticePeriod && (
              <p className="text-xs text-red-500 font-bold">{errors.noticePeriod.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <FieldLabel required={false}>LinkedIn</FieldLabel>
            <input className={inputClass} {...register('linkedin')} />
            {errors.linkedin && (
              <p className="text-xs text-red-500 font-bold">{errors.linkedin.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <FieldLabel required={false}>Portfolio</FieldLabel>
            <input className={inputClass} {...register('portfolio')} />
            {errors.portfolio && (
              <p className="text-xs text-red-500 font-bold">{errors.portfolio.message}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitMutation.isPending}
          className="w-full py-4 bg-emerald-700 text-white rounded-xl font-bold text-sm hover:bg-emerald-800 disabled:opacity-50"
        >
          {submitMutation.isPending ? 'Submitting...' : 'Submit candidate'}
        </button>
      </form>
    </div>
  )
}

export default VendorJobDetail
