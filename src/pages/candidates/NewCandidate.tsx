import React, { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import clsx from 'clsx'
import { useAuth } from '../../hooks/useAuth'
import { useToastStore } from '../../store/toastStore'
import { ApiError } from '../../lib/apiClient'
import { SearchableSelect } from '../../components/ui/SearchableSelect'

const schema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email format"),
    phone: z.string().min(1, "Phone number is required"),
    totalExperience: z.string().min(1, "Total experience is required"),
    currentCompany: z.string().min(1, "Current company is required"),
    currentCTC: z.string().min(1, "Current CTC is required"),
    expectedCTC: z.string().min(1, "Expected CTC is required"),
    noticePeriod: z.string().min(1, "Notice period is required"),
    linkedin: z.string().url("Invalid LinkedIn URL").optional().or(z.literal('')),
    role: z.string().min(1, "Role is required"),
    source: z.string().min(1, "Source is required"),
    location: z.string().optional(),
    portfolio: z.string().url("Invalid URL").optional().or(z.literal('')),
    requirementId: z.string().optional()
})

type CandidateFormValues = z.infer<typeof schema>

const STEPS = [
    { label: 'Basic Info', icon: 'person' },
    { label: 'Professional', icon: 'work' },
    { label: 'Review', icon: 'check_circle' }
]

