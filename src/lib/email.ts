import { Resend } from 'resend'
import { logger } from '@/lib/logger'

const resendApiKey = process.env.RESEND_API_KEY
const resend = resendApiKey ? new Resend(resendApiKey) : null
const fromEmail = process.env.EMAIL_FROM || 'PayHub <noreply@payhub.com>'

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`

  if (!resend) {
    logger.warn('Resend not configured — logging reset link instead', {
      context: { email, resetUrl },
    })
    return
  }

  await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: 'Reset your PayHub password',
    html: `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#f97316;color:#fff;border-radius:8px;text-decoration:none;">Reset Password</a>
      <p style="margin-top:16px;color:#888;">If you didn't request this, you can safely ignore this email.</p>
    `,
  })

  logger.info('Password reset email sent', { context: { email } })
}
