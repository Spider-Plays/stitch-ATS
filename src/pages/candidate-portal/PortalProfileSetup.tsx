import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../services/api'
import { useToastStore } from '../../store/toastStore'
import { ApiError } from '../../lib/apiClient'
import clsx from 'clsx'

const requiredString = (label: string) => z.string().min(1, `${label} is required`)

const schema = z.object({
  firstName: requiredString('First name'),
  lastName: requiredString('Last name'),
  phone: requiredString('Phone number'),
  location: requiredString('Location'),
  totalExperience: requiredString('Total experience'),
  currentCompany: requiredString('Current company'),
  currentCTC: requiredString('Current CTC'),
  expectedCTC: requiredString('Expected CTC'),
  noticePeriod: requiredString('Notice period'),
  pan: z
    .string()
    .min(1, 'PAN is required')
    .refine((v) => /^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(v.trim()), 'Enter a valid PAN (e.g. ABCDE1234F)'),
  linkedin: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  portfolio: z.string().url('Invalid URL').optional().or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/)
  if (parts.length <= 1) return { firstName: parts[0] ?? '', lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

const PortalProfileSetup = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { addToast } = useToastStore()
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [candidateId, setCandidateId] = useState<string | null>(null)
  const [hasResume, setHasResume] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const returnTo = searchParams.get('returnTo') || '/portal/dashboard'

  const { data: portalMe, isLoading } = useQuery({
    queryKey: ['portal-me'],
    queryFn: api.portal.getMe,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (!portalMe) return
    const email = portalMe.user?.email ?? user?.email ?? ''
    if (portalMe.linked && portalMe.candidate) {
      const c = portalMe.candidate
      const { firstName, lastName } = splitName(c.name)
      setCandidateId(c.id)
      setHasResume(!!(c.hasResume || c.resumeFileName))
      reset({
        firstName,
        lastName,
        phone: c.phone ?? '',
        location: c.location ?? '',
        totalExperience: c.totalExperience ?? '',
        currentCompany: c.currentCompany ?? '',
        currentCTC: c.currentCTC ?? '',
        expectedCTC: c.expectedCTC ?? '',
        noticePeriod: c.noticePeriod ?? '',
        pan: c.pan ?? '',
        linkedin: c.linkedIn ?? '',
        portfolio: c.portfolio ?? '',
      })
    } else {
      const { firstName, lastName } = splitName(portalMe.user?.name ?? user?.name ?? '')
      reset({
        firstName,
        lastName,
        phone: '',
        location: '',
        totalExperience: '',
        currentCompany: '',
        currentCTC: '',
        expectedCTC: '',
        noticePeriod: '',
        pan: '',
        linkedin: '',
        portfolio: '',
      })
    }
    void email
  }, [portalMe, user, reset])

  const missingFields = useMemo(() => {
    if (!portalMe) return []
    return portalMe.missingFields ?? []
  }, [portalMe])

  const saveMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const result = await api.portal.saveProfile({
        ...data,
        linkedIn: data.linkedin?.trim() || undefined,
        portfolio: data.portfolio?.trim() || undefined,
      })
      setCandidateId(result.candidate.id)
      if (resumeFile) {
        const withResume = await api.portal.uploadResume(resumeFile)
        return withResume
      }
      return result
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['portal-me'] })
      if (result.profileComplete) {
        addToast('Profile saved successfully', 'success')
        navigate(returnTo.startsWith('/portal') ? returnTo : '/portal/dashboard', {
          replace: true,
        })
      } else {
        setHasResume(!!(result.candidate.hasResume || result.candidate.resumeFileName))
        addToast(
          `Profile saved. Still needed: ${result.missingFields.join(', ')}`,
          'info'
        )
      }
    },
    onError: (err: unknown) => {
      addToast(err instanceof ApiError ? err.message : 'Failed to save profile', 'error')
    },
  })

  const onSubmit = (data: FormValues) => {
    if (!resumeFile && !hasResume) {
      addToast('Please upload your resume (PDF or DOCX)', 'error')
      fileInputRef.current?.focus()
      return
    }
    saveMutation.mutate(data)
  }

  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-medium text-primary dark:text-white placeholder:text-primary/20'

  const FieldLabel = ({
    children,
    required = true,
  }: {
    children: React.ReactNode
    required?: boolean
  }) => (
    <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider flex items-center gap-0.5">
      {required && <span className="text-red-500">*</span>}
      {children}
    </label>
  )

  if (isLoading) {
    return <div className="p-12 text-center text-slate-500">Loading profile…</div>
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-primary dark:text-white tracking-tight">
          Complete your profile
        </h1>
        <p className="text-sm text-primary/60 dark:text-white/60 mt-1">
          Fill in the same details recruiters see on your candidate profile before you can apply
          to jobs.
        </p>
        {missingFields.length > 0 && (
          <p className="mt-3 text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
            Still required: {missingFields.join(', ')}
          </p>
        )}
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white dark:bg-white/5 rounded-2xl border border-primary/10 dark:border-white/10 p-6 md:p-8 space-y-8 shadow-sm"
      >
        <section className="space-y-4">
          <h2 className="font-bold text-primary dark:text-white">Personal details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <FieldLabel>First name</FieldLabel>
              <input className={inputClass} {...register('firstName')} />
              {errors.firstName && (
                <p className="text-xs font-bold text-red-500">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <FieldLabel>Last name</FieldLabel>
              <input className={inputClass} {...register('lastName')} />
              {errors.lastName && (
                <p className="text-xs font-bold text-red-500">{errors.lastName.message}</p>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <FieldLabel required={false}>Email</FieldLabel>
              <input
                className={clsx(inputClass, 'bg-slate-50 dark:bg-white/5 text-primary/60')}
                value={user?.email ?? ''}
                readOnly
                disabled
              />
            </div>
            <div className="space-y-2">
              <FieldLabel>Phone number</FieldLabel>
              <input className={inputClass} {...register('phone')} />
              {errors.phone && (
                <p className="text-xs font-bold text-red-500">{errors.phone.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <FieldLabel>Location</FieldLabel>
              <input className={inputClass} placeholder="City, country" {...register('location')} />
              {errors.location && (
                <p className="text-xs font-bold text-red-500">{errors.location.message}</p>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <FieldLabel>PAN</FieldLabel>
              <input
                className={clsx(inputClass, 'uppercase')}
                maxLength={10}
                placeholder="ABCDE1234F"
                {...register('pan')}
              />
              {errors.pan && (
                <p className="text-xs font-bold text-red-500">{errors.pan.message}</p>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-4 border-t border-primary/10 dark:border-white/10 pt-6">
          <h2 className="font-bold text-primary dark:text-white">Compensation & experience</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <FieldLabel>Total experience</FieldLabel>
              <input className={inputClass} placeholder="e.g. 5 Years" {...register('totalExperience')} />
              {errors.totalExperience && (
                <p className="text-xs font-bold text-red-500">{errors.totalExperience.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <FieldLabel>Current company</FieldLabel>
              <input className={inputClass} {...register('currentCompany')} />
              {errors.currentCompany && (
                <p className="text-xs font-bold text-red-500">{errors.currentCompany.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <FieldLabel>Current CTC</FieldLabel>
              <input className={inputClass} {...register('currentCTC')} />
              {errors.currentCTC && (
                <p className="text-xs font-bold text-red-500">{errors.currentCTC.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <FieldLabel>Expected CTC</FieldLabel>
              <input className={inputClass} {...register('expectedCTC')} />
              {errors.expectedCTC && (
                <p className="text-xs font-bold text-red-500">{errors.expectedCTC.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <FieldLabel>Notice period</FieldLabel>
              <input className={inputClass} placeholder="e.g. 30 Days" {...register('noticePeriod')} />
              {errors.noticePeriod && (
                <p className="text-xs font-bold text-red-500">{errors.noticePeriod.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <FieldLabel required={false}>LinkedIn</FieldLabel>
              <input className={inputClass} placeholder="https://linkedin.com/in/..." {...register('linkedin')} />
              {errors.linkedin && (
                <p className="text-xs font-bold text-red-500">{errors.linkedin.message}</p>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <FieldLabel required={false}>Portfolio</FieldLabel>
              <input className={inputClass} placeholder="https://..." {...register('portfolio')} />
              {errors.portfolio && (
                <p className="text-xs font-bold text-red-500">{errors.portfolio.message}</p>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-3 border-t border-primary/10 dark:border-white/10 pt-6">
          <h2 className="font-bold text-primary dark:text-white flex items-center gap-0.5">
            <span className="text-red-500">*</span> Resume
          </h2>
          {hasResume && !resumeFile && (
            <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
              Resume on file{candidateId ? '' : ''}. Upload a new file to replace it.
            </p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="w-full text-sm"
            onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
          />
          <p className="text-xs text-primary/40">PDF or DOCX · max 5 MB</p>
        </section>

        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="w-full py-4 bg-primary dark:bg-white text-white dark:text-primary rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50"
        >
          {saveMutation.isPending ? 'Saving…' : 'Save profile & continue'}
        </button>
      </form>
    </div>
  )
}

export default PortalProfileSetup
