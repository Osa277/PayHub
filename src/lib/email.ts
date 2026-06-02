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

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`

  if (!resend) {
    logger.warn('Resend not configured — logging verification link instead', {
      context: { email, verifyUrl },
    })
    return
  }

  await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: 'Verify your PayHub email',
    html: `
      <h2>Verify Your Email</h2>
      <p>Welcome to PayHub! Click the button below to verify your email address. This link expires in 24 hours.</p>
      <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#f97316;color:#fff;border-radius:8px;text-decoration:none;">Verify Email</a>
      <p style="margin-top:16px;color:#888;">If you didn't create a PayHub account, you can safely ignore this email.</p>
    `,
  })

  logger.info('Verification email sent', { context: { email } })
}

interface InvoiceEmailData {
  invoiceId: string
  recipientName?: string | null
  amount: string
  currency: string
  dueDate: string
  items: { description: string; quantity: number; unitPrice: number; total: number }[]
  senderName: string
}

export async function sendInvoiceEmail(recipientEmail: string, data: InvoiceEmailData) {
  const invoiceRef = data.invoiceId.slice(-8)
  const viewUrl = `${process.env.NEXTAUTH_URL}/invoices`

  const itemRows = data.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${item.description}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${item.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${data.currency} ${item.unitPrice.toFixed(2)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${data.currency} ${item.total.toFixed(2)}</td>
        </tr>`
    )
    .join('')

  if (!resend) {
    logger.warn('Resend not configured — logging invoice email instead', {
      context: { recipientEmail, invoiceRef },
    })
    return
  }

  await resend.emails.send({
    from: fromEmail,
    to: recipientEmail,
    subject: `Invoice #${invoiceRef} from ${data.senderName} — ${data.currency} ${data.amount}`,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <div style="background:#1e3a8a;padding:24px;border-radius:12px 12px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:20px;">PayHub Invoice</h1>
        </div>
        <div style="padding:24px;background:#fff;border:1px solid #e5e7eb;border-top:none;">
          <p style="margin:0 0 4px;">Hi${data.recipientName ? ` ${data.recipientName}` : ''},</p>
          <p style="margin:0 0 20px;color:#555;">${data.senderName} has sent you an invoice.</p>

          <div style="background:#f9fafb;padding:16px;border-radius:8px;margin-bottom:20px;">
            <table style="width:100%;font-size:14px;">
              <tr><td style="color:#888;">Invoice #</td><td style="text-align:right;font-weight:600;">${invoiceRef}</td></tr>
              <tr><td style="color:#888;">Due Date</td><td style="text-align:right;">${data.dueDate}</td></tr>
              <tr><td style="color:#888;">Total</td><td style="text-align:right;font-weight:700;font-size:18px;">${data.currency} ${data.amount}</td></tr>
            </table>
          </div>

          <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
            <thead>
              <tr style="background:#eff6ff;">
                <th style="padding:8px 12px;text-align:left;">Description</th>
                <th style="padding:8px 12px;text-align:right;">Qty</th>
                <th style="padding:8px 12px;text-align:right;">Price</th>
                <th style="padding:8px 12px;text-align:right;">Total</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>

          <a href="${viewUrl}" style="display:inline-block;padding:12px 24px;background:#f97316;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">View Invoice</a>
          <p style="margin-top:16px;color:#888;font-size:12px;">This invoice was sent via PayHub. If you have questions, contact ${data.senderName}.</p>
        </div>
      </div>
    `,
  })

  logger.info('Invoice email sent', { context: { recipientEmail, invoiceRef } })
}
