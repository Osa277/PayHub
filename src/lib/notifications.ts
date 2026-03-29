import { Resend } from 'resend'
import { logger } from '@/lib/logger'

const resendApiKey = process.env.RESEND_API_KEY
const resend = resendApiKey ? new Resend(resendApiKey) : null
const fromEmail = process.env.EMAIL_FROM || 'PayHub <noreply@payhub.com>'
const twilioSid = process.env.TWILIO_ACCOUNT_SID
const twilioAuth = process.env.TWILIO_AUTH_TOKEN
const twilioFrom = process.env.TWILIO_PHONE_NUMBER

// ─── Email Notifications ───

async function sendEmail(to: string, subject: string, html: string) {
  if (!resend) {
    logger.warn('Resend not configured — email not sent', { context: { to, subject } })
    return
  }

  await resend.emails.send({ from: fromEmail, to, subject, html })
  logger.info('Email sent', { context: { to, subject } })
}

// ─── SMS Notifications ───

async function sendSMS(to: string, body: string) {
  if (!twilioSid || !twilioAuth || !twilioFrom) {
    logger.warn('Twilio not configured — SMS not sent', { context: { to } })
    return
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: twilioFrom, Body: body }),
  })

  if (!res.ok) {
    const err = await res.text()
    logger.error('SMS send failed', { context: { to, error: err } })
    return
  }

  logger.info('SMS sent', { context: { to } })
}

// ─── Notification Templates ───

export async function notifyPaymentReceived(
  email: string | null,
  phone: string | null,
  data: { amount: number; currency: string; crypto: string; txnId: string }
) {
  const msg = `PayHub: Payment of $${data.amount} ${data.currency} (${data.crypto}) received. Txn: ${data.txnId.slice(0, 12)}...`

  if (email) {
    await sendEmail(email, 'Payment Received - PayHub', `
      <div style="font-family:sans-serif;max-width:500px;margin:auto;">
        <h2 style="color:#f97316;">Payment Received ✓</h2>
        <p>Your crypto payment has been confirmed.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px 0;color:#666;">Amount</td><td style="padding:8px 0;font-weight:bold;">$${data.amount} ${data.currency}</td></tr>
          <tr><td style="padding:8px 0;color:#666;">Crypto</td><td style="padding:8px 0;font-weight:bold;">${data.crypto.toUpperCase()}</td></tr>
          <tr><td style="padding:8px 0;color:#666;">Transaction ID</td><td style="padding:8px 0;font-family:monospace;font-size:12px;">${data.txnId}</td></tr>
        </table>
        <p style="color:#888;font-size:12px;">This is an automated notification from PayHub.</p>
      </div>
    `)
  }

  if (phone) await sendSMS(phone, msg)
}

export async function notifyPaymentSent(
  email: string | null,
  phone: string | null,
  data: { amount: number; currency: string; recipient: string; txnId: string }
) {
  const msg = `PayHub: You sent $${data.amount} ${data.currency} to ${data.recipient}. Txn: ${data.txnId.slice(0, 12)}...`

  if (email) {
    await sendEmail(email, 'Payment Sent - PayHub', `
      <div style="font-family:sans-serif;max-width:500px;margin:auto;">
        <h2 style="color:#f97316;">Payment Sent ✓</h2>
        <p>Your payment has been processed successfully.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px 0;color:#666;">Amount</td><td style="padding:8px 0;font-weight:bold;">$${data.amount} ${data.currency}</td></tr>
          <tr><td style="padding:8px 0;color:#666;">Recipient</td><td style="padding:8px 0;font-weight:bold;">${data.recipient}</td></tr>
          <tr><td style="padding:8px 0;color:#666;">Transaction ID</td><td style="padding:8px 0;font-family:monospace;font-size:12px;">${data.txnId}</td></tr>
        </table>
        <p style="color:#888;font-size:12px;">This is an automated notification from PayHub.</p>
      </div>
    `)
  }

  if (phone) await sendSMS(phone, msg)
}

