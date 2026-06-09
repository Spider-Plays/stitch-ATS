import 'dotenv/config'

const isProduction = process.env.NODE_ENV === 'production'

function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim()
  if (isProduction) {
    if (!secret || secret.length < 32) {
      throw new Error(
        'JWT_SECRET must be set to a strong random string (32+ characters) in production.'
      )
    }
    return secret
  }
  return secret || 'dev-secret'
}

export const env = {
  isProduction,
  port: Number(process.env.PORT) || 4000,
  jwtSecret: resolveJwtSecret(),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  resendApiKey: process.env.RESEND_API_KEY || '',
  emailFrom: process.env.EMAIL_FROM || 'Stitch ATS <onboarding@resend.dev>',
  appName: process.env.APP_NAME || 'Stitch ATS',
}
