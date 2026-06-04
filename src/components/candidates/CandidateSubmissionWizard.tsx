import React, { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm, Controller, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowRight,
  Briefcase,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  Mail,
  Phone,
  Sparkles,
  Upload,
} from 'lucide-react'
import clsx from 'clsx'
import { useMutation, useQuery } from '@tanstack/react-query'
import { IndianItCitySelect } from './IndianItCitySelect'
import { normalizeIndianItCity } from '../../lib/indianItCities'
import type { ParsedResumeFields } from '../../services/http/candidates'
import type { CandidateEmailCheck } from '../../services/http/candidates'
import { SkillSelectSection } from '../skills/SkillSelectSection'
import { SearchableSelect } from '../ui/SearchableSelect'
import { AppSelect } from '../ui/AppSelect'
import { CANDIDATE_SOURCE_OPTIONS, REFERRAL_RELATIONSHIP_OPTIONS } from '../../lib/selectOptions'
import { WizardStepFooter } from '../ui/WizardStepFooter'
import {
  PARSED_FIELD_LABELS,
  PROFILE_STEP_FIELDS,
  RECRUITER_STEP_0_FIELDS,
  SUBMISSION_STEPS,
  recruiterSubmissionSchema,
  vendorSubmissionSchema,
  referralSubmissionSchema,
  REFERRAL_RELATIONSHIPS,
  type CandidateProfileFormValues,
  type RecruiterSubmissionFormValues,
  type ReferralSubmissionFormValues,
} from '../../lib/candidateSubmissionForm'

const EMAIL_CHECK_DEBOUNCE_MS = 400

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-white dark:bg-white/[0.02] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium text-primary dark:text-white placeholder:text-primary/30 dark:placeholder:text-white/30 transition-shadow'

const vendorInputClass =
  'w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-medium focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none text-slate-900 dark:text-white placeholder:text-slate-400'

const referralInputClass =
  'w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-medium focus:border-violet-600 focus:ring-2 focus:ring-violet-600/20 outline-none text-slate-900 dark:text-white placeholder:text-slate-400'