export async function notifyWalletTopup(
  email: string | null,
  phone: string | null,
  data: { amount: number; currency: string; newBalance: number }
) {
  const msg = `PayHub: Wallet topped up by $${data.amount} ${data.currency}. New balance: $${data.newBalance}`

  if (email) {
    await sendEmail(email, 'Wallet Top-Up - PayHub', `
      <div style="font-family:sans-serif;max-width:500px;margin:auto;">
        <h2 style="color:#f97316;">Wallet Top-Up ✓</h2>
        <p>Your wallet has been credited.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px 0;color:#666;">Top-Up Amount</td><td style="padding:8px 0;font-weight:bold;">$${data.amount} ${data.currency}</td></tr>
          <tr><td style="padding:8px 0;color:#666;">New Balance</td><td style="padding:8px 0;font-weight:bold;color:#16a34a;">$${data.newBalance}</td></tr>
        </table>
        <p style="color:#888;font-size:12px;">This is an automated notification from PayHub.</p>
      </div>
    `)
  }

  if (phone) await sendSMS(phone, msg)
}

export async function notifyTransferReceived(
  email: string | null,
  phone: string | null,
  data: { amount: number; currency: string; senderName: string }
) {
  const msg = `PayHub: You received $${data.amount} ${data.currency} from ${data.senderName}.`

  if (email) {
    await sendEmail(email, 'Money Received - PayHub', `
      <div style="font-family:sans-serif;max-width:500px;margin:auto;">
        <h2 style="color:#16a34a;">Money Received 💰</h2>
        <p>You&apos;ve received a transfer!</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px 0;color:#666;">Amount</td><td style="padding:8px 0;font-weight:bold;color:#16a34a;">$${data.amount} ${data.currency}</td></tr>
          <tr><td style="padding:8px 0;color:#666;">From</td><td style="padding:8px 0;font-weight:bold;">${data.senderName}</td></tr>
        </table>
        <p style="color:#888;font-size:12px;">This is an automated notification from PayHub.</p>
      </div>
    `)
  }

  if (phone) await sendSMS(phone, msg)
}

export async function notifyLoginAlert(
  email: string | null,
  phone: string | null,
  data: { ip: string; time: string }
) {
  const msg = `PayHub Security: New login detected from IP ${data.ip} at ${data.time}. If this wasn't you, secure your account immediately.`

  if (email) {
    await sendEmail(email, 'New Login Detected - PayHub', `
      <div style="font-family:sans-serif;max-width:500px;margin:auto;">
        <h2 style="color:#dc2626;">🔐 New Login Detected</h2>
        <p>A new login to your PayHub account was detected.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px 0;color:#666;">IP Address</td><td style="padding:8px 0;font-family:monospace;">${data.ip}</td></tr>
          <tr><td style="padding:8px 0;color:#666;">Time</td><td style="padding:8px 0;">${data.time}</td></tr>
        </table>
        <p style="color:#dc2626;font-weight:bold;">If this wasn't you, change your password immediately.</p>
        <p style="color:#888;font-size:12px;">This is an automated security alert from PayHub.</p>
      </div>
    `)
  }

  if (phone) await sendSMS(phone, msg)
}

export async function notifyWelcome(email: string, name: string) {
  await sendEmail(email, 'Welcome to PayHub! 🎉', `
    <div style="font-family:sans-serif;max-width:500px;margin:auto;">
      <h2 style="color:#f97316;">Welcome to PayHub, ${name}! 🎉</h2>
      <p>Your account has been created successfully. Here's what you can do:</p>
      <ul style="line-height:2;">
        <li>💰 Send and receive crypto payments (BTC, ETH, USDT, USDC)</li>
        <li>👛 Manage your digital wallet</li>
        <li>📊 Track all your transactions</li>
        <li>🔒 Secured by blockchain technology</li>
      </ul>
      <a href="${process.env.NEXTAUTH_URL}/dashboard" style="display:inline-block;padding:12px 24px;background:#f97316;color:#fff;border-radius:8px;text-decoration:none;margin-top:16px;">Go to Dashboard</a>
      <p style="color:#888;font-size:12px;margin-top:24px;">This is an automated notification from PayHub.</p>
    </div>
  `)
}
