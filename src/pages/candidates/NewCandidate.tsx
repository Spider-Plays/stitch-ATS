import React, { useMemo, useRef, useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowRight,
  Briefcase,
  Check,
  CheckCircle2,
  FileText,
  Info,
  Loader2,
  Mail,
  Phone,
  Sparkles,
  Upload,
  User,
  UserPlus,
} from 'lucide-react'
import { IndianItCitySelect } from '../../components/candidates/IndianItCitySelect'
import { isIndianItCity, normalizeIndianItCity } from '../../lib/indianItCities'
import { api } from '../../services/api'
import type { ParsedResumeFields } from '../../services/http/candidates'
import clsx from 'clsx'
import { useToastStore } from '../../store/toastStore'
import { ApiError } from '../../lib/apiClient'
import { SearchableSelect } from '../../components/ui/SearchableSelect'
import { AppSelect } from '../../components/ui/AppSelect'
import { CANDIDATE_SOURCE_OPTIONS } from '../../lib/selectOptions'
import { WizardStepFooter } from '../../components/ui/WizardStepFooter'
import { PageHero } from '../../components/layout/PageHero'
import { SkillSelectSection } from '../../components/skills/SkillSelectSection'
import { useAuth } from '../../hooks/useAuth'
import { candidateStatusLabel } from '../../lib/candidatePage'

const requiredString = (label: string) => z.string().min(1, `${label} is required`)

const schema = z.object({
  firstName: requiredString('First name'),
  lastName: requiredString('Last name'),
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  phone: requiredString('Phone number'),
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
  role: requiredString('Role'),
  source: requiredString('Source'),
  location: z
    .string()
    .min(1, 'Location is required')
    .refine((v) => isIndianItCity(v), 'Select a city from the list'),
  portfolio: z.string().url('Invalid URL').optional().or(z.literal('')),
  requirementId: requiredString('Job requirement'),
  primarySkills: z.array(z.string()).min(1, 'Select at least one primary skill'),
  secondarySkills: z.array(z.string()).default([]),
})

type CandidateFormValues = z.infer<typeof schema>

const STEPS = [
  {
    id: 0,
    label: 'Resume & job',
    description: 'Upload resume and link to a role',
    icon: Upload,
  },
  {
    id: 1,
    label: 'Profile & skills',
    description: 'Contact, compensation, and skills',
    icon: User,
  },
  {
    id: 2,
    label: 'Review & create',
    description: 'Confirm before adding to pipeline',
    icon: CheckCircle2,
  },
] as const

const EMAIL_CHECK_DEBOUNCE_MS = 400

const PARSED_FIELD_LABELS: Record<keyof ParsedResumeFields, string> = {
  firstName: 'First name',
  lastName: 'Last name',
  email: 'Email',
  phone: 'Phone',
  location: 'Location',
  linkedin: 'LinkedIn',
  portfolio: 'Portfolio',
  totalExperience: 'Experience',
  primarySkills: 'Primary skills',
  secondarySkills: 'Secondary skills',
}

const STEP_0_FIELDS = ['requirementId', 'role', 'source'] as const
const STEP_1_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'pan',
  'location',
  'totalExperience',
  'currentCompany',
  'currentCTC',
  'expectedCTC',
  'noticePeriod',
  'linkedin',
  'portfolio',
  'primarySkills',
  'secondarySkills',
] as const

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-white dark:bg-white/[0.02] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium text-primary dark:text-white placeholder:text-primary/30 dark:placeholder:text-white/30 transition-shadow'

function FieldLabel({
  children,
  required = true,
}: {
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider flex items-center gap-1">
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
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] overflow-hidden">
      <div className="px-5 py-4 border-b border-primary/10 dark:border-white/10">
        <h3 className="text-sm font-bold text-primary dark:text-white">{title}</h3>
        {description && (
          <p className="text-xs font-medium text-primary/50 dark:text-white/50 mt-0.5">
            {description}
          </p>
        )}
      </div>
      <div className="p-5 space-y-5">{children}</div>
    </section>
  )
}

const isValidEmailFormat = (value: string) =>
  z.string().email().safeParse(value.trim()).success

