import React, { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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
  MapPin,
  Sparkles,
  User,
  Users,
} from 'lucide-react'
import { api } from '@/services/api'
import clsx from 'clsx'
import { useAuth } from '@/hooks/useAuth'
import { isAdminRole } from '@/permissions'
import { SkillSelectSection } from '@/components/skills/SkillSelectSection'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { AppSelect } from '@/components/ui/AppSelect'
import { EMPLOYMENT_TYPE_OPTIONS } from '@/lib/selectOptions'
import { WizardStepFooter } from '@/components/ui/WizardStepFooter'
import { PageHero } from '@/components/layout/PageHero'
import { ClientSelectField } from '@/components/requirements/ClientSelectField'
import {
  isSingleClientValue,
  ONE_CLIENT_PER_REQUIREMENT_MSG,
} from '@/lib/requirementClient'
import { useToastStore } from '@/store/toastStore'
import { priorityMeta } from '@/pages/requirements/_shared/requirement.utils'
import { ApiError } from '@/lib/apiClient'
import {
  EMPLOYMENT_TYPES,
  WORK_MODES,
  SENIORITY_LEVELS,
  buildLocationDisplay,
  employmentTypeLabel,
  workModeLabel,
  seniorityLabel,
  formatExperienceRange,
  formatRequirementLocation,
  formatDateLabel,
} from '@/lib/requirementFields'
import './new.css'

const requiredYears = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? NaN : Number(v)),
  z
    .number({ invalid_type_error: 'Required', required_error: 'Required' })
    .min(0, 'Must be 0 or more')
    .max(50, 'Must be 50 or less')
)

const schema = z
  .object({
    client: z
      .string()
      .min(1, 'Client is required')
      .refine(isSingleClientValue, { message: ONE_CLIENT_PER_REQUIREMENT_MSG }),
    title: z.string().min(3, 'Title must be at least 3 characters'),
    department: z.string().min(1, 'Department is required'),
    hiringManager: z.string().min(1, 'Hiring Manager is required'),
    openings: z.number().min(1, 'At least 1 opening required'),
    primarySkills: z.array(z.string()).min(1, 'Select at least one primary skill'),
    secondarySkills: z.array(z.string()).default([]),
    jobDescription: z.string().min(20, 'Job description must be at least 20 characters'),
    priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
    seniorityLevel: z.enum(['JUNIOR', 'MID', 'SENIOR', 'LEAD', 'PRINCIPAL'], {
      required_error: 'Seniority level is required',
    }),
    employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'], {
      required_error: 'Employment type is required',
    }),
    workMode: z.enum(['REMOTE', 'HYBRID', 'ONSITE'], {
      required_error: 'Work mode is required',
    }),
    locationCity: z.string().min(1, 'City is required').max(120),
    isRemote: z.boolean().default(false),
    experienceMinYears: requiredYears,
    experienceMaxYears: requiredYears,
    salaryBand: z.string().min(1, 'Salary / CTC band is required').max(120),
    targetStartDate: z.string().min(1, 'Target start date is required'),
    hiringDeadline: z.string().min(1, 'Hiring deadline is required'),
  })
  .refine((d) => d.experienceMaxYears >= d.experienceMinYears, {
    message: 'Max experience must be ≥ min',
    path: ['experienceMaxYears'],
  })
  .refine((d) => new Date(d.hiringDeadline) >= new Date(d.targetStartDate), {
    message: 'Hiring deadline must be on or after target start',
    path: ['hiringDeadline'],
  })

type RequirementFormValues = z.infer<typeof schema>

const STEPS = [
  { id: 0, label: 'Role details', description: 'Title, team, and hiring lead', icon: Briefcase },
  { id: 1, label: 'Skills & description', description: 'Skills and full job description', icon: Sparkles },
  { id: 2, label: 'Review & submit', description: 'Confirm before HR approval', icon: CheckCircle2 },
] as const

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-white dark:bg-white/[0.02] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium text-primary dark:text-white placeholder:text-primary/30 dark:placeholder:text-white/30 transition-shadow'

