import React, { useMemo, useRef, useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import type { ParsedResumeFields } from '../../services/http/candidates'
import clsx from 'clsx'
import { useToastStore } from '../../store/toastStore'
import { ApiError } from '../../lib/apiClient'
import { SearchableSelect } from '../../components/ui/SearchableSelect'
import { SkillSelectSection } from '../../components/skills/SkillSelectSection'
import { useAuth } from '../../hooks/useAuth'

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
    location: requiredString('Location'),
    portfolio: z.string().url('Invalid URL').optional().or(z.literal('')),
    requirementId: requiredString('Job requirement'),
    primarySkills: z.array(z.string()).min(1, 'Select at least one primary skill'),
    secondarySkills: z.array(z.string()).default([]),
})

function FieldLabel({
    children,
    required = true,
}: {
    children: React.ReactNode
    required?: boolean
}) {
    return (
        <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider flex items-center gap-0.5">
            {required && (
                <span className="text-red-500" aria-hidden="true">
                    *
                </span>
            )}
            {children}
        </label>
    )
}

type CandidateFormValues = z.infer<typeof schema>

const STEPS = [
    { label: 'Candidate details', icon: 'person' },
    { label: 'Review', icon: 'check_circle' },
]

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
            requirements.map((req) => ({
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

    const formData = watch()
    const emailValue = formData.email ?? ''
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
        if (formData.requirementId) {
            const req = requirements.find((r) => r.id === formData.requirementId)
            if (req) setValue('role', req.title)
        }
    }, [formData.requirementId, requirements, setValue])

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
        apply('location', fields.location)
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
                err instanceof ApiError
                    ? err.message
                    : 'Could not read resume for auto-fill'
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
            console.error('Creation failed', error)
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
        const isValid = await trigger()
        if (!isValid) return
        if (emailCheckInProgress) {
            addToast('Please wait while we verify the email address', 'info')
            return
        }
        if (emailIsDuplicate) {
            addToast('A candidate with this email already exists', 'error')
            return
        }
        setCurrentStep(1)
    }

    const inputClass =
        'w-full px-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-medium text-primary dark:text-white placeholder:text-primary/20'

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        to="/candidates"
                        className="p-2 hover:bg-primary/5 dark:hover:bg-white/5 rounded-full text-primary/60 dark:text-white/40 hover:text-primary dark:hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-primary dark:text-white tracking-tight">
                            Add Candidate
                        </h1>
                        <p className="text-sm font-medium text-primary/60 dark:text-white/60">
                            Upload a resume to auto-fill, then confirm the essentials.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-white/5 border border-primary/10 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex border-b border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02]">
                    {STEPS.map((step, index) => (
                        <div
                            key={index}
                            className={clsx(
                                'flex-1 px-6 py-4 flex items-center justify-center gap-2 border-b-2 transition-all',
                                index <= currentStep
                                    ? 'border-primary dark:border-white'
                                    : 'border-transparent'
                            )}
                        >
                            <div
                                className={clsx(
                                    'size-6 rounded-full flex items-center justify-center text-[10px] font-bold',
                                    index < currentStep
                                        ? 'bg-green-500 text-white'
                                        : index === currentStep
                                          ? 'bg-primary dark:bg-white text-white dark:text-primary'
                                          : 'bg-primary/10 dark:bg-white/10 text-primary/40 dark:text-white/40'
                                )}
                            >
                                {index < currentStep ? (
                                    <span className="material-symbols-outlined !text-sm">check</span>
                                ) : (
                                    <span className="material-symbols-outlined !text-sm">
                                        {step.icon}
                                    </span>
                                )}
                            </div>
                            <span
                                className={clsx(
                                    'text-xs font-bold uppercase tracking-wider hidden sm:block',
                                    index <= currentStep
                                        ? 'text-primary dark:text-white'
                                        : 'text-primary/40 dark:text-white/40'
                                )}
                            >
                                {step.label}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="p-8">
                    {currentStep === 0 && (
                        <div className="space-y-8">
                            {/* Resume-first */}
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
                                        : 'border-primary/20 dark:border-white/20 hover:border-primary/40 hover:bg-primary/[0.03]'
                                )}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                    className="hidden"
                                    onChange={onResumeInputChange}
                                />
                                <span className="material-symbols-outlined text-4xl text-primary/40 dark:text-white/40">
                                    {parseResumeMutation.isPending ? 'hourglass_top' : 'upload_file'}
                                </span>
                                <p className="mt-3 font-bold text-primary dark:text-white">
                                    {parseResumeMutation.isPending
                                        ? 'Reading resume…'
                                        : resumeFile
                                          ? resumeFile.name
                                          : 'Drop resume here or click to upload'}
                                </p>
                                <p className="mt-1 text-xs text-primary/50 dark:text-white/50">
                                    PDF or DOCX — we extract name, email, phone, LinkedIn, and more
                                </p>
                                {resumeFile && !parseResumeMutation.isPending && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleResumeFile(null)
                                            if (fileInputRef.current) fileInputRef.current.value = ''
                                        }}
                                        className="mt-3 text-xs font-bold text-primary/60 hover:text-primary underline"
                                    >
                                        Remove file
                                    </button>
                                )}
                            </div>

                            {autofilledLabels.length > 0 && (
                                <div className="flex flex-wrap gap-2 items-center">
                                    <span className="text-xs font-bold text-primary/50 uppercase tracking-wider">
                                        Auto-filled:
                                    </span>
                                    {autofilledLabels.map((label) => (
                                        <span
                                            key={label}
                                            className="px-2 py-1 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs font-bold"
                                        >
                                            {label}
                                        </span>
                                    ))}
                                </div>
                            )}

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
                                            searchPlaceholder="Search job requirements..."
                                            allowClear={false}
                                            icon={
                                                <span className="material-symbols-outlined !text-lg">
                                                    assignment
                                                </span>
                                            }
                                        />
                                    )}
                                />
                                {errors.requirementId && (
                                    <p className="text-xs font-bold text-red-500">
                                        {errors.requirementId.message}
                                    </p>
                                )}
                                <p className="text-xs text-primary/40 dark:text-white/40">
                                    Selecting a job fills the role title automatically.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <FieldLabel>First name</FieldLabel>
                                    <input
                                        className={inputClass}
                                        placeholder="e.g. Michael"
                                        autoComplete="given-name"
                                        {...register('firstName')}
                                    />
                                    {errors.firstName && (
                                        <p className="text-xs font-bold text-red-500">
                                            {errors.firstName.message}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <FieldLabel>Last name</FieldLabel>
                                    <input
                                        className={inputClass}
                                        placeholder="e.g. Scott"
                                        autoComplete="family-name"
                                        {...register('lastName')}
                                    />
                                    {errors.lastName && (
                                        <p className="text-xs font-bold text-red-500">
                                            {errors.lastName.message}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <FieldLabel>Email address</FieldLabel>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/30">
                                            mail
                                        </span>
                                        <input
                                            className={clsx(
                                                inputClass,
                                                'pl-10',
                                                emailIsDuplicate &&
                                                    'border-red-500 focus:border-red-500'
                                            )}
                                            placeholder="michael@example.com"
                                            autoComplete="email"
                                            {...register('email')}
                                        />
                                    </div>
                                    {errors.email && !emailIsDuplicate && (
                                        <p className="text-xs font-bold text-red-500">
                                            {errors.email.message}
                                        </p>
                                    )}
                                    {emailCheckInProgress && isValidEmailFormat(emailValue) && (
                                        <p className="text-xs font-medium text-primary/50">
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
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/30">
                                            call
                                        </span>
                                        <input
                                            className={clsx(inputClass, 'pl-10')}
                                            placeholder="+1 (555) 000-0000"
                                            autoComplete="tel"
                                            {...register('phone')}
                                        />
                                    </div>
                                    {errors.phone && (
                                        <p className="text-xs font-bold text-red-500">
                                            {errors.phone.message}
                                        </p>
                                    )}
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
                                    {errors.pan && (
                                        <p className="text-xs font-bold text-red-500">{errors.pan.message}</p>
                                    )}
                                    <p className="text-xs text-primary/40 dark:text-white/40">
                                        10-character Permanent Account Number
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <FieldLabel>Location</FieldLabel>
                                    <input
                                        className={inputClass}
                                        placeholder="e.g. San Francisco, CA"
                                        autoComplete="address-level2"
                                        {...register('location')}
                                    />
                                    {errors.location && (
                                        <p className="text-xs font-bold text-red-500">
                                            {errors.location.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <FieldLabel>Role / job title</FieldLabel>
                                    <input
                                        className={inputClass}
                                        placeholder="e.g. Senior Frontend Engineer"
                                        {...register('role')}
                                    />
                                    {errors.role && (
                                        <p className="text-xs font-bold text-red-500">
                                            {errors.role.message}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <FieldLabel>Source</FieldLabel>
                                    <select className={inputClass} {...register('source')}>
                                        <option value="Direct Application">Direct Application</option>
                                        <option value="LinkedIn">LinkedIn</option>
                                        <option value="Referral">Referral</option>
                                        <option value="Agency">Agency</option>
                                        <option value="Recruiter Added">Recruiter Added</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <FieldLabel required={false}>LinkedIn</FieldLabel>
                                    <input
                                        className={inputClass}
                                        placeholder="https://linkedin.com/in/..."
                                        {...register('linkedin')}
                                    />
                                    {errors.linkedin && (
                                        <p className="text-xs font-bold text-red-500">
                                            {errors.linkedin.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="border border-primary/10 dark:border-white/10 rounded-xl overflow-hidden px-5 py-5 space-y-4">
                                <p className="font-bold text-sm text-primary dark:text-white flex items-center gap-0.5">
                                    <span className="text-red-500" aria-hidden="true">
                                        *
                                    </span>
                                    Compensation & availability
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <FieldLabel>Total experience</FieldLabel>
                                        <input
                                            className={inputClass}
                                            placeholder="e.g. 5 Years"
                                            {...register('totalExperience')}
                                        />
                                        {errors.totalExperience && (
                                            <p className="text-xs font-bold text-red-500">
                                                {errors.totalExperience.message}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <FieldLabel>Current company</FieldLabel>
                                        <input
                                            className={inputClass}
                                            placeholder="e.g. Google"
                                            {...register('currentCompany')}
                                        />
                                        {errors.currentCompany && (
                                            <p className="text-xs font-bold text-red-500">
                                                {errors.currentCompany.message}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <FieldLabel>Current CTC</FieldLabel>
                                        <input
                                            className={inputClass}
                                            placeholder="e.g. 24 LPA"
                                            {...register('currentCTC')}
                                        />
                                        {errors.currentCTC && (
                                            <p className="text-xs font-bold text-red-500">
                                                {errors.currentCTC.message}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <FieldLabel>Expected CTC</FieldLabel>
                                        <input
                                            className={inputClass}
                                            placeholder="e.g. 30 LPA"
                                            {...register('expectedCTC')}
                                        />
                                        {errors.expectedCTC && (
                                            <p className="text-xs font-bold text-red-500">
                                                {errors.expectedCTC.message}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <FieldLabel>Notice period</FieldLabel>
                                        <input
                                            className={inputClass}
                                            placeholder="e.g. 30 Days"
                                            {...register('noticePeriod')}
                                        />
                                        {errors.noticePeriod && (
                                            <p className="text-xs font-bold text-red-500">
                                                {errors.noticePeriod.message}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <FieldLabel required={false}>Portfolio</FieldLabel>
                                        <input
                                            className={inputClass}
                                            placeholder="https://..."
                                            {...register('portfolio')}
                                        />
                                        {errors.portfolio && (
                                            <p className="text-xs font-bold text-red-500">
                                                {errors.portfolio.message}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="border border-primary/10 dark:border-white/10 rounded-xl px-5 py-5">
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

                    {currentStep === 1 && (
                        <div className="space-y-8">
                            <div className="bg-primary/5 dark:bg-white/5 p-6 rounded-xl border border-primary/5 space-y-6">
                                <div className="flex items-center gap-4 border-b border-primary/5 pb-6">
                                    <div className="size-16 rounded-full bg-primary text-white flex items-center justify-center font-bold text-2xl">
                                        {formData.firstName?.[0]}
                                        {formData.lastName?.[0]}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-primary dark:text-white">
                                            {formData.firstName} {formData.lastName}
                                        </h3>
                                        <p className="text-primary/60 font-medium">{formData.role}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="col-span-2">
                                        <p className="text-xs font-bold text-primary/40 uppercase">Job</p>
                                        <p className="font-bold">
                                            {requirements.find((r) => r.id === formData.requirementId)?.title ||
                                                '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-primary/40 uppercase">Email</p>
                                        <p className="font-bold">{formData.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-primary/40 uppercase">Phone</p>
                                        <p className="font-bold">{formData.phone}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-primary/40 uppercase">PAN</p>
                                        <p className="font-bold uppercase">{formData.pan}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-primary/40 uppercase">Location</p>
                                        <p className="font-bold">{formData.location}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-primary/40 uppercase">Source</p>
                                        <p className="font-bold">{formData.source}</p>
                                    </div>
                                    {formData.linkedin && (
                                        <div>
                                            <p className="text-xs font-bold text-primary/40 uppercase">LinkedIn</p>
                                            <p className="font-bold truncate">{formData.linkedin}</p>
                                        </div>
                                    )}
                                    {resumeFile && (
                                        <div className="col-span-2">
                                            <p className="text-xs font-bold text-primary/40 uppercase">Resume</p>
                                            <p className="font-bold truncate">{resumeFile.name}</p>
                                        </div>
                                    )}
                                    {(formData.primarySkills?.length ?? 0) > 0 && (
                                        <div className="col-span-2">
                                            <p className="text-xs font-bold text-primary/40 uppercase">
                                                Primary skills
                                            </p>
                                            <p className="font-bold text-sm">
                                                {formData.primarySkills?.join(', ')}
                                            </p>
                                        </div>
                                    )}
                                    {(formData.secondarySkills?.length ?? 0) > 0 && (
                                        <div className="col-span-2">
                                            <p className="text-xs font-bold text-primary/40 uppercase">
                                                Secondary skills
                                            </p>
                                            <p className="font-bold text-sm">
                                                {formData.secondarySkills?.join(', ')}
                                            </p>
                                        </div>
                                    )}
                                    <div className="col-span-2 pt-4 border-t border-primary/5 grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-xs text-primary/40">Experience</p>
                                            <p className="font-bold">{formData.totalExperience}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-primary/40">Company</p>
                                            <p className="font-bold">{formData.currentCompany}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-primary/40">Current CTC</p>
                                            <p className="font-bold">{formData.currentCTC}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-primary/40">Expected CTC</p>
                                            <p className="font-bold">{formData.expectedCTC}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-primary/40">Notice</p>
                                            <p className="font-bold">{formData.noticePeriod}</p>
                                        </div>
                                        {formData.portfolio && (
                                            <div>
                                                <p className="text-xs text-primary/40">Portfolio</p>
                                                <p className="font-bold truncate">{formData.portfolio}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-lg text-sm font-medium">
                                <span className="material-symbols-outlined">check_circle</span>
                                Ready to add as SOURCED with the details above.
                            </div>
                        </div>
                    )}

                    <div className="mt-8 pt-8 border-t border-primary/10 flex justify-between items-center">
                        <button
                            type="button"
                            onClick={() => setCurrentStep(0)}
                            disabled={currentStep === 0}
                            className={clsx(
                                'flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all',
                                currentStep === 0
                                    ? 'opacity-0 pointer-events-none'
                                    : 'text-primary/60 hover:bg-primary/5'
                            )}
                        >
                            <span className="material-symbols-outlined !text-lg">arrow_back</span>
                            Back
                        </button>

                        {currentStep === 0 ? (
                            <button
                                type="button"
                                onClick={nextStep}
                                disabled={emailIsDuplicate || emailCheckInProgress}
                                className="flex items-center gap-2 px-8 py-3 bg-primary dark:bg-white text-white dark:text-primary rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Review
                                <span className="material-symbols-outlined !text-lg">arrow_forward</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit(onSubmit)}
                                disabled={
                                    createMutation.isPending ||
                                    emailIsDuplicate ||
                                    emailCheckInProgress
                                }
                                className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {createMutation.isPending ? 'Creating…' : 'Create candidate'}
                                {!createMutation.isPending && (
                                    <span className="material-symbols-outlined !text-lg">check</span>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default NewCandidate
