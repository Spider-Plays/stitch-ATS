import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../services/api'
import { useToastStore } from '../../store/toastStore'
import { ApiError } from '../../lib/apiClient'
import { portalHomePath } from '../../lib/portalWorkflow'
import clsx from 'clsx'
import { StitchLogo } from '../../components/branding/StitchLogo'

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
    .refine((v) => /^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(v.trim()), 'Enter a valid PAN'),
  linkedin: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  portfolio: z.string().url('Invalid URL').optional().or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

const STEPS = [
  { id: 'welcome', title: 'Welcome', icon: 'waving_hand' },
  { id: 'personal', title: 'About you', icon: 'person' },
  { id: 'professional', title: 'Experience', icon: 'work' },
  { id: 'resume', title: 'Resume', icon: 'description' },
  { id: 'done', title: 'Ready', icon: 'celebration' },
] as const

type StepId = (typeof STEPS)[number]['id']

function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/)
  if (parts.length <= 1) return { firstName: parts[0] ?? '', lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

const PortalOnboarding = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { addToast } = useToastStore()
  const [step, setStep] = useState<StepId>('welcome')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
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
    trigger,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!portalMe) return
    if (portalMe.linked && portalMe.candidate) {
      const c = portalMe.candidate
      const { firstName, lastName } = splitName(c.name)
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
      if (portalMe.profileComplete) setStep('done')
      else if (c.phone && c.location) setStep(hasResume ? 'resume' : 'resume')
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
  }, [portalMe, user, reset])

  const stepIndex = STEPS.findIndex((s) => s.id === step)
  const missingFields = portalMe?.missingFields ?? []

  const saveMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const result = await api.portal.saveProfile({
        ...data,
        linkedIn: data.linkedin?.trim() || undefined,
        portfolio: data.portfolio?.trim() || undefined,
      })
      if (resumeFile) {
        return api.portal.uploadResume(resumeFile)
      }
      return result
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['portal-me'] })
      setHasResume(!!(result.candidate.hasResume || result.candidate.resumeFileName))
      if (result.profileComplete) {
        addToast('Profile complete', 'success')
        setStep('done')
      } else {
        addToast(`Saved. Still needed: ${result.missingFields.join(', ')}`, 'info')
      }
    },
    onError: (err: unknown) => {
      addToast(err instanceof ApiError ? err.message : 'Failed to save', 'error')
    },
  })

  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-[#0f3d38] focus:ring-0 font-medium text-slate-900'

  const goNext = async () => {
    if (step === 'welcome') {
      setStep('personal')
      return
    }
    if (step === 'personal') {
      const ok = await trigger(['firstName', 'lastName', 'phone', 'location', 'pan'])
      if (ok) setStep('professional')
      return
    }
    if (step === 'professional') {
      const ok = await trigger([
        'totalExperience',
        'currentCompany',
        'currentCTC',
        'expectedCTC',
        'noticePeriod',
      ])
      if (ok) {
        saveMutation.mutate(getValues())
        setStep('resume')
      }
      return
    }
    if (step === 'resume') {
      if (!resumeFile && !hasResume) {
        addToast('Upload your resume to continue', 'error')
        return
      }
      saveMutation.mutate(getValues(), {
        onSuccess: (r) => {
          if (r.profileComplete) setStep('done')
        },
      })
    }
  }

  const finish = () => {
    const path = returnTo.startsWith('/portal') ? returnTo : portalHomePath(portalMe)
    navigate(path, { replace: true })
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-500">
        <span className="size-8 border-2 border-[#0f3d38]/30 border-t-[#0f3d38] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10 space-y-8">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <div
            key={s.id}
            className={clsx(
              'flex items-center gap-2 shrink-0',
              i <= stepIndex ? 'text-[#0f3d38]' : 'text-slate-400'
            )}
          >
            <span
              className={clsx(
                'size-8 rounded-full flex items-center justify-center text-sm font-black',
                i < stepIndex && 'bg-emerald-600 text-white',
                i === stepIndex && 'bg-[#0f3d38] text-white',
                i > stepIndex && 'bg-slate-100'
              )}
            >
              {i < stepIndex ? (
                <span className="material-symbols-outlined text-base">check</span>
              ) : (
                i + 1
              )}
            </span>
            <span className="text-xs font-bold hidden sm:inline">{s.title}</span>
            {i < STEPS.length - 1 && <span className="w-6 h-px bg-slate-200 mx-1" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(() => {})} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
        {step === 'welcome' && (
          <div className="space-y-4 text-center py-4">
            <StitchLogo tone="primary" size="xl" className="justify-center" />
            <h1 className="text-2xl font-black text-slate-900">Let&apos;s set up your profile</h1>
            <p className="text-slate-600 text-sm max-w-md mx-auto">
              Recruiters use this information when you apply. It takes about 5 minutes. You can
              update it anytime from My profile.
            </p>
            {missingFields.length > 0 && portalMe?.linked && (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 inline-block">
                Still required: {missingFields.join(', ')}
              </p>
            )}
          </div>
        )}

        {step === 'personal' && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-slate-900">Personal details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">First name *</label>
                <input className={inputClass} {...register('firstName')} />
                {errors.firstName && <p className="text-xs text-red-600 mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Last name *</label>
                <input className={inputClass} {...register('lastName')} />
                {errors.lastName && <p className="text-xs text-red-600 mt-1">{errors.lastName.message}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                <input className={clsx(inputClass, 'bg-slate-50')} value={user?.email ?? ''} readOnly disabled />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Phone *</label>
                <input className={inputClass} {...register('phone')} />
                {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone.message}</p>}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Location *</label>
                <input className={inputClass} placeholder="City, country" {...register('location')} />
                {errors.location && <p className="text-xs text-red-600 mt-1">{errors.location.message}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase">PAN *</label>
                <input className={clsx(inputClass, 'uppercase')} maxLength={10} {...register('pan')} />
                {errors.pan && <p className="text-xs text-red-600 mt-1">{errors.pan.message}</p>}
              </div>
            </div>
          </div>
        )}

        {step === 'professional' && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-slate-900">Experience & compensation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(
                [
                  ['totalExperience', 'Total experience *', 'e.g. 5 years'],
                  ['currentCompany', 'Current company *', ''],
                  ['currentCTC', 'Current CTC *', ''],
                  ['expectedCTC', 'Expected CTC *', ''],
                  ['noticePeriod', 'Notice period *', 'e.g. 30 days'],
                ] as const
              ).map(([name, label, ph]) => (
                <div key={name}>
                  <label className="text-xs font-bold text-slate-500 uppercase">{label}</label>
                  <input className={inputClass} placeholder={ph} {...register(name)} />
                  {errors[name] && (
                    <p className="text-xs text-red-600 mt-1">{errors[name]?.message}</p>
                  )}
                </div>
              ))}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">LinkedIn</label>
                <input className={inputClass} {...register('linkedin')} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Portfolio</label>
                <input className={inputClass} {...register('portfolio')} />
              </div>
            </div>
          </div>
        )}

        {step === 'resume' && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-slate-900">Upload resume</h2>
            <p className="text-sm text-slate-600">PDF or DOCX, max 5 MB. Required before you can apply.</p>
            {hasResume && !resumeFile && (
              <p className="text-sm text-emerald-700 font-medium">Resume on file. Upload to replace.</p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="w-full text-sm"
              onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
            />
          </div>
        )}

        {step === 'done' && (
          <div className="space-y-4 text-center py-6">
            <span className="material-symbols-outlined text-5xl text-emerald-600">check_circle</span>
            <h2 className="text-xl font-black text-slate-900">You&apos;re all set</h2>
            <p className="text-sm text-slate-600">Browse open roles and submit your application.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link
                to="/portal/jobs?tab=open"
                className="px-6 py-3 rounded-xl bg-[#0f3d38] text-white font-bold text-sm"
              >
                Browse open roles
              </Link>
              <button
                type="button"
                onClick={finish}
                className="px-6 py-3 rounded-xl border border-slate-200 font-bold text-sm text-slate-700"
              >
                Go to home
              </button>
            </div>
          </div>
        )}

        {step !== 'done' && (
          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={step === 'welcome'}
              onClick={() => {
                const prev = STEPS[stepIndex - 1]
                if (prev) setStep(prev.id)
              }}
              className="px-4 py-2 text-sm font-bold text-slate-500 disabled:opacity-30"
            >
              Back
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={saveMutation.isPending}
              className="px-6 py-2.5 rounded-xl bg-[#0f3d38] text-white text-sm font-bold disabled:opacity-50"
            >
              {saveMutation.isPending
                ? 'Saving…'
                : step === 'resume'
                  ? 'Save & finish'
                  : 'Continue'}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}

export default PortalOnboarding
