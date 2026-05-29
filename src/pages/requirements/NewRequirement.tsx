import React, { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import clsx from 'clsx'
import { useAuth } from '../../hooks/useAuth'
import { SkillSelectSection } from '../../components/skills/SkillSelectSection'
import { SearchableSelect } from '../../components/ui/SearchableSelect'

const schema = z.object({
    jobCode: z.string().max(32).optional(),
    client: z.string().max(120).optional(),
    title: z.string().min(3, "Title must be at least 3 characters"),
    department: z.string().min(1, "Department is required"),
    hiringManager: z.string().min(1, "Hiring Manager is required"),
    openings: z.number().min(1, "At least 1 opening required"),
    primarySkills: z.array(z.string()).min(1, 'Select at least one primary skill'),
    secondarySkills: z.array(z.string()).default([]),
    jobDescription: z.string().min(20, "Job description must be at least 20 characters"),
    priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
    location: z.string().optional()
})

type RequirementFormValues = z.infer<typeof schema>

const STEPS = [
    { label: 'Role Details', icon: 'work' },
    { label: 'Skills & JD', icon: 'psychology' },
    { label: 'Review', icon: 'check_circle' }
]

const NewRequirement = () => {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { user } = useAuth()
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
        () =>
            departmentCatalog.map((d) => ({
                value: d.name,
                label: d.name,
            })),
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

    const defaultHiringManager =
        user?.role === 'HIRING_MANAGER' && user.name ? user.name : ''

    const { register, handleSubmit, control, formState: { errors }, trigger, watch } = useForm<RequirementFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            openings: 1,
            priority: 'MEDIUM',
            primarySkills: [],
            secondarySkills: [],
            hiringManager: defaultHiringManager,
        }
    })

    const formValues = watch()

    const createMutation = useMutation({
        mutationFn: (data: RequirementFormValues) => api.requirements.create({
            ...data,
            description: data.jobDescription.slice(0, 2000),
            status: 'PENDING_APPROVAL',
            recruiters: [],
            createdBy: user?.uid,
            createdByRole: user?.role
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requirements'] })
            navigate('/requirements')
        }
    })

    const onSubmit = (data: RequirementFormValues) => {
        createMutation.mutate(data)
    }

    const nextStep = async () => {
        let isValid = false
        if (currentStep === 0) {
            isValid = await trigger(['title', 'department', 'hiringManager', 'openings', 'priority'])
        } else if (currentStep === 1) {
            isValid = await trigger(['primarySkills', 'secondarySkills', 'jobDescription'])
        }

        if (isValid) setCurrentStep(prev => prev + 1)
    }

    const prevStep = () => setCurrentStep(prev => prev - 1)

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/requirements" className="p-2 hover:bg-primary/5 dark:hover:bg-white/5 rounded-full text-primary/60 dark:text-white/40 hover:text-primary dark:hover:text-white transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-primary dark:text-white tracking-tight">Post New Job</h1>
                        <p className="text-sm font-medium text-primary/60 dark:text-white/60">Create a new requirement to start hiring.</p>
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
                                {index < currentStep ? <span className="material-symbols-outlined !text-sm">check</span> : index + 1}
                            </div>
                            <span className={clsx(
                                "text-xs font-bold uppercase tracking-wider",
                                index <= currentStep ? "text-primary dark:text-white" : "text-primary/40 dark:text-white/40"
                            )}>{step.label}</span>
                        </div>
                    ))}
                </div>

                <div className="p-8">
                    {/* Step 1: Role Details */}
                    {currentStep === 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 space-y-0">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider">Req ID (job code)</label>
                                <input
                                    className="w-full px-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-mono font-semibold text-primary dark:text-white placeholder:text-primary/20 uppercase"
                                    placeholder="Auto-generated if empty"
                                    {...register('jobCode')}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider">Client</label>
                                <input
                                    className="w-full px-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-medium text-primary dark:text-white placeholder:text-primary/20"
                                    placeholder="e.g. Acme Corp"
                                    {...register('client')}
                                />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider">Job Title</label>
                                <input
                                    className="w-full px-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-semibold text-primary dark:text-white placeholder:text-primary/20"
                                    placeholder="e.g. Senior Product Designer"
                                    {...register('title')}
                                />
                                {errors.title && <p className="text-xs font-bold text-red-500">{errors.title.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider">Department</label>
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
                                                    ? 'No departments yet — ask an admin to add them under Administration → Departments.'
                                                    : 'No matching department'
                                            }
                                        />
                                    )}
                                />
                                {errors.department && <p className="text-xs font-bold text-red-500">{errors.department.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider">
                                    Hiring Manager <span className="text-red-500">*</span>
                                </label>
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
                                                    : 'No hiring managers — invite one in Admin'
                                            }
                                            searchPlaceholder="Search managers…"
                                            emptyLabel="No hiring managers found"
                                            allowClear={false}
                                            icon={
                                                <span className="material-symbols-outlined !text-lg">
                                                    person
                                                </span>
                                            }
                                        />
                                    )}
                                />
                                {errors.hiringManager && (
                                    <p className="text-xs font-bold text-red-500">{errors.hiringManager.message}</p>
                                )}
                                {hiringManagerOptions.length === 0 && (
                                    <p className="text-xs text-primary/50 dark:text-white/50">
                                        Add users with the Hiring Manager role in Admin → User Management.
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider">Openings</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-medium text-primary dark:text-white"
                                    {...register('openings', { valueAsNumber: true })}
                                />
                                {errors.openings && <p className="text-xs font-bold text-red-500">{errors.openings.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider">Priority</label>
                                <select
                                    className="w-full px-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-medium text-primary dark:text-white"
                                    {...register('priority')}
                                >
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                    <option value="CRITICAL">Critical</option>
                                    <option value="LOW">Low</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Skills & JD */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
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
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider">
                                    Job description (JD) <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    className="w-full h-56 p-4 rounded-xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] focus:border-primary focus:ring-0 font-medium text-primary dark:text-white placeholder:text-primary/20 resize-none leading-relaxed"
                                    placeholder="Responsibilities, qualifications, and role expectations..."
                                    {...register('jobDescription')}
                                />
                                {errors.jobDescription && <p className="text-xs font-bold text-red-500">{errors.jobDescription.message}</p>}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Review */}
                    {currentStep === 2 && (
                        <div className="space-y-8">
                            <div className="bg-primary/5 dark:bg-white/5 p-6 rounded-xl border border-primary/5 dark:border-white/5 space-y-4">
                                <div>
                                    <p className="text-xs font-bold text-primary/40 dark:text-white/40 uppercase tracking-wider">Job Title</p>
                                    <p className="text-lg font-black text-primary dark:text-white">{formValues.title}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-bold text-primary/40 dark:text-white/40 uppercase tracking-wider">Department</p>
                                        <p className="font-bold text-primary dark:text-white">{formValues.department}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-primary/40 dark:text-white/40 uppercase tracking-wider">Hiring Manager</p>
                                        <p className="font-bold text-primary dark:text-white">{formValues.hiringManager}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-primary/40 dark:text-white/40 uppercase tracking-wider">Openings</p>
                                        <p className="font-bold text-primary dark:text-white">{formValues.openings}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-primary/40 dark:text-white/40 uppercase tracking-wider">Priority</p>
                                        <p className="font-bold text-primary dark:text-white">{formValues.priority}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-primary/40 uppercase tracking-wider">Primary skills</p>
                                    <p className="font-bold text-primary dark:text-white">
                                        {formValues.primarySkills?.join(', ') || '—'}
                                    </p>
                                </div>
                                {(formValues.secondarySkills?.length ?? 0) > 0 && (
                                    <div>
                                        <p className="text-xs font-bold text-primary/40 uppercase tracking-wider">Secondary skills</p>
                                        <p className="font-bold text-primary dark:text-white">
                                            {formValues.secondarySkills?.join(', ')}
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-lg text-sm font-medium">
                                <span className="material-symbols-outlined">info</span>
                                This requirement will be saved as PENDING APPROVAL and requires HR approval before going LIVE.
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
                                className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 active:scale-[0.98] transition-all shadow-lg shadow-green-600/20"
                            >
                                {createMutation.isPending ? 'Creating...' : 'Submit Requirement'}
                                {!createMutation.isPending && <span className="material-symbols-outlined !text-lg">check</span>}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default NewRequirement
