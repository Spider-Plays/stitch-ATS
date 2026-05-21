import { Resend } from 'resend'
import { env } from '../config/env.js'

export type SendEmailResult =
  | { sent: true; id: string }
  | { sent: false; reason: 'not_configured' }
  | { sent: false; reason: 'error'; message: string }

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function sendHtmlEmail(params: {
  to: string
  subject: string
  html: string
}): Promise<SendEmailResult> {
  if (!env.resendApiKey) return { sent: false, reason: 'not_configured' }

  const resend = new Resend(env.resendApiKey)
  try {
    const { data, error } = await resend.emails.send({
      from: env.emailFrom,
      to: params.to,
      subject: params.subject,
      html: params.html,
    })
    if (error) return { sent: false, reason: 'error', message: error.message }
    return { sent: true, id: data?.id ?? 'unknown' }
  } catch (e) {
    return { sent: false, reason: 'error', message: e instanceof Error ? e.message : 'Failed to send email' }
  }
}

export async function sendInviteEmail(params: {
  to: string
  name: string
  role: string
  tempPassword: string
}): Promise<SendEmailResult> {
  const loginUrl = `${env.clientOrigin.replace(/\/$/, '')}/login`
  return sendHtmlEmail({
    to: params.to,
    subject: `You're invited to ${env.appName}`,
    html: `
      <div style="font-family: Inter, system-ui, sans-serif; max-width: 520px; margin: 0 auto; color: #1a2b3c;">
        <h1 style="font-size: 22px;">Welcome to ${env.appName}</h1>
        <p>Hi ${escapeHtml(params.name)},</p>
        <p>You've been invited as <strong>${escapeHtml(params.role)}</strong>.</p>
        <p><strong>Email:</strong> ${escapeHtml(params.to)}<br/>
        <strong>Temporary password:</strong> <code>${escapeHtml(params.tempPassword)}</code></p>
        <p><a href="${loginUrl}" style="display:inline-block;background:#1a2b3c;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Sign in</a></p>
        <p style="color:#a0aec0;font-size:12px;">Change your password after first login in Settings → Security.</p>
      </div>
    `,
  })
}

export async function sendAdminPasswordEmail(params: {
  to: string
  name: string
  password: string
  setByAdmin?: boolean
}): Promise<SendEmailResult> {
  const loginUrl = `${env.clientOrigin.replace(/\/$/, '')}/login`
  return sendHtmlEmail({
    to: params.to,
    subject: `Your ${env.appName} password was reset`,
    html: `
      <div style="font-family: Inter, system-ui, sans-serif; max-width: 520px; margin: 0 auto; color: #1a2b3c;">
        <h1 style="font-size: 22px;">Password updated</h1>
        <p>Hi ${escapeHtml(params.name)},</p>
        <p>An administrator ${params.setByAdmin ? 'reset' : 'updated'} your account password.</p>
        <p><strong>Email:</strong> ${escapeHtml(params.to)}<br/>
        <strong>New password:</strong> <code>${escapeHtml(params.password)}</code></p>
        <p><a href="${loginUrl}" style="display:inline-block;background:#1a2b3c;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Sign in</a></p>
        <p style="color:#a0aec0;font-size:12px;">Change your password after signing in under Settings → Security.</p>
      </div>
    `,
  })
}

export async function sendPasswordResetEmail(params: {
  to: string
  name: string
  resetUrl: string
}): Promise<SendEmailResult> {
  return sendHtmlEmail({
    to: params.to,
    subject: `Reset your ${env.appName} password`,
    html: `
      <div style="font-family: Inter, system-ui, sans-serif; max-width: 520px; margin: 0 auto;">
        <p>Hi ${escapeHtml(params.name)},</p>
        <p>Click below to reset your password (link expires in 1 hour):</p>
        <p><a href="${params.resetUrl}" style="display:inline-block;background:#1a2b3c;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;">Reset password</a></p>
      </div>
    `,
  })
}

export async function sendInterviewScheduledEmail(params: {
  to: string
  candidateName: string
  type: string
  scheduledAt: string
  meetingLink?: string
}): Promise<SendEmailResult> {
  return sendHtmlEmail({
    to: params.to,
    subject: `Interview scheduled — ${env.appName}`,
    html: interviewEmailBody({ ...params, headline: 'Interview scheduled' }),
  })
}

export async function sendInterviewUpdatedEmail(params: {
  to: string
  candidateName: string
  type: string
  scheduledAt: string
  meetingLink?: string
  rescheduled?: boolean
}): Promise<SendEmailResult> {
  return sendHtmlEmail({
    to: params.to,
    subject: params.rescheduled
      ? `Interview rescheduled — ${env.appName}`
      : `Interview updated — ${env.appName}`,
    html: interviewEmailBody({
      candidateName: params.candidateName,
      type: params.type,
      scheduledAt: params.scheduledAt,
      meetingLink: params.meetingLink,
      headline: params.rescheduled ? 'Interview rescheduled' : 'Interview details updated',
    }),
  })
}

function interviewEmailBody(params: {
  candidateName: string
  type: string
  scheduledAt: string
  meetingLink?: string
  headline: string
}): string {
  return `
      <div style="font-family: Inter, system-ui, sans-serif; max-width: 520px;">
        <p>Hi ${escapeHtml(params.candidateName)},</p>
        <p><strong>${escapeHtml(params.headline)}</strong></p>
        <p>Your <strong>${escapeHtml(params.type)}</strong> interview is on <strong>${escapeHtml(params.scheduledAt)}</strong>.</p>
        ${params.meetingLink ? `<p><a href="${escapeHtml(params.meetingLink)}">Join meeting</a></p>` : ''}
        <p>Sign in to your candidate portal for updates.</p>
      </div>
    `
}

export async function sendOfferSentEmail(params: {
  to: string
  candidateName: string
  baseSalary: number
}): Promise<SendEmailResult> {
  return sendHtmlEmail({
    to: params.to,
    subject: `Offer from ${env.appName}`,
    html: `
      <div style="font-family: Inter, system-ui, sans-serif; max-width: 520px;">
        <p>Hi ${escapeHtml(params.candidateName)},</p>
        <p>We're pleased to extend an offer with a base salary of <strong>${params.baseSalary.toLocaleString()}</strong>.</p>
        <p>Please sign in to your candidate portal for details.</p>
      </div>
    `,
  })
}