function FieldLabel({
  children,
  required,
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

const NewRequirement = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { addToast } = useToastStore()
  const [currentStep, setCurrentStep] = useState(0)

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: api.users.list,
  })

  const { data: departmentCatalog = [] } = useQuery({
    queryKey: ['department-catalog'],
    queryFn: api.departments.list,
  })

  const departmentOptions = useMemo(
    () => departmentCatalog.map((d) => ({ value: d.name, label: d.name })),
    [departmentCatalog]
  )

  const hiringManagerOptions = useMemo(
    () =>
      users
        .filter((u) => u.status === 'ACTIVE' && u.role === 'HIRING_MANAGER')
        .map((u) => ({
          value: u.name,
          label: u.name,
          sublabel: [u.department, u.email].filter(Boolean).join(' · '),
        })),
    [users]
  )

  const defaultHiringManager = user?.role === 'HIRING_MANAGER' && user.name ? user.name : ''

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    trigger,
    watch,
    setValue,
  } = useForm<RequirementFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      openings: 1,
      priority: 'MEDIUM',
      employmentType: 'FULL_TIME',
      isRemote: false,
      primarySkills: [],
      secondarySkills: [],
      hiringManager: defaultHiringManager,
      locationCity: '',
      salaryBand: '',
      targetStartDate: '',
      hiringDeadline: '',
    },
  })

  const formValues = watch()

  const createMutation = useMutation({
    mutationFn: (data: RequirementFormValues) => {
      const { jobDescription, ...fields } = data
      return api.requirements.create({
        ...fields,
        location: buildLocationDisplay(data),
        description: jobDescription.slice(0, 2000),
        jobDescription,
        status: 'PENDING_APPROVAL',
        recruiters: [],
        createdBy: user?.uid,
        createdByRole: user?.role,
        targetStartDate: data.targetStartDate || undefined,
        hiringDeadline: data.hiringDeadline || undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requirements'] })
      queryClient.invalidateQueries({ queryKey: ['pendingRequirements'] })
      addToast('Job submitted for HR approval', 'success')
      navigate('/requirements')
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Failed to create requirement'
      addToast(msg, 'error')
    },
  })

  const onSubmit = (data: RequirementFormValues) => {
    createMutation.mutate(data)
  }

  const nextStep = async () => {
    let isValid = false
    if (currentStep === 0) {
      isValid = await trigger([
        'client',
        'title',
        'department',
        'hiringManager',
        'openings',
        'priority',
        'seniorityLevel',
        'employmentType',
        'workMode',
        'locationCity',
        'isRemote',
        'experienceMinYears',
        'experienceMaxYears',
        'salaryBand',
        'targetStartDate',
        'hiringDeadline',
      ])
    } else if (currentStep === 1) {
      isValid = await trigger(['primarySkills', 'secondarySkills', 'jobDescription'])
    }
    if (isValid) setCurrentStep((prev) => prev + 1)
  }

  const prevStep = () => setCurrentStep((prev) => Math.max(0, prev - 1))

  const progressPct = ((currentStep + 1) / STEPS.length) * 100

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <PageHero
        icon={Briefcase}
        eyebrow="New job"
        title="Post a job"
        description="Three quick steps. Your posting goes to HR for approval before it appears on the job board."
        actions={
          <span className="text-xs font-bold uppercase tracking-wider text-white/80">
            Step {currentStep + 1} of {STEPS.length}
          </span>
        }
      />

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-primary/10 dark:bg-white/10 overflow-hidden">
        <div
          className="h-full bg-primary dark:bg-white transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Step sidebar — desktop */}
        <nav
          className="hidden lg:flex flex-col gap-2 w-56 shrink-0"
          aria-label="Form steps"
        >
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

        {/* Main panel */}
        <div className="flex-1 min-w-0 bg-white dark:bg-white/5 border border-primary/10 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
          {/* Mobile step pills */}
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

          <form
            onSubmit={(e) => e.preventDefault()}
            className="p-6 md:p-8"
          >
            {currentStep === 0 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-primary dark:text-white">Role details</h2>
                  <p className="text-sm text-primary/50 dark:text-white/50 mt-1">
                    Core information recruiters and hiring managers need.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] px-4 py-3 flex gap-3">
                    <Info className="shrink-0 text-muted-foreground mt-0.5" size={18} />
                    <p className="text-sm text-primary/60 dark:text-white/60">
                      <span className="font-bold text-primary dark:text-white">Req ID</span> is assigned
                      automatically when you submit (e.g. REQ-XXXXXX).
                    </p>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <FieldLabel required>Client</FieldLabel>
                    <Controller
                      control={control}
                      name="client"
                      render={({ field }) => (
                        <ClientSelectField
                          value={field.value ?? ''}
                          onChange={field.onChange}
                          error={errors.client?.message}
                          showAdminLink={isAdminRole(user?.role)}
                        />
                      )}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <FieldLabel required>Job title</FieldLabel>
                    <input
                      className={inputClass}
                      placeholder="e.g. Senior Product Designer"
                      {...register('title')}
                    />
                    <FieldError message={errors.title?.message} />
                  </div>

                  <div className="space-y-2">
                    <FieldLabel required>Department</FieldLabel>
                    <Controller
                      control={control}
                      name="department"
                      render={({ field }) => (
                        <SearchableSelect
                          value={field.value ?? ''}
                          onChange={field.onChange}
                          options={departmentOptions}
                          placeholder="Select department"
                          emptyLabel={
                            departmentOptions.length === 0
                              ? 'No departments yet — ask an admin to add them.'
                              : 'No matching department'
                          }
                        />
                      )}
                    />
                    <FieldError message={errors.department?.message} />
                  </div>

                  <div className="space-y-2">
                    <FieldLabel required>Hiring manager</FieldLabel>
                    <Controller
                      control={control}
                      name="hiringManager"
                      render={({ field }) => (
                        <SearchableSelect
                          value={field.value ?? ''}
                          onChange={field.onChange}
                          options={hiringManagerOptions}
                          placeholder={
                            hiringManagerOptions.length
                              ? 'Select hiring manager'
                              : 'No hiring managers in system'
                          }
                          searchPlaceholder="Search managers…"
                          emptyLabel="No hiring managers found"
                          allowClear={false}
                          icon={<User size={18} className="text-primary/40" />}
                        />
                      )}
                    />
                    <FieldError message={errors.hiringManager?.message} />
                    {hiringManagerOptions.length === 0 && (
                      <p className="text-xs text-primary/50 dark:text-white/50">
                        Add users with the Hiring Manager role in Admin → User Management.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <FieldLabel required>Openings</FieldLabel>
                    <div className="relative">
                      <Users
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/35 dark:text-white/35"
                      />
                      <input
                        type="number"
                        min={1}
                        className={clsx(inputClass, 'pl-10')}
                        {...register('openings', { valueAsNumber: true })}
                      />
                    </div>
                    <FieldError message={errors.openings?.message} />
                  </div>

                  <div className="space-y-2">
                    <FieldLabel required>Seniority level</FieldLabel>
                    <div className="flex flex-wrap gap-2">
                      {SENIORITY_LEVELS.map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() =>
                            setValue('seniorityLevel', s.value, { shouldValidate: true })
                          }
                          className={clsx(
                            'px-3 py-2 rounded-xl text-xs font-bold border transition-all',
                            formValues.seniorityLevel === s.value
                              ? 'bg-primary text-primary-foreground border-primary dark:border-white'
                              : 'bg-primary/5 dark:bg-white/5 border-primary/10 dark:border-white/10'
                          )}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                    <FieldError message={errors.seniorityLevel?.message} />
                  </div>

                  <div className="space-y-2">
                    <FieldLabel required>Employment type</FieldLabel>
                    <AppSelect
                      value={formValues.employmentType}
                      onChange={(v) => setValue('employmentType', v as typeof formValues.employmentType, { shouldValidate: true })}
                      options={EMPLOYMENT_TYPE_OPTIONS}
                      aria-label="Employment type"
                    />
                  </div>

                  <div className="space-y-2">
                    <FieldLabel required>Work mode</FieldLabel>
                    <div className="flex flex-wrap gap-2">
                      {WORK_MODES.map((m) => (
                        <button
                          key={m.value}
                          type="button"
                          onClick={() => setValue('workMode', m.value, { shouldValidate: true })}
                          className={clsx(
                            'px-3 py-2 rounded-xl text-xs font-bold border transition-all',
                            formValues.workMode === m.value
                              ? 'bg-primary text-primary-foreground border-primary dark:border-white'
                              : 'bg-primary/5 dark:bg-white/5 border-primary/10 dark:border-white/10'
                          )}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                    <FieldError message={errors.workMode?.message} />
                  </div>

                  <div className="space-y-2">
                    <FieldLabel required>City</FieldLabel>
                    <div className="relative">
                      <MapPin
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/35 dark:text-white/35"
                      />
                      <input
                        className={clsx(inputClass, 'pl-10')}
                        placeholder="e.g. Bangalore"
                        {...register('locationCity')}
                      />
                    </div>
                    <FieldError message={errors.locationCity?.message} />
                  </div>

                  <div className="space-y-2 flex flex-col justify-end">
                    <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 cursor-pointer">
                      <input
                        type="checkbox"
                        className="size-4 rounded border-primary/30"
                        {...register('isRemote')}
                      />
                      <span className="text-sm font-bold text-primary dark:text-white">
                        Fully remote role
                      </span>
                    </label>
                  </div>

                  <div className="space-y-2">
                    <FieldLabel required>Experience (years)</FieldLabel>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        min={0}
                        max={50}
                        className={inputClass}
                        placeholder="Min"
                        {...register('experienceMinYears')}
                      />
                      <input
                        type="number"
                        min={0}
                        max={50}
                        className={inputClass}
                        placeholder="Max"
                        {...register('experienceMaxYears')}
                      />
                    </div>
                    <FieldError message={errors.experienceMinYears?.message} />
                    <FieldError message={errors.experienceMaxYears?.message} />
                  </div>

                  <div className="space-y-2">
                    <FieldLabel required>Salary / CTC band</FieldLabel>
                    <input
                      className={inputClass}
                      placeholder="e.g. 12–18 LPA"
                      {...register('salaryBand')}
                    />
                    <FieldError message={errors.salaryBand?.message} />
                  </div>

                  <div className="space-y-2">
                    <FieldLabel required>Target start date</FieldLabel>
                    <input type="date" className={inputClass} {...register('targetStartDate')} />
                    <FieldError message={errors.targetStartDate?.message} />
                  </div>

                  <div className="space-y-2">
                    <FieldLabel required>Hiring deadline</FieldLabel>
                    <input type="date" className={inputClass} {...register('hiringDeadline')} />
                    <FieldError message={errors.hiringDeadline?.message} />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <FieldLabel>Priority</FieldLabel>
                    <div className="flex flex-wrap gap-2">
                      {PRIORITIES.map((p) => {
                        const meta = priorityMeta(p)
                        const selected = formValues.priority === p
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setValue('priority', p)}
                            className={clsx(
                              'px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all',
                              selected
                                ? 'bg-primary text-primary-foreground border-primary dark:border-white shadow-sm'
                                : 'bg-primary/5 dark:bg-white/5 border-primary/10 dark:border-white/10 hover:border-primary/25',
                              !selected && meta.className
                            )}
                          >
                            {meta.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-primary dark:text-white flex items-center gap-2">
                    <Sparkles size={20} className="text-primary/50 dark:text-white/50" />
                    Skills & job description
                  </h2>
                  <p className="text-sm text-primary/50 dark:text-white/50 mt-1">
                    Used for candidate matching and the public job posting.
                  </p>
                </div>

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
                          isAdmin={isAdminRole(user?.role)}
                          primaryError={errors.primarySkills?.message}
                        />
                      )}
                    />
                  )}
                />

                <div className="space-y-2">
                  <FieldLabel required>Job description</FieldLabel>
                  <div className="relative">
                    <FileText
                      size={18}
                      className="absolute left-3 top-4 text-primary/35 dark:text-white/35"
                    />
                    <textarea
                      className={clsx(
                        inputClass,
                        'pl-10 h-56 resize-none leading-relaxed'
                      )}
                      placeholder="Responsibilities, qualifications, and role expectations…"
                      {...register('jobDescription')}
                    />
                  </div>
                  <FieldError message={errors.jobDescription?.message} />
                  <p className="text-[11px] text-muted-foreground">
                    Minimum 20 characters · {(formValues.jobDescription ?? '').length} entered
                  </p>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-primary dark:text-white">Review & submit</h2>
                  <p className="text-sm text-primary/50 dark:text-white/50 mt-1">
                    Confirm everything looks right before sending to HR.
                  </p>
                </div>

                <div className="rounded-2xl border border-primary/10 dark:border-white/10 overflow-hidden divide-y divide-primary/10 dark:divide-white/10">
                  <div className="p-5 bg-primary/[0.02] dark:bg-white/[0.02]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      Job title
                    </p>
                    <p className="text-xl font-black text-primary dark:text-white">
                      {formValues.title || '—'}
                    </p>
                    {formValues.client && (
                      <p className="text-sm font-medium text-primary/60 dark:text-white/60 mt-1">
                        {formValues.client}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2 font-mono">
                      Req ID assigned on submit
                    </p>
                  </div>

                  <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[
                      { label: 'Department', value: formValues.department },
                      { label: 'Hiring manager', value: formValues.hiringManager },
                      { label: 'Openings', value: formValues.openings },
                      {
                        label: 'Priority',
                        value: priorityMeta(formValues.priority).label,
                      },
                      {
                        label: 'Seniority',
                        value: formValues.seniorityLevel
                          ? seniorityLabel(formValues.seniorityLevel)
                          : '—',
                      },
                      {
                        label: 'Employment',
                        value: employmentTypeLabel(formValues.employmentType),
                      },
                      {
                        label: 'Work mode',
                        value: formValues.workMode
                          ? workModeLabel(formValues.workMode)
                          : formValues.isRemote
                            ? 'Remote'
                            : '—',
                      },
                      {
                        label: 'Location',
                        value: formatRequirementLocation({
                          location: buildLocationDisplay(formValues),
                          locationCity: formValues.locationCity,
                          workMode: formValues.workMode,
                          isRemote: formValues.isRemote,
                        }),
                      },
                      {
                        label: 'Experience',
                        value: formatExperienceRange(
                          formValues.experienceMinYears,
                          formValues.experienceMaxYears
                        ),
                      },
                      { label: 'CTC band', value: formValues.salaryBand || '—' },
                      {
                        label: 'Target start',
                        value: formatDateLabel(formValues.targetStartDate),
                      },
                      {
                        label: 'Hiring deadline',
                        value: formatDateLabel(formValues.hiringDeadline),
                      },
                    ].map((row) => (
                      <div key={row.label}>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {row.label}
                        </p>
                        <p className="text-sm font-bold text-primary dark:text-white mt-0.5">
                          {row.value ?? '—'}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="p-5 space-y-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
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
                    </div>
                    {(formValues.secondarySkills?.length ?? 0) > 0 && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
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
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Job description preview
                    </p>
                    <p className="text-sm text-primary/80 dark:text-white/80 whitespace-pre-wrap line-clamp-6 leading-relaxed">
                      {formValues.jobDescription || '—'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/30 text-amber-900 dark:text-amber-200">
                  <Info size={20} className="shrink-0 mt-0.5" />
                  <p className="text-sm font-medium leading-relaxed">
                    This job will be saved as <strong>Pending approval</strong>. Only{' '}
                    <strong>HR Head</strong> can approve it before it goes live
                    before it goes live on the job board and candidate portal.
                  </p>
                </div>
              </div>
            )}

            <WizardStepFooter
              currentStep={currentStep}
              onPreviousStep={prevStep}
              exitTo="/requirements"
              exitLabel="Cancel"
            >
              {currentStep < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 dark:shadow-none w-full sm:w-auto"
                >
                  Continue
                  <ArrowRight size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit(onSubmit)}
                  disabled={createMutation.isPending}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm active:scale-[0.98] transition-all shadow-lg shadow-emerald-600/25 disabled:opacity-60 w-full sm:w-auto"
                >
                  {createMutation.isPending ? 'Submitting…' : 'Submit for approval'}
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

export default NewRequirement