function FieldLabel({
  children,
  required = true,
  variant = 'staff',
}: {
  children: React.ReactNode
  required?: boolean
  variant?: 'staff' | 'vendor' | 'referral'
}) {
  const labelClass =
    variant === 'vendor' || variant === 'referral'
      ? 'text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1'
      : 'text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider flex items-center gap-1'
  return (
    <label className={labelClass}>
      {required && <span className="text-red-500" aria-hidden>*</span>}
      {children}
    </label>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs font-bold text-red-500 mt-1">{message}</p>
}

function FormSection({
  title,
  description,
  children,
  variant = 'staff',
}: {
  title: string
  description?: string
  children: React.ReactNode
  variant?: 'staff' | 'vendor' | 'referral'
}) {
  const isPortalSection = variant === 'vendor' || variant === 'referral'
  const border = isPortalSection
    ? 'border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]'
    : 'border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02]'
  const titleClass = isPortalSection
    ? 'text-sm font-bold text-slate-900 dark:text-white'
    : 'text-sm font-bold text-primary dark:text-white'
  const descClass = isPortalSection
    ? 'text-xs font-medium text-slate-500 mt-0.5'
    : 'text-xs font-medium text-primary/50 dark:text-white/50 mt-0.5'

  return (
    <section className={clsx('rounded-2xl border overflow-hidden', border)}>
      <div
        className={clsx(
          'px-5 py-4 border-b',
          isPortalSection
            ? 'border-slate-200 dark:border-white/10'
            : 'border-primary/10 dark:border-white/10'
        )}
      >
        <h3 className={titleClass}>{title}</h3>
        {description && <p className={descClass}>{description}</p>}
      </div>
      <div className="p-5 space-y-5">{children}</div>
    </section>
  )
}

const isValidEmailFormat = (value: string) =>
  z.string().email().safeParse(value.trim()).success

export type JobCardInfo = {
  jobCode: string
  title: string
  client?: string
  department: string
  location?: string
  description?: string
  referralBonusAmount?: number
}

type RecruiterWizardProps = {
  variant: 'recruiter'
  title: string
  subtitle: string
  backHref: string
  submitLabel: string
  sourceDefault: string
  defaultRequirementId?: string
  requirementOptions: { value: string; label: string; sublabel?: string }[]
  isAdmin?: boolean
  parseResume: (file: File) => Promise<{ fields: ParsedResumeFields }>
  checkEmail: (email: string) => Promise<CandidateEmailCheck>
  onSubmit: (values: RecruiterSubmissionFormValues, resumeFile: File | null) => Promise<void>
  isSubmitting?: boolean
  onToast: (message: string, type: 'success' | 'error' | 'info') => void
}

type VendorWizardProps = {
  variant: 'vendor'
  title: string
  subtitle: string
  backHref: string
  submitLabel: string
  jobCard: JobCardInfo
  parseResume: (file: File) => Promise<{ fields: ParsedResumeFields }>
  checkEmail: (email: string) => Promise<CandidateEmailCheck>
  onSubmit: (values: CandidateProfileFormValues, resumeFile: File | null) => Promise<void>
  isSubmitting?: boolean
  onToast: (message: string, type: 'success' | 'error' | 'info') => void
}

type ReferralWizardProps = {
  variant: 'referral'
  title: string
  subtitle: string
  backHref: string
  submitLabel: string
  jobCard: JobCardInfo
  parseResume: (file: File) => Promise<{ fields: ParsedResumeFields }>
  checkEmail: (email: string) => Promise<CandidateEmailCheck>
  onSubmit: (values: ReferralSubmissionFormValues, resumeFile: File | null) => Promise<void>
  isSubmitting?: boolean
  onToast: (message: string, type: 'success' | 'error' | 'info') => void
}

export type CandidateSubmissionWizardProps =
  | RecruiterWizardProps
  | VendorWizardProps
  | ReferralWizardProps

export function CandidateSubmissionWizard(props: CandidateSubmissionWizardProps) {
  const isVendor = props.variant === 'vendor'
  const isReferral = props.variant === 'referral'
  const isPortal = isVendor || isReferral
  const ic = isReferral ? referralInputClass : isVendor ? vendorInputClass : inputClass
  const fieldVariant = isReferral ? 'referral' : isVendor ? 'vendor' : 'staff'
  const [currentStep, setCurrentStep] = useState(0)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [autofilledLabels, setAutofilledLabels] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const recruiterDefaults =
    props.variant === 'recruiter'
      ? {
          source: props.sourceDefault,
          requirementId: props.defaultRequirementId,
          primarySkills: [] as string[],
          secondarySkills: [] as string[],
        }
      : undefined

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    trigger,
    watch,
    setValue,
  } = useForm<RecruiterSubmissionFormValues | CandidateProfileFormValues | ReferralSubmissionFormValues>({
    resolver: zodResolver(
      props.variant === 'recruiter'
        ? recruiterSubmissionSchema
        : props.variant === 'referral'
          ? referralSubmissionSchema
          : vendorSubmissionSchema
    ),
    defaultValues:
      props.variant === 'recruiter'
        ? recruiterDefaults
        : props.variant === 'referral'
          ? { primarySkills: [], secondarySkills: [], referralRelationship: '', referralNotes: '' }
          : { primarySkills: [], secondarySkills: [] },
  })

  const formValues = watch()
  const emailValue = (formValues as CandidateProfileFormValues).email ?? ''
  const [debouncedEmail, setDebouncedEmail] = useState('')

  React.useEffect(() => {
    const trimmed = emailValue.trim()
    const timer = setTimeout(() => setDebouncedEmail(trimmed), EMAIL_CHECK_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [emailValue])

  const emailReadyToCheck = isValidEmailFormat(debouncedEmail)
  const emailCheckPending = emailValue.trim() !== debouncedEmail

  const { data: emailCheck, isFetching: isCheckingEmail } = useQuery({
    queryKey: ['submission-check-email', debouncedEmail, props.variant],
    queryFn: () => props.checkEmail(debouncedEmail),
    enabled: emailReadyToCheck,
    staleTime: 30_000,
  })

  const emailIsDuplicate = emailCheck?.exists === true
  const emailCheckInProgress =
    emailReadyToCheck && (emailCheckPending || isCheckingEmail)

  React.useEffect(() => {
    if (props.variant !== 'recruiter') return
    const reqId = (formValues as RecruiterSubmissionFormValues).requirementId
    if (!reqId) return
    const opt = props.requirementOptions.find((r) => r.value === reqId)
    if (opt) setValue('role', opt.label)
  }, [
    props.variant,
    props.variant === 'recruiter' ? (formValues as RecruiterSubmissionFormValues).requirementId : null,
    props.variant === 'recruiter' ? props.requirementOptions : null,
    setValue,
  ])

  const applyParsedFields = (fields: ParsedResumeFields) => {
    const labels: string[] = []
    const apply = (key: keyof ParsedResumeFields, value?: string) => {
      if (!value?.trim()) return
      if (key === 'firstName' || key === 'lastName') {
        setValue(key, value.trim())
      } else if (key === 'email') {
        setValue('email', value.trim().toLowerCase())
      } else {
        setValue(key as keyof CandidateProfileFormValues, value.trim())
      }
      labels.push(PARSED_FIELD_LABELS[key])
    }
    apply('firstName', fields.firstName)
    apply('lastName', fields.lastName)
    apply('email', fields.email)
    apply('phone', fields.phone)
    const city = normalizeIndianItCity(fields.location)
    if (city) {
      setValue('location', city)
      labels.push(PARSED_FIELD_LABELS.location)
    }
    apply('linkedin', fields.linkedin)
    apply('portfolio', fields.portfolio)
    apply('totalExperience', fields.totalExperience)
    if (fields.primarySkills?.length) {
      setValue('primarySkills', fields.primarySkills.slice(0, 12))
      labels.push(PARSED_FIELD_LABELS.primarySkills)
    }
    if (fields.secondarySkills?.length) {
      setValue('secondarySkills', fields.secondarySkills.slice(0, 12))
      labels.push(PARSED_FIELD_LABELS.secondarySkills)
    }
    setAutofilledLabels(labels)
    return labels.length
  }

  const parseResumeMutation = useMutation({
    mutationFn: props.parseResume,
    onSuccess: (data) => {
      const count = applyParsedFields(data.fields)
      if (count > 0) {
        props.onToast(`Auto-filled ${count} field${count === 1 ? '' : 's'} from resume`, 'success')
      } else {
        props.onToast('Resume uploaded — fill in details manually', 'info')
      }
    },
    onError: () => {
      props.onToast('Could not read resume for auto-fill. Enter details manually.', 'info')
    },
  })

  const handleResumeFile = (file: File | null) => {
    setResumeFile(file)
    setAutofilledLabels([])
    if (file) parseResumeMutation.mutate(file)
  }

  const onResumeDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleResumeFile(file)
  }

  const submitHandler = handleSubmit(async (data) => {
    if (props.isSubmitting || emailIsDuplicate || emailCheckInProgress) return
    if (props.variant === 'recruiter') {
      await props.onSubmit(data as RecruiterSubmissionFormValues, resumeFile)
    } else if (props.variant === 'referral') {
      await props.onSubmit(data as ReferralSubmissionFormValues, resumeFile)
    } else {
      await props.onSubmit(data as CandidateProfileFormValues, resumeFile)
    }
  })

  const nextStep = async () => {
    if (currentStep === 0) {
      if (props.variant === 'recruiter') {
        const ok = await trigger([...RECRUITER_STEP_0_FIELDS])
        if (ok) setCurrentStep(1)
      } else {
        setCurrentStep(1)
      }
      return
    }
    if (currentStep === 1) {
      const fields: (keyof ReferralSubmissionFormValues | (typeof PROFILE_STEP_FIELDS)[number])[] = [
        ...PROFILE_STEP_FIELDS,
      ]
      if (props.variant === 'referral') fields.push('referralRelationship')
      const ok = await trigger(fields)
      if (!ok) return
      if (emailCheckInProgress) {
        props.onToast('Please wait while we verify the email address', 'info')
        return
      }
      if (emailIsDuplicate) {
        props.onToast('A candidate with this email already exists', 'error')
        return
      }
      setCurrentStep(2)
    }
  }

  const profile = formValues as CandidateProfileFormValues
  const recruiterExtra =
    props.variant === 'recruiter' ? (formValues as RecruiterSubmissionFormValues) : null

  const reviewRows = useMemo(() => {
    const rows: { label: string; value: string }[] = []
    if (props.variant === 'vendor' || props.variant === 'referral') {
      rows.push({ label: 'Job', value: props.jobCard.title })
      if (props.jobCard.client) rows.push({ label: 'Client', value: props.jobCard.client })
      if (props.variant === 'referral') {
        const ref = profile as ReferralSubmissionFormValues
        rows.push({ label: 'Relationship', value: ref.referralRelationship })
        if (ref.referralNotes?.trim()) rows.push({ label: 'Notes', value: ref.referralNotes })
      }
    } else if (recruiterExtra) {
      const req = props.requirementOptions.find((r) => r.value === recruiterExtra.requirementId)
      rows.push({ label: 'Job', value: req?.label ?? '—' })
      rows.push({ label: 'Role', value: recruiterExtra.role })
      rows.push({ label: 'Source', value: recruiterExtra.source })
    }
    rows.push(
      { label: 'Name', value: `${profile.firstName} ${profile.lastName}`.trim() },
      { label: 'Email', value: profile.email },
      { label: 'Phone', value: profile.phone },
      { label: 'PAN', value: profile.pan?.toUpperCase() },
      { label: 'Location', value: profile.location },
      { label: 'Experience', value: profile.totalExperience },
      { label: 'Company', value: profile.currentCompany },
      { label: 'Current CTC', value: profile.currentCTC },
      { label: 'Expected CTC', value: profile.expectedCTC },
      { label: 'Notice', value: profile.noticePeriod }
    )
    if (profile.linkedin) rows.push({ label: 'LinkedIn', value: profile.linkedin })
    if (profile.portfolio) rows.push({ label: 'Portfolio', value: profile.portfolio })
    if (profile.primarySkills?.length) {
      rows.push({ label: 'Primary skills', value: profile.primarySkills.join(', ') })
    }
    if (resumeFile) rows.push({ label: 'Resume', value: resumeFile.name })
    return rows
  }, [profile, recruiterExtra, props, resumeFile])

  const progressPct = ((currentStep + 1) / SUBMISSION_STEPS.length) * 100
  const accentBar = isReferral
    ? 'bg-violet-700'
    : isVendor
      ? 'bg-emerald-700'
      : 'bg-primary dark:bg-white'
  const accentActive = isReferral
    ? 'bg-violet-700 text-white'
    : isVendor
      ? 'bg-emerald-700 text-white'
      : 'bg-primary text-primary-foreground'
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
            <h1
              className={clsx(
                'text-2xl md:text-3xl font-black tracking-tight',
                isPortal ? 'text-slate-900 dark:text-white' : 'text-primary dark:text-white'
              )}
            >
              {props.title}
            </h1>
            <p
              className={clsx(
                'text-sm font-medium max-w-lg',
                isPortal ? 'text-slate-500' : 'text-primary/60 dark:text-white/60'
              )}
            >
              {props.subtitle}
            </p>
        </div>
        <div className="text-xs font-bold uppercase tracking-wider shrink-0 text-slate-400">
          Step {currentStep + 1} of {SUBMISSION_STEPS.length}
        </div>
      </div>

      {(props.variant === 'vendor' || props.variant === 'referral') && (
        <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-slate-200 dark:border-white/10">
          <p
            className={clsx(
              'text-[10px] font-bold uppercase',
              isReferral ? 'text-violet-700' : 'text-emerald-700'
            )}
          >
            {props.jobCard.jobCode}
          </p>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {props.jobCard.title}
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            {props.jobCard.client ? `${props.jobCard.client} · ` : ''}
            {props.jobCard.department}
            {props.jobCard.location ? ` · ${props.jobCard.location}` : ''}
          </p>
          {props.jobCard.referralBonusAmount ? (
            <p className="mt-3 text-sm font-black text-amber-700">
              Referral bonus: ₹{props.jobCard.referralBonusAmount.toLocaleString('en-IN')}
            </p>
          ) : null}
        </div>
      )}

      <div
        className={clsx(
          'h-1.5 w-full rounded-full overflow-hidden',
          isPortal ? 'bg-slate-200' : 'bg-primary/10 dark:bg-white/10'
        )}
      >
        <div className={clsx('h-full transition-all duration-500', accentBar)} style={{ width: `${progressPct}%` }} />
      </div>

      <div
        className={clsx(
          'flex-1 border rounded-2xl shadow-sm overflow-hidden',
          isPortal
            ? 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10'
            : 'bg-white dark:bg-white/5 border-primary/10 dark:border-white/10'
        )}
      >
        <div className="flex gap-2 p-3 border-b border-inherit overflow-x-auto lg:hidden">
          {SUBMISSION_STEPS.map((step) => (
            <span
              key={step.id}
              className={clsx(
                'shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider',
                currentStep === step.id
                  ? accentActive
                  : currentStep > step.id
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-400'
              )}
            >
              {step.label}
            </span>
          ))}
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="p-6 md:p-8">
          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Resume</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Upload a resume to auto-fill profile fields on the next step.
                </p>
              </div>
              <div
                role="button"
                tabIndex={0}
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onResumeDrop}
                onClick={() => fileInputRef.current?.click()}
                className={clsx(
                  'rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all',
                  isDragging
                    ? isReferral
                      ? 'border-violet-600 bg-violet-50'
                      : isVendor
                        ? 'border-emerald-600 bg-emerald-50'
                        : 'border-primary bg-primary/5'
                    : isReferral
                      ? 'border-slate-200 hover:border-violet-400'
                      : isVendor
                        ? 'border-slate-200 hover:border-emerald-400'
                        : 'border-primary/20 hover:border-primary/40'
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={(e) => handleResumeFile(e.target.files?.[0] ?? null)}
                />
                <div className="mx-auto size-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
                  {parseResumeMutation.isPending ? (
                    <Loader2 size={28} className="animate-spin text-emerald-700" />
                  ) : resumeFile ? (
                    <FileText size={28} className="text-emerald-700" />
                  ) : (
                    <Upload size={28} className="text-emerald-700" />
                  )}
                </div>
                <p className="font-bold text-slate-900 dark:text-white">
                  {parseResumeMutation.isPending
                    ? 'Reading resume…'
                    : resumeFile
                      ? resumeFile.name
                      : 'Drop resume here or click to upload'}
                </p>
                <p className="mt-1 text-xs text-slate-500">PDF or DOCX</p>
                {resumeFile && !parseResumeMutation.isPending && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleResumeFile(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="mt-3 text-xs font-bold text-slate-500 underline"
                  >
                    Remove file
                  </button>
                )}
              </div>
              {autofilledLabels.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-200/60">
                  <Sparkles size={16} className="text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold text-emerald-800 uppercase">Auto-filled:</span>
                  {autofilledLabels.map((label) => (
                    <span
                      key={label}
                      className="px-2 py-1 rounded-lg bg-white text-emerald-800 text-xs font-bold"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              )}
              {props.variant === 'recruiter' && (
                <FormSection
                  title="Job assignment"
                  description="Every candidate must be linked to an open requirement."
                  variant={fieldVariant}
                >
                  <div className="space-y-2">
                    <FieldLabel variant={fieldVariant}>Job requirement</FieldLabel>
                    <Controller
                      control={control}
                      name="requirementId"
                      render={({ field }) => (
                        <SearchableSelect
                          value={field.value ?? ''}
                          onChange={field.onChange}
                          options={props.requirementOptions}
                          placeholder="Select job requirement"
                          searchPlaceholder="Search jobs..."
                          allowClear={false}
                          icon={<Briefcase size={18} className="text-primary/40" />}
                        />
                      )}
                    />
                    <FieldError
                      message={
                        (errors as FieldErrors<RecruiterSubmissionFormValues>).requirementId
                          ?.message
                      }
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <FieldLabel variant={fieldVariant}>Role / job title</FieldLabel>
                      <input className={ic} {...register('role')} />
                      <FieldError
                        message={
                          (errors as FieldErrors<RecruiterSubmissionFormValues>).role?.message
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel variant={fieldVariant}>Source</FieldLabel>
                      <AppSelect
                        value={(formValues as RecruiterSubmissionFormValues).source || 'Direct Application'}
                        onChange={(v) => setValue('source', v, { shouldValidate: true })}
                        options={CANDIDATE_SOURCE_OPTIONS}
                        aria-label="Candidate source"
                      />
                    </div>
                  </div>
                </FormSection>
              )}
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Profile & skills
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Same fields your recruiting team uses when adding candidates.
                </p>
              </div>
              <FormSection title="Contact" variant={fieldVariant}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <FieldLabel variant={fieldVariant}>First name</FieldLabel>
                    <input className={ic} {...register('firstName')} />
                    <FieldError message={errors.firstName?.message} />
                  </div>
                  <div className="space-y-2">
                    <FieldLabel variant={fieldVariant}>Last name</FieldLabel>
                    <input className={ic} {...register('lastName')} />
                    <FieldError message={errors.lastName?.message} />
                  </div>
                  <div className="space-y-2">
                    <FieldLabel variant={fieldVariant}>Email</FieldLabel>
                    <div className="relative">
                      <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
                      <input
                        className={clsx(ic, 'pl-10', emailIsDuplicate && 'border-red-500')}
                        type="email"
                        {...register('email')}
                      />
                    </div>
                    <FieldError message={!emailIsDuplicate ? errors.email?.message : undefined} />
                    {emailIsDuplicate && emailCheck?.candidateId && (
                      <p className="text-xs font-bold text-red-500">
                        A candidate with this email already exists.
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <FieldLabel variant={fieldVariant}>Phone</FieldLabel>
                    <div className="relative">
                      <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
                      <input className={clsx(ic, 'pl-10')} {...register('phone')} />
                    </div>
                    <FieldError message={errors.phone?.message} />
                  </div>
                  <div className="space-y-2">
                    <FieldLabel variant={fieldVariant}>PAN</FieldLabel>
                    <input className={clsx(ic, 'uppercase')} maxLength={10} {...register('pan')} />
                    <FieldError message={errors.pan?.message} />
                  </div>
                  <div className="space-y-2">
                    <FieldLabel variant={fieldVariant}>Location</FieldLabel>
                    <Controller
                      control={control}
                      name="location"
                      render={({ field }) => (
                        <IndianItCitySelect value={field.value ?? ''} onChange={field.onChange} />
                      )}
                    />
                    <FieldError message={errors.location?.message} />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <FieldLabel required={false} variant={fieldVariant}>
                      LinkedIn
                    </FieldLabel>
                    <input className={ic} {...register('linkedin')} />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <FieldLabel required={false} variant={fieldVariant}>
                      Portfolio
                    </FieldLabel>
                    <input className={ic} {...register('portfolio')} />
                  </div>
                </div>
              </FormSection>
              <FormSection title="Compensation & availability" variant={fieldVariant}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {(
                    [
                      ['totalExperience', 'Total experience'],
                      ['currentCompany', 'Current company'],
                      ['currentCTC', 'Current CTC'],
                      ['expectedCTC', 'Expected CTC'],
                    ] as const
                  ).map(([name, label]) => (
                    <div key={name} className="space-y-2">
                      <FieldLabel variant={fieldVariant}>{label}</FieldLabel>
                      <input className={ic} {...register(name)} />
                      <FieldError message={errors[name]?.message} />
                    </div>
                  ))}
                  <div className="space-y-2 md:col-span-2">
                    <FieldLabel variant={fieldVariant}>Notice period</FieldLabel>
                    <input className={ic} {...register('noticePeriod')} />
                    <FieldError message={errors.noticePeriod?.message} />
                  </div>
                </div>
              </FormSection>
              {props.variant === 'referral' && (
                <FormSection
                  title="How you know them"
                  description="Helps recruiting validate referral eligibility."
                  variant={fieldVariant}
                >
                  <div className="grid grid-cols-1 gap-5">
                    <div className="space-y-2">
                      <FieldLabel variant={fieldVariant}>Relationship</FieldLabel>
                      <AppSelect
                        value={(formValues as ReferralSubmissionFormValues).referralRelationship || ''}
                        onChange={(v) => setValue('referralRelationship', v, { shouldValidate: true })}
                        options={REFERRAL_RELATIONSHIP_OPTIONS}
                        aria-label="Referral relationship"
                      />
                      <FieldError
                        message={
                          props.variant === 'referral'
                            ? (errors as { referralRelationship?: { message?: string } })
                                .referralRelationship?.message
                            : undefined
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel variant={fieldVariant} required={false}>
                        Notes for recruiting (optional)
                      </FieldLabel>
                      <textarea
                        className={clsx(ic, 'resize-none min-h-[88px]')}
                        rows={3}
                        placeholder="Why they'd be a great fit, how you know their work…"
                        {...register('referralNotes')}
                      />
                    </div>
                  </div>
                </FormSection>
              )}
              <div className="rounded-2xl border border-inherit px-5 py-5">
                <Controller
                  control={control}
                  name="primarySkills"
                  render={({ field: primaryField }) => (
                    <Controller
                      control={control}
                      name="secondarySkills"
                      render={({ field: secondaryField }) => (
                        <SkillSelectSection
                          primarySkills={primaryField.value ?? []}
                          secondarySkills={secondaryField.value ?? []}
                          onPrimaryChange={primaryField.onChange}
                          onSecondaryChange={secondaryField.onChange}
                          isAdmin={props.variant === 'recruiter' ? props.isAdmin : false}
                          primaryError={errors.primarySkills?.message}
                        />
                      )}
                    />
                  )}
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Review</h2>
                <p className="text-sm text-slate-500 mt-1">Confirm details before submitting.</p>
              </div>
              <div className="rounded-2xl border border-inherit divide-y divide-inherit overflow-hidden">
                {reviewRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex justify-between gap-4 px-5 py-3 text-sm"
                  >
                    <span className="font-bold text-slate-500">{row.label}</span>
                    <span className="font-medium text-slate-900 dark:text-white text-right break-all">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <WizardStepFooter
            currentStep={currentStep}
            onPreviousStep={() => setCurrentStep((s) => Math.max(0, s - 1))}
            exitTo={props.backHref}
            exitLabel="Cancel"
          >
            {currentStep < 2 ? (
              <button
                type="button"
                onClick={nextStep}
                className={clsx(
                  'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm',
                  isReferral
                    ? 'bg-violet-700 text-white hover:bg-violet-800'
                    : isVendor
                      ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                      : 'bg-primary text-primary-foreground'
                )}
              >
                Continue
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={submitHandler}
                disabled={props.isSubmitting || emailIsDuplicate || emailCheckInProgress}
                className={clsx(
                  'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm disabled:opacity-50',
                  isReferral
                    ? 'bg-violet-700 text-white hover:bg-violet-800'
                    : isVendor
                      ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                      : 'bg-primary text-primary-foreground'
                )}
              >
                {props.isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    {props.submitLabel}
                  </>
                )}
              </button>
            )}
          </WizardStepFooter>
        </form>
      </div>
    </div>
  )
}