const NewCandidate = () => {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [currentStep, setCurrentStep] = useState(0)
    const [resumeFile, setResumeFile] = useState<File | null>(null)
    const { addToast } = useToastStore()

    const { data: requirements = [] } = useQuery({
        queryKey: ['requirements'],
        queryFn: api.requirements.list
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

    const { register, handleSubmit, control, formState: { errors }, trigger, watch, setValue } = useForm<CandidateFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            source: 'Recruiter Added'
        }
    })

    const formData = watch()

    // Auto-fill role when requirement is selected
    React.useEffect(() => {
        if (formData.requirementId) {
            const req = requirements.find(r => r.id === formData.requirementId)
            if (req) setValue('role', req.title)
        }
    }, [formData.requirementId, requirements, setValue])

    const createMutation = useMutation({
        mutationFn: async (data: CandidateFormValues) => {
            // 1. Create candidate (Firestore)
            const selectedReq = requirements.find(r => r.id === data.requirementId);
            const newCandidate = await api.candidates.create({
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
                location: data.location,
                linkedIn: data.linkedin,
                portfolio: data.portfolio,
                totalExperience: data.totalExperience,
                currentCompany: data.currentCompany,
                currentCTC: data.currentCTC,
                expectedCTC: data.expectedCTC,
                noticePeriod: data.noticePeriod,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            })

            return newCandidate
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
            console.error("Creation failed", error)
            addToast('Failed to create candidate', 'error')
        }
    })

    const onSubmit = (data: CandidateFormValues) => {
        if (createMutation.isPending) return
        createMutation.mutate(data)
    }

    const nextStep = async () => {
        let isValid = false
        if (currentStep === 0) {
            isValid = await trigger(['firstName', 'lastName', 'email', 'phone'])
        } else if (currentStep === 1) {
            isValid = await trigger(['totalExperience', 'currentCompany', 'currentCTC', 'expectedCTC', 'noticePeriod', 'role', 'source', 'linkedin', 'portfolio', 'requirementId'])
        }

        if (isValid) setCurrentStep(prev => prev + 1)
    }

    const prevStep = () => setCurrentStep(prev => prev - 1)

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/candidates" className="p-2 hover:bg-primary/5 dark:hover:bg-white/5 rounded-full text-primary/60 dark:text-white/40 hover:text-primary dark:hover:text-white transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-primary dark:text-white tracking-tight">Add Candidate</h1>
                        <p className="text-sm font-medium text-primary/60 dark:text-white/60">Add a new candidate to your talent pipeline.</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-white/5 border border-primary/10 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
                {/* Stepper */}
                <div className="flex border-b border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02]">
                    {STEPS.map((step, index) => (
                        <div
                            key={index}
                            className={clsx(
                                "flex-1 px-6 py-4 flex items-center justify-center gap-2 border-b-2 transition-all",
                                index <= currentStep ? "border-primary dark:border-white" : "border-transparent"
                            )}
                        >
                            <div className={clsx(
                                "size-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                                index < currentStep ? "bg-green-500 text-white" :
                                    index === currentStep ? "bg-primary dark:bg-white text-white dark:text-primary" :
                                        "bg-primary/10 dark:bg-white/10 text-primary/40 dark:text-white/40"
                            )}>
                                {index < currentStep ? <span className="material-symbols-outlined !text-sm">check</span> : <span className="material-symbols-outlined !text-sm">{step.icon}</span>}
                            </div>
                            <span className={clsx(
                                "text-xs font-bold uppercase tracking-wider hidden sm:block",
                                index <= currentStep ? "text-primary dark:text-white" : "text-primary/40 dark:text-white/40"
                            )}>{step.label}</span>
                        </div>
                    ))}
                </div>

                <div className="p-8">
                    {/* Step 1: Basic Info */}
                    {currentStep === 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider">First Name</label>
                                <input
                                    className="w-full px-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-semibold text-primary dark:text-white placeholder:text-primary/20"
                                    placeholder="e.g. Michael"
                                    {...register('firstName')}
                                />
                                {errors.firstName && <p className="text-xs font-bold text-red-500">{errors.firstName.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider">Last Name</label>
                                <input
                                    className="w-full px-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-semibold text-primary dark:text-white placeholder:text-primary/20"
                                    placeholder="e.g. Scott"
                                    {...register('lastName')}
                                />
                                {errors.lastName && <p className="text-xs font-bold text-red-500">{errors.lastName.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider">Email Address</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/30">mail</span>
                                    <input
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-medium text-primary dark:text-white placeholder:text-primary/20"
                                        placeholder="michael@example.com"
                                        {...register('email')}
                                    />
                                </div>
                                {errors.email && <p className="text-xs font-bold text-red-500">{errors.email.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider">Phone Number</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/30">call</span>
                                    <input
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-medium text-primary dark:text-white placeholder:text-primary/20"
                                        placeholder="+1 (555) 000-0000"
                                        {...register('phone')}
                                    />
                                </div>
                                {errors.phone && <p className="text-xs font-bold text-red-500">{errors.phone.message}</p>}
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider">Location (Optional)</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/30">location_on</span>
                                    <input
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-medium text-primary dark:text-white placeholder:text-primary/20"
                                        placeholder="e.g. San Francisco, CA"
                                        {...register('location')}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Professional Info */}
                    {currentStep === 1 && (
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider">Job Requirement (Optional)</label>
                                <Controller
                                    control={control}
                                    name="requirementId"
                                    render={({ field }) => (
                                        <SearchableSelect
                                            value={field.value ?? ''}
                                            onChange={field.onChange}
                                            options={requirementOptions}
                                            placeholder="General application / unassigned"
                                            searchPlaceholder="Search job requirements..."
                                            clearLabel="General application / unassigned"
                                            icon={
                                                <span className="material-symbols-outlined !text-lg">assignment</span>
                                            }
                                        />
                                    )}
                                />
                                <p className="text-xs text-primary/40 dark:text-white/40">Select a specific job requirement to map this candidate to.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider">Resume (Optional)</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/30">upload_file</span>
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-medium text-primary dark:text-white file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-bold file:text-xs"
                                        onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                                    />
                                </div>
                                <p className="text-xs text-primary/40 dark:text-white/40">PDF, DOC, or DOCX up to 5 MB.</p>
                                {resumeFile && (
                                    <p className="text-xs font-bold text-primary dark:text-white">{resumeFile.name}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider">Role / Job Title</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/30">work</span>
                                    <input
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-medium text-primary dark:text-white placeholder:text-primary/20"
                                        placeholder="e.g. Senior Frontend Engineer"
                                        {...register('role')}
                                    />
                                </div>
                                {errors.role && <p className="text-xs font-bold text-red-500">{errors.role.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider">Source</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/30">link</span>
                                    <select
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-medium text-primary dark:text-white"
                                        {...register('source')}
                                    >
                                        <option value="Direct Application">Direct Application</option>
                                        <option value="LinkedIn">LinkedIn</option>
                                        <option value="Referral">Referral</option>
                                        <option value="Agency">Agency</option>
                                        <option value="Recruiter Added">Recruiter Added</option>
                                    </select>
                                </div>
                                {errors.source && <p className="text-xs font-bold text-red-500">{errors.source.message}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider">Total Experience (Years/Months)</label>
                                    <input
                                        className="w-full px-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-medium text-primary dark:text-white placeholder:text-primary/20"
                                        placeholder="e.g. 5 Years"
                                        {...register('totalExperience')}
                                    />
                                    {errors.totalExperience && <p className="text-xs font-bold text-red-500">{errors.totalExperience.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider">Current Company</label>
                                    <input
                                        className="w-full px-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-medium text-primary dark:text-white placeholder:text-primary/20"
                                        placeholder="e.g. Google"
                                        {...register('currentCompany')}
                                    />
                                    {errors.currentCompany && <p className="text-xs font-bold text-red-500">{errors.currentCompany.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider">Current CTC</label>
                                    <input
                                        className="w-full px-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-medium text-primary dark:text-white placeholder:text-primary/20"
                                        placeholder="e.g. 24 LPA"
                                        {...register('currentCTC')}
                                    />
                                    {errors.currentCTC && <p className="text-xs font-bold text-red-500">{errors.currentCTC.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider">Expected CTC</label>
                                    <input
                                        className="w-full px-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-medium text-primary dark:text-white placeholder:text-primary/20"
                                        placeholder="e.g. 30 LPA"
                                        {...register('expectedCTC')}
                                    />
                                    {errors.expectedCTC && <p className="text-xs font-bold text-red-500">{errors.expectedCTC.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider">Notice Period</label>
                                    <input
                                        className="w-full px-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-medium text-primary dark:text-white placeholder:text-primary/20"
                                        placeholder="e.g. 30 Days"
                                        {...register('noticePeriod')}
                                    />
                                    {errors.noticePeriod && <p className="text-xs font-bold text-red-500">{errors.noticePeriod.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider">LinkedIn URL (Optional)</label>
                                    <input
                                        className="w-full px-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-medium text-primary dark:text-white placeholder:text-primary/20"
                                        placeholder="https://linkedin.com/in/..."
                                        {...register('linkedin')}
                                    />
                                    {errors.linkedin && <p className="text-xs font-bold text-red-500">{errors.linkedin.message}</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Review */}
                    {currentStep === 2 && (
                        <div className="space-y-8">
                            <div className="bg-primary/5 dark:bg-white/5 p-6 rounded-xl border border-primary/5 dark:border-white/5 space-y-6">
                                <div className="flex items-center gap-4 border-b border-primary/5 dark:border-white/5 pb-6">
                                    <div className="size-16 rounded-full bg-primary text-white flex items-center justify-center font-bold text-2xl">
                                        {formData.firstName?.[0]}{formData.lastName?.[0]}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-primary dark:text-white">{formData.firstName} {formData.lastName}</h3>
                                        <p className="text-primary/60 dark:text-white/60 font-medium">{formData.role}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-bold text-primary/40 dark:text-white/40 uppercase tracking-wider">Email</p>
                                        <p className="font-bold text-primary dark:text-white">{formData.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-primary/40 dark:text-white/40 uppercase tracking-wider">Source</p>
                                        <p className="font-bold text-primary dark:text-white">{formData.source}</p>
                                    </div>
                                    {formData.phone && (
                                        <div>
                                            <p className="text-xs font-bold text-primary/40 dark:text-white/40 uppercase tracking-wider">Phone</p>
                                            <p className="font-bold text-primary dark:text-white">{formData.phone}</p>
                                        </div>
                                    )}
                                    {formData.requirementId && (
                                        <div className="col-span-2">
                                            <p className="text-xs font-bold text-primary/40 dark:text-white/40 uppercase tracking-wider">Mapped Requirement</p>
                                            <p className="font-bold text-primary dark:text-white">
                                                {requirements.find(r => r.id === formData.requirementId)?.title || 'Unknown'}
                                            </p>
                                        </div>
                                    )}
                                    {resumeFile && (
                                        <div className="col-span-2">
                                            <p className="text-xs font-bold text-primary/40 dark:text-white/40 uppercase tracking-wider">Resume</p>
                                            <p className="font-bold text-primary dark:text-white truncate">
                                                {resumeFile.name}
                                            </p>
                                        </div>
                                    )}
                                    <div className="col-span-2 pt-4 border-t border-primary/5 dark:border-white/5 space-y-4">
                                        <h4 className="text-xs font-black text-primary/30 dark:text-white/30 uppercase tracking-[0.2em]">Professional Summary</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs font-bold text-primary/40 dark:text-white/40 uppercase tracking-wider">Experience</p>
                                                <p className="font-bold text-primary dark:text-white">{formData.totalExperience}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-primary/40 dark:text-white/40 uppercase tracking-wider">Current Company</p>
                                                <p className="font-bold text-primary dark:text-white">{formData.currentCompany}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-primary/40 dark:text-white/40 uppercase tracking-wider">Current CTC</p>
                                                <p className="font-bold text-primary dark:text-white">{formData.currentCTC}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-primary/40 dark:text-white/40 uppercase tracking-wider">Expected CTC</p>
                                                <p className="font-bold text-primary dark:text-white">{formData.expectedCTC}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-primary/40 dark:text-white/40 uppercase tracking-wider">Notice Period</p>
                                                <p className="font-bold text-primary dark:text-white">{formData.noticePeriod}</p>
                                            </div>
                                            {formData.linkedin && (
                                                <div>
                                                    <p className="text-xs font-bold text-primary/40 dark:text-white/40 uppercase tracking-wider">LinkedIn</p>
                                                    <p className="font-bold text-primary dark:text-white truncate">{formData.linkedin}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-lg text-sm font-medium">
                                <span className="material-symbols-outlined">check_circle</span>
                                Validated and ready to add to SOURCED stage.
                            </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="mt-8 pt-8 border-t border-primary/10 dark:border-white/10 flex justify-between items-center">
                        <button
                            type="button"
                            onClick={prevStep}
                            disabled={currentStep === 0}
                            className={clsx(
                                "flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all",
                                currentStep === 0
                                    ? "opacity-0 pointer-events-none"
                                    : "text-primary/60 dark:text-white/60 hover:bg-primary/5 dark:hover:bg-white/5"
                            )}
                        >
                            <span className="material-symbols-outlined !text-lg">arrow_back</span>
                            Back
                        </button>

                        {currentStep < STEPS.length - 1 ? (
                            <button
                                type="button"
                                onClick={nextStep}
                                className="flex items-center gap-2 px-8 py-3 bg-primary dark:bg-white text-white dark:text-primary rounded-xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 dark:shadow-none"
                            >
                                Continue
                                <span className="material-symbols-outlined !text-lg">arrow_forward</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit(onSubmit)}
                                disabled={createMutation.isPending}
                                className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 active:scale-[0.98] transition-all shadow-lg shadow-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {createMutation.isPending ? 'Creating Candidate...' : 'Create Candidate'}
                                {!createMutation.isPending && <span className="material-symbols-outlined !text-lg">check</span>}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default NewCandidate
