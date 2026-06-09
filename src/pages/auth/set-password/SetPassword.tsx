import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle, CheckCircle2, Lock, XCircle } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '@/hooks/useAuth'
import { authApi } from '@/services/http/auth'
import { ApiError } from '@/lib/apiClient'
import { postAuthPath } from '@/lib/loginRedirect'
import { LoginHero, LoginHeroMobile } from '@/components/auth/LoginHero'
import './set-password.css'

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your temporary password'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: 'New password must be different from your temporary password',
    path: ['newPassword'],
  })

type FormValues = z.infer<typeof schema>

const SetPassword = () => {
  const navigate = useNavigate()
  const { user, allowedPages, loading, refreshUser } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const newPassword = form.watch('newPassword')
  const confirmPassword = form.watch('confirmPassword')
  const confirmFilled = confirmPassword.length > 0
  const passwordsMatch = newPassword === confirmPassword

  React.useEffect(() => {
    if (loading) return
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    if (!user.mustChangePassword) {
      navigate(postAuthPath(user, allowedPages), { replace: true })
    }
  }, [user, allowedPages, loading, navigate])

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true)
    setError(null)
    try {
      const session = await authApi.changePassword(values.currentPassword, values.newPassword)
      await refreshUser()
      navigate(postAuthPath(session.user, session.allowedPages ?? []), { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update password')
    } finally {
      setSubmitting(false)
    }
  })

  if (loading || !user?.mustChangePassword) {
    return null
  }

  return (
    <div className="min-h-screen flex set-password-page-bg">
      <LoginHero />
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-10 lg:p-12">
        <div className="w-full max-w-[26rem] space-y-6 animate-scale-in">
          <LoginHeroMobile />
          <div className="set-password-panel login-panel space-y-8">
            <div className="text-center lg:text-left space-y-3">
              <span className="badge-eyebrow mx-auto lg:mx-0 w-fit">One-time setup</span>
              <h2 className="text-page-title">Set your password</h2>
              <p className="text-page-desc mx-auto lg:mx-0">
                Your account was created with a temporary password. Choose a new password to
                continue — you only need to do this once.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label className="set-password-label">Temporary password</label>
                <div className="relative">
                  <Lock size={18} className="set-password-field-icon" />
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="app-input app-input-leading-icon w-full !pr-12 focus:!pr-12 !py-3.5 focus:border-primary dark:focus:border-ring focus:ring-0"
                    {...form.register('currentPassword')}
                  />
                  <button
                    type="button"
                    className="set-password-toggle"
                    onClick={() => setShowCurrent((v) => !v)}
                  >
                    {showCurrent ? 'Hide' : 'Show'}
                  </button>
                </div>
                {form.formState.errors.currentPassword && (
                  <p className="text-xs text-red-600 mt-1">
                    {form.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label className="set-password-label">New password</label>
                <div className="relative">
                  <Lock size={18} className="set-password-field-icon" />
                  <input
                    type={showNew ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="app-input app-input-leading-icon w-full !pr-12 focus:!pr-12 !py-3.5 focus:border-primary dark:focus:border-ring focus:ring-0"
                    {...form.register('newPassword')}
                  />
                  <button
                    type="button"
                    className="set-password-toggle"
                    onClick={() => setShowNew((v) => !v)}
                  >
                    {showNew ? 'Hide' : 'Show'}
                  </button>
                </div>
                {form.formState.errors.newPassword && (
                  <p className="text-xs text-red-600 mt-1">
                    {form.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label className="set-password-label">Confirm new password</label>
                <div className="relative">
                  <Lock size={18} className="set-password-field-icon" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={clsx(
                      'app-input app-input-leading-icon w-full !pr-12 focus:!pr-12 !py-3.5 focus:ring-0',
                      confirmFilled &&
                        (passwordsMatch
                          ? 'set-password-input--match focus:!border-green-600'
                          : 'set-password-input--mismatch focus:!border-red-600'),
                      !confirmFilled && 'focus:border-primary dark:focus:border-ring'
                    )}
                    {...form.register('confirmPassword')}
                  />
                  <button
                    type="button"
                    className="set-password-toggle"
                    onClick={() => setShowConfirm((v) => !v)}
                  >
                    {showConfirm ? 'Hide' : 'Show'}
                  </button>
                </div>
                {confirmFilled && (
                  <p
                    className={`set-password-match-hint${
                      passwordsMatch ? ' set-password-match-hint--match' : ' set-password-match-hint--mismatch'
                    }`}
                  >
                    {passwordsMatch ? (
                      <>
                        <CheckCircle2 size={14} />
                        Passwords match
                      </>
                    ) : (
                      <>
                        <XCircle size={14} />
                        Passwords do not match
                      </>
                    )}
                  </p>
                )}
                {form.formState.errors.confirmPassword && !confirmFilled && (
                  <p className="text-xs text-red-600 mt-1">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? 'Saving…' : 'Save and continue'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SetPassword
