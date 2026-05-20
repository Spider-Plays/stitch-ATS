import { Resend } from 'resend'
import { env } from '../config/env.js'

export type SendEmailResult =
  | { sent: true; id: string }
  | { sent: false; reason: 'not_configured' }
  | { sent: false; reason: 'error'; message: string }

export async function sendInviteEmail(params: {
  to: string
  name: string
  role: string
  tempPassword: string
}): Promise<SendEmailResult> {
  if (!env.resendApiKey) {
    return { sent: false, reason: 'not_configured' }
  }

  const loginUrl = `${env.clientOrigin.replace(/\/$/, '')}/login`
  const resend = new Resend(env.resendApiKey)

  try {
    const { data, error } = await resend.emails.send({
      from: env.emailFrom,
      to: params.to,
      subject: `You're invited to ${env.appName}`,
      html: `
        <div style="font-family: Inter, system-ui, sans-serif; max-width: 520px; margin: 0 auto; color: #1a2b3c;">
          <h1 style="font-size: 22px; margin-bottom: 8px;">Welcome to ${env.appName}</h1>
          <p style="color: #4a5568; line-height: 1.5;">Hi ${escapeHtml(params.name)},</p>
          <p style="color: #4a5568; line-height: 1.5;">
            You've been invited as <strong>${escapeHtml(params.role)}</strong>. Sign in with the credentials below:
          </p>
          <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #718096; font-size: 13px;">Email</td>
              <td style="padding: 8px 0; font-weight: 600;">${escapeHtml(params.to)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096; font-size: 13px;">Temporary password</td>
              <td style="padding: 8px 0; font-family: monospace; font-weight: 600;">${escapeHtml(params.tempPassword)}</td>
            </tr>
          </table>
          <p style="margin: 24px 0;">
            <a href="${loginUrl}" style="display: inline-block; background: #1a2b3c; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Sign in to ${env.appName}
            </a>
          </p>
          <p style="color: #a0aec0; font-size: 12px;">Change your password after your first login when that feature is available.</p>
        </div>
      `,
    })

    if (error) {
      return { sent: false, reason: 'error', message: error.message }
    }
    return { sent: true, id: data?.id ?? 'unknown' }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to send email'
    return { sent: false, reason: 'error', message }
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