const NewCandidate = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const [currentStep, setCurrentStep] = useState(0)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [autofilledLabels, setAutofilledLabels] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addToast } = useToastStore()
  const { user } = useAuth()

  const { data: requirements = [] } = useQuery({
    queryKey: ['requirements'],
    queryFn: api.requirements.list,
  })

  const requirementOptions = useMemo(
    () =>
      requirements
        .filter((r) => !['CLOSED', 'CANCELLED', 'REJECTED'].includes(r.status))
        .map((req) => ({
          value: req.id,
          label: req.title,
          sublabel: `${req.jobCode ?? req.id.slice(-8).toUpperCase()}${req.client ? ` · ${req.client}` : ''} · ${req.department}`,
        })),
    [requirements]
  )

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    trigger,
    watch,
    setValue,
  } = useForm<CandidateFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      source: 'Recruiter Added',
      requirementId: searchParams.get('requirementId') ?? undefined,
      primarySkills: [],
      secondarySkills: [],
    },
  })

  const formValues = watch()
  const emailValue = formValues.email ?? ''
  const [debouncedEmail, setDebouncedEmail] = useState('')

  React.useEffect(() => {
    const trimmed = emailValue.trim()
    const timer = setTimeout(() => setDebouncedEmail(trimmed), EMAIL_CHECK_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [emailValue])

  const emailReadyToCheck = isValidEmailFormat(debouncedEmail)
  const emailCheckPending = emailValue.trim() !== debouncedEmail

  const { data: emailCheck, isFetching: isCheckingEmail } = useQuery({
    queryKey: ['candidate-check-email', debouncedEmail],
    queryFn: () => api.candidates.checkEmail(debouncedEmail),
    enabled: emailReadyToCheck,
    staleTime: 30_000,
  })

  const emailIsDuplicate = emailCheck?.exists === true
  const emailCheckInProgress =
    emailReadyToCheck && (emailCheckPending || isCheckingEmail)

  React.useEffect(() => {
    if (formValues.requirementId) {
      const req = requirements.find((r) => r.id === formValues.requirementId)
      if (req) setValue('role', req.title)
    }
  }, [formValues.requirementId, requirements, setValue])

  const selectedRequirement = requirements.find((r) => r.id === formValues.requirementId)

  const applyParsedFields = (fields: ParsedResumeFields) => {
    const labels: string[] = []
    const apply = (key: keyof ParsedResumeFields, value?: string) => {
      if (!value?.trim()) return
      if (key === 'firstName' || key === 'lastName') {
        setValue(key, value.trim())
      } else if (key === 'email') {
        setValue('email', value.trim().toLowerCase())
      } else {
        setValue(key as keyof CandidateFormValues, value.trim())
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
    mutationFn: (file: File) => api.candidates.parseResume(file),
    onSuccess: (data) => {
      const count = applyParsedFields(data.fields)
      if (count > 0) {
        addToast(`Auto-filled ${count} field${count === 1 ? '' : 's'} from resume`, 'success')
      } else {
        addToast('Resume uploaded — no contact details detected; fill in manually', 'info')
      }
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof ApiError ? err.message : 'Could not read resume for auto-fill'
      addToast(`${msg}. You can still enter details manually.`, 'info')
    },
  })

  const handleResumeFile = (file: File | null) => {
    setResumeFile(file)
    setAutofilledLabels([])
    if (!file) return
    parseResumeMutation.mutate(file)
  }

  const onResumeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleResumeFile(e.target.files?.[0] ?? null)
  }

  const onResumeDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleResumeFile(file)
  }

  const createMutation = useMutation({
    mutationFn: async (data: CandidateFormValues) => {
      const selectedReq = requirements.find((r) => r.id === data.requirementId)
      const opt = (v?: string) => (v?.trim() ? v.trim() : undefined)

      return api.candidates.create({
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        role: data.role,
        status: 'SOURCED',
        matchScore: 0,
        source: data.source,
        appliedDate: new Date().toISOString(),
        requirementId: data.requirementId,
        jobTitle: selectedReq?.title || data.role,
        phone: data.phone,
        location: data.location.trim(),
        linkedIn: opt(data.linkedin),
        portfolio: opt(data.portfolio),
        totalExperience: data.totalExperience.trim(),
        currentCompany: data.currentCompany.trim(),
        currentCTC: data.currentCTC.trim(),
        expectedCTC: data.expectedCTC.trim(),
        noticePeriod: data.noticePeriod.trim(),
        pan: data.pan.trim().toUpperCase(),
        primarySkills: data.primarySkills,
        secondarySkills: data.secondarySkills,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    },
    onSuccess: async (newCandidate) => {
      try {
        if (resumeFile) {
          await api.candidates.uploadResume(newCandidate.id, resumeFile)
        }
        addToast('Candidate created successfully', 'success')
        queryClient.invalidateQueries({ queryKey: ['candidates'] })
        navigate(`/candidates/${newCandidate.id}`)
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Resume upload failed'
        addToast(`Candidate created but ${msg}`, 'error')
        navigate(`/candidates/${newCandidate.id}`)
      }
    },
    onError: (error) => {
      const msg =
        error instanceof ApiError ? error.message : 'Failed to create candidate'
      addToast(msg, 'error')
    },
  })

  const onSubmit = (data: CandidateFormValues) => {
    if (createMutation.isPending || emailIsDuplicate || emailCheckInProgress) return
    createMutation.mutate(data)
  }

  const nextStep = async () => {
    let isValid = false
    if (currentStep === 0) {
      isValid = await trigger([...STEP_0_FIELDS])
    } else if (currentStep === 1) {
      isValid = await trigger([...STEP_1_FIELDS])
      if (!isValid) return
      if (emailCheckInProgress) {
        addToast('Please wait while we verify the email address', 'info')
        return
      }
      if (emailIsDuplicate) {
        addToast('A candidate with this email already exists', 'error')
        return
      }
    }
    if (isValid) setCurrentStep((prev) => prev + 1)
  }

  const prevStep = () => setCurrentStep((prev) => Math.max(0, prev - 1))
  const progressPct = ((currentStep + 1) / STEPS.length) * 100

  const reviewRows = [
    { label: 'Job', value: selectedRequirement?.title ?? '—' },
    { label: 'Client', value: selectedRequirement?.client ?? '—' },
    { label: 'Role', value: formValues.role },
    { label: 'Source', value: formValues.source },
    { label: 'Email', value: formValues.email },
    { label: 'Phone', value: formValues.phone },
    { label: 'PAN', value: formValues.pan?.toUpperCase() },
    { label: 'Location', value: formValues.location },
    { label: 'Experience', value: formValues.totalExperience },
    { label: 'Company', value: formValues.currentCompany },
    { label: 'Current CTC', value: formValues.currentCTC },
    { label: 'Expected CTC', value: formValues.expectedCTC },
    { label: 'Notice', value: formValues.noticePeriod },
    ...(formValues.linkedin
      ? [{ label: 'LinkedIn', value: formValues.linkedin }]
      : []),
    ...(formValues.portfolio
      ? [{ label: 'Portfolio', value: formValues.portfolio }]
      : []),
    ...(resumeFile ? [{ label: 'Resume', value: resumeFile.name }] : []),
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <PageHero
        icon={UserPlus}
        eyebrow="New candidate"
        title="Add candidate"
        description={`Upload a resume to auto-fill, link to a job, then review before adding them as ${candidateStatusLabel('SOURCED')} in your pipeline.`}
        actions={
          <span className="text-xs font-bold uppercase tracking-wider text-white/80">
            Step {currentStep + 1} of {STEPS.length}
          </span>
        }
      />

      <div className="h-1.5 w-full rounded-full bg-primary/10 dark:bg-white/10 overflow-hidden">
        <div
          className="h-full bg-primary dark:bg-white transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        <nav className="hidden lg:flex flex-col gap-2 w-56 shrink-0" aria-label="Form steps">
          {STEPS.map((step) => {
            const Icon = step.icon
            const done = currentStep > step.id
            const active = currentStep === step.id
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (step.id < currentStep) setCurrentStep(step.id)
                }}
                disabled={step.id > currentStep}
                className={clsx(
                  'flex items-start gap-3 p-4 rounded-2xl border text-left transition-all',
                  active
                    ? 'border-primary/20 dark:border-white/20 bg-white dark:bg-white/5 shadow-sm'
                    : done
                      ? 'border-transparent hover:bg-primary/5 dark:hover:bg-white/5 cursor-pointer'
                      : 'border-transparent opacity-50 cursor-not-allowed'
                )}
              >
                <div
                  className={clsx(
                    'shrink-0 size-9 rounded-xl flex items-center justify-center',
                    done
                      ? 'bg-emerald-500 text-white'
                      : active
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-primary/10 dark:bg-white/10 text-muted-foreground'
                  )}
                >
                  {done ? <Check size={18} /> : <Icon size={18} />}
                </div>
                <div className="min-w-0">
                  <p
                    className={clsx(
                      'text-sm font-bold',
                      active ? 'text-primary dark:text-white' : 'text-primary/70 dark:text-white/70'
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-[11px] font-medium text-primary/45 dark:text-white/45 mt-0.5 leading-snug">
                    {step.description}
                  </p>
                </div>
              </button>
            )
          })}
        </nav>

        <div className="flex-1 min-w-0 bg-white dark:bg-white/5 border border-primary/10 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
          <div className="lg:hidden flex gap-2 p-3 border-b border-primary/10 dark:border-white/10 overflow-x-auto scrollbar-hide">
            {STEPS.map((step) => (
              <span
                key={step.id}
                className={clsx(
                  'shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider',
                  currentStep === step.id
                    ? 'bg-primary text-primary-foreground'
                    : currentStep > step.id
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                      : 'bg-primary/5 dark:bg-white/5 text-muted-foreground'
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
                  <h2 className="text-lg font-bold text-primary dark:text-white">
                    Resume & job assignment
                  </h2>
                  <p className="text-sm text-primary/50 dark:text-white/50 mt-1">
                    Optional resume upload fills profile fields on the next step.
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click()
                  }}
                  className={clsx(
                    'rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all',
                    isDragging
                      ? 'border-primary bg-primary/5 dark:bg-white/10'
                      : 'border-primary/20 dark:border-white/20 hover:border-primary/40 hover:bg-primary/[0.03] dark:hover:bg-white/[0.03]'
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={onResumeInputChange}
                  />
                  <div className="mx-auto size-14 rounded-2xl bg-primary/10 dark:bg-white/10 flex items-center justify-center text-primary/50 dark:text-white/50 mb-4">
                    {parseResumeMutation.isPending ? (
                      <Loader2 size={28} className="animate-spin" />
                    ) : resumeFile ? (
                      <FileText size={28} />
                    ) : (
                      <Upload size={28} />
                    )}
                  </div>
                  <p className="font-bold text-primary dark:text-white">
                    {parseResumeMutation.isPending
                      ? 'Reading resume…'
                      : resumeFile
                        ? resumeFile.name
                        : 'Drop resume here or click to upload'}
                  </p>
                  <p className="mt-1 text-xs text-primary/50 dark:text-white/50">
                    PDF or DOCX — extracts name, email, phone, skills, and more
                  </p>
                  {resumeFile && !parseResumeMutation.isPending && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleResumeFile(null)
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                      className="mt-3 text-xs font-bold text-primary/60 hover:text-primary dark:text-white/60 dark:hover:text-white underline"
                    >
                      Remove file
                    </button>
                  )}
                </div>

                {autofilledLabels.length > 0 && (
                  <div className="flex flex-wrap gap-2 items-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/30">
                    <Sparkles size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-xs font-bold text-emerald-800/80 dark:text-emerald-200 uppercase tracking-wider">
                      Auto-filled:
                    </span>
                    {autofilledLabels.map((label) => (
                      <span
                        key={label}
                        className="px-2 py-1 rounded-lg bg-white/80 dark:bg-black/20 text-emerald-800 dark:text-emerald-200 text-xs font-bold"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                )}

                <FormSection
                  title="Job assignment"
                  description="Every candidate must be linked to an open requirement."
                >
                  <div className="space-y-2">
                    <FieldLabel>Job requirement</FieldLabel>
                    <Controller
                      control={control}
                      name="requirementId"
                      render={({ field }) => (
                        <SearchableSelect
                          value={field.value ?? ''}
                          onChange={field.onChange}
                          options={requirementOptions}
                          placeholder="Select job requirement"
                          searchPlaceholder="Search jobs..."
                          allowClear={false}
                          icon={<Briefcase size={18} className="text-primary/40" />}
                        />
                      )}
                    />
                    <FieldError message={errors.requirementId?.message} />
                    <p className="text-xs text-muted-foreground">
                      Selecting a job fills the role title automatically.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <FieldLabel>Role / job title</FieldLabel>
                      <input
                        className={inputClass}
                        placeholder="e.g. Senior Frontend Engineer"
                        {...register('role')}
                      />
                      <FieldError message={errors.role?.message} />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel>Source</FieldLabel>
                      <AppSelect
                        value={formValues.source || 'Direct Application'}
                        onChange={(v) => setValue('source', v, { shouldValidate: true })}
                        options={CANDIDATE_SOURCE_OPTIONS}
                        aria-label="Candidate source"
                      />
                      <FieldError message={errors.source?.message} />
                    </div>
                  </div>
                </FormSection>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-primary dark:text-white">
                    Profile & skills
                  </h2>
                  <p className="text-sm text-primary/50 dark:text-white/50 mt-1">
                    Contact details, compensation, and skills for matching.
                  </p>
                </div>

                <FormSection title="Contact" description="Required for outreach and compliance.">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <FieldLabel>First name</FieldLabel>
                      <input
                        className={inputClass}
                        placeholder="e.g. Michael"
                        autoComplete="given-name"
                        {...register('firstName')}
                      />
                      <FieldError message={errors.firstName?.message} />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel>Last name</FieldLabel>
                      <input
                        className={inputClass}
                        placeholder="e.g. Scott"
                        autoComplete="family-name"
                        {...register('lastName')}
                      />
                      <FieldError message={errors.lastName?.message} />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel>Email address</FieldLabel>
                      <div className="relative">
                        <Mail
                          size={18}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/30 dark:text-white/30"
                        />
                        <input
                          className={clsx(
                            inputClass,
                            'pl-10',
                            emailIsDuplicate && 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                          )}
                          placeholder="michael@example.com"
                          autoComplete="email"
                          {...register('email')}
                        />
                      </div>
                      <FieldError message={!emailIsDuplicate ? errors.email?.message : undefined} />
                      {emailCheckInProgress && isValidEmailFormat(emailValue) && (
                        <p className="text-xs font-medium text-primary/50 flex items-center gap-1.5">
                          <Loader2 size={12} className="animate-spin" />
                          Checking email…
                        </p>
                      )}
                      {emailIsDuplicate && emailCheck?.candidateId && (
                        <p className="text-xs font-bold text-red-500">
                          A candidate with this email already exists.{' '}
                          <Link
                            to={`/candidates/${emailCheck.candidateId}`}
                            className="underline"
                          >
                            View {emailCheck.name ?? 'profile'}
                          </Link>
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <FieldLabel>Phone number</FieldLabel>
                      <div className="relative">
                        <Phone
                          size={18}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/30 dark:text-white/30"
                        />
                        <input
                          className={clsx(inputClass, 'pl-10')}
                          placeholder="+1 (555) 000-0000"
                          autoComplete="tel"
                          {...register('phone')}
                        />
                      </div>
                      <FieldError message={errors.phone?.message} />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel>PAN</FieldLabel>
                      <input
                        className={clsx(inputClass, 'uppercase')}
                        placeholder="e.g. ABCDE1234F"
                        maxLength={10}
                        autoComplete="off"
                        {...register('pan')}
                      />
                      <FieldError message={errors.pan?.message} />
                      <p className="text-xs text-muted-foreground">
                        10-character Permanent Account Number
                      </p>
                    </div>
                    <div className="space-y-2">
                      <FieldLabel>Location</FieldLabel>
                      <Controller
                        control={control}
                        name="location"
                        render={({ field }) => (
                          <IndianItCitySelect
                            value={field.value ?? ''}
                            onChange={field.onChange}
                          />
                        )}
                      />
                      <FieldError message={errors.location?.message} />
                      <p className="text-xs text-muted-foreground">
                        Major IT hubs across India — use search to filter.
                      </p>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <FieldLabel required={false}>LinkedIn</FieldLabel>
                      <input
                        className={inputClass}
                        placeholder="https://linkedin.com/in/..."
                        {...register('linkedin')}
                      />
                      <FieldError message={errors.linkedin?.message} />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <FieldLabel required={false}>Portfolio</FieldLabel>
                      <input
                        className={inputClass}
                        placeholder="https://..."
                        {...register('portfolio')}
                      />
                      <FieldError message={errors.portfolio?.message} />
                    </div>
                  </div>
                </FormSection>

                <FormSection
                  title="Compensation & availability"
                  description="Used by recruiters and hiring managers during screening."
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <FieldLabel>Total experience</FieldLabel>
                      <input
                        className={inputClass}
                        placeholder="e.g. 5 years"
                        {...register('totalExperience')}
                      />
                      <FieldError message={errors.totalExperience?.message} />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel>Current company</FieldLabel>
                      <input
                        className={inputClass}
                        placeholder="e.g. Google"
                        {...register('currentCompany')}
                      />
                      <FieldError message={errors.currentCompany?.message} />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel>Current CTC</FieldLabel>
                      <input
                        className={inputClass}
                        placeholder="e.g. 24 LPA"
                        {...register('currentCTC')}
                      />
                      <FieldError message={errors.currentCTC?.message} />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel>Expected CTC</FieldLabel>
                      <input
                        className={inputClass}
                        placeholder="e.g. 30 LPA"
                        {...register('expectedCTC')}
                      />
                      <FieldError message={errors.expectedCTC?.message} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <FieldLabel>Notice period</FieldLabel>
                      <input
                        className={inputClass}
                        placeholder="e.g. 30 days"
                        {...register('noticePeriod')}
                      />
                      <FieldError message={errors.noticePeriod?.message} />
                    </div>
                  </div>
                </FormSection>

                <div className="rounded-2xl border border-primary/10 dark:border-white/10 px-5 py-5">
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
                            isAdmin={user?.role === 'ADMIN'}
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
                  <h2 className="text-lg font-bold text-primary dark:text-white">
                    Review & create
                  </h2>
                  <p className="text-sm text-primary/50 dark:text-white/50 mt-1">
                    Confirm details before adding this person to your talent pool.
                  </p>
                </div>

                <div className="rounded-2xl border border-primary/10 dark:border-white/10 overflow-hidden divide-y divide-primary/10 dark:divide-white/10">
                  <div className="p-5 flex items-center gap-4 bg-primary/[0.02] dark:bg-white/[0.02]">
                    <div className="size-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-black text-xl shrink-0">
                      {formValues.firstName?.[0]}
                      {formValues.lastName?.[0]}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xl font-bold text-primary dark:text-white truncate">
                        {formValues.firstName} {formValues.lastName}
                      </h3>
                      <p className="text-sm font-medium text-primary/60 dark:text-white/60 truncate">
                        {formValues.role}
                      </p>
                      {selectedRequirement && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {selectedRequirement.jobCode}
                          {selectedRequirement.client
                            ? ` · ${selectedRequirement.client}`
                            : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {reviewRows.map((row) => (
                      <div key={row.label} className={row.label === 'Resume' ? 'col-span-2' : undefined}>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {row.label}
                        </p>
                        <p className="text-sm font-bold text-primary dark:text-white mt-0.5 truncate">
                          {row.value ?? '—'}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="p-5 space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Primary skills
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(formValues.primarySkills ?? []).length > 0 ? (
                        formValues.primarySkills!.map((s) => (
                          <span
                            key={s}
                            className="px-2.5 py-1 rounded-lg bg-primary/10 dark:bg-white/10 text-xs font-bold text-primary dark:text-white"
                          >
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-primary/50">—</span>
                      )}
                    </div>
                    {(formValues.secondarySkills?.length ?? 0) > 0 && (
                      <>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pt-2">
                          Secondary skills
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {formValues.secondarySkills!.map((s) => (
                            <span
                              key={s}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/10 text-xs font-bold text-slate-700 dark:text-white/80"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-200">
                  <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
                  <p className="text-sm font-medium leading-relaxed">
                    This candidate will be created as{' '}
                    <strong>{candidateStatusLabel('SOURCED')}</strong> and linked to the selected
                    job. Match score is calculated after save.
                  </p>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/10 dark:border-white/10 text-primary/70 dark:text-white/70">
                  <Info size={20} className="shrink-0 mt-0.5" />
                  <p className="text-sm font-medium leading-relaxed">
                    {resumeFile
                      ? `Resume "${resumeFile.name}" will be attached after the profile is created.`
                      : 'You can upload a resume from the candidate profile later.'}
                  </p>
                </div>
              </div>
            )}

            <WizardStepFooter
              currentStep={currentStep}
              onPreviousStep={prevStep}
              exitTo="/candidates"
              exitLabel="Cancel"
            >
              {currentStep < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={
                    currentStep === 1 && (emailIsDuplicate || emailCheckInProgress)
                  }
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  Continue
                  <ArrowRight size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit(onSubmit)}
                  disabled={
                    createMutation.isPending || emailIsDuplicate || emailCheckInProgress
                  }
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm active:scale-[0.98] transition-all shadow-lg shadow-emerald-600/25 disabled:opacity-60 w-full sm:w-auto"
                >
                  {createMutation.isPending ? 'Creating…' : 'Create candidate'}
                  {!createMutation.isPending && <Check size={18} />}
                </button>
              )}
            </WizardStepFooter>
          </form>
        </div>
      </div>
    </div>
  )
}

export default NewCandidate
