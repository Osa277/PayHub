import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { sendInvoiceEmail } from '@/lib/email'
import { formatDate } from '@/lib/utils'

function computeNextDueDate(currentDueDate: Date, pattern: string, interval: number): Date {
  const next = new Date(currentDueDate)
  switch (pattern) {
    case 'daily':
      next.setDate(next.getDate() + interval)
      break
    case 'weekly':
      next.setDate(next.getDate() + 7 * interval)
      break
    case 'monthly':
      next.setMonth(next.getMonth() + interval)
      break
    case 'yearly':
      next.setFullYear(next.getFullYear() + interval)
      break
  }
  return next
}

// Cron endpoint: processes recurring invoices whose nextDueDate has passed.
// Secured via CRON_SECRET header (set in vercel.json or environment).
export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const now = new Date()

    // Find recurring invoices that are due
    const dueInvoices = await prisma.invoice.findMany({
      where: {
        isRecurring: true,
        recurrencePattern: { not: null },
        nextDueDate: { lte: now },
        status: { in: ['sent', 'paid'] },
      },
      include: { user: { select: { name: true, email: true } } },
    })

    let created = 0
    let emailed = 0

    for (const parent of dueInvoices) {
      // Create a new transaction for the child invoice
      const transaction = await prisma.transaction.create({
        data: {
          userId: parent.userId,
          type: 'payment',
          amount: parent.amount,
          currency: parent.currency,
          status: 'pending',
          description: `Recurring invoice #${parent.id.slice(-8)}`,
          fee: 0,
        },
      })

      const items = (Array.isArray(parent.items) ? parent.items : []) as {
        description: string; quantity: number; unitPrice: number; total: number
      }[]

      // Create the child invoice
      const childInvoice = await prisma.invoice.create({
        data: {
          userId: parent.userId,
          transactionId: transaction.id,
          amount: parent.amount,
          currency: parent.currency,
          status: parent.recipientEmail ? 'sent' : 'draft',
          recipientEmail: parent.recipientEmail,
          recipientName: parent.recipientName,
          items: items,
          dueDate: parent.nextDueDate!,
          parentInvoiceId: parent.id,
        },
      })
      created++

      // Send email if recipient exists
      if (parent.recipientEmail) {
        try {
          await sendInvoiceEmail(parent.recipientEmail, {
            invoiceId: childInvoice.id,
            recipientName: parent.recipientName,
            amount: Number(parent.amount).toFixed(2),
            currency: parent.currency,
            dueDate: formatDate(parent.nextDueDate!),
            items,
            senderName: parent.user.name || parent.user.email || 'PayHub User',
          })
          emailed++
        } catch (emailError) {
          logger.error('Failed to send recurring invoice email', { error: emailError })
        }
      }

      // Advance the parent's nextDueDate and record lastSentAt
      const newNextDue = computeNextDueDate(
        parent.nextDueDate!,
        parent.recurrencePattern!,
        parent.recurrenceInterval
      )

      await prisma.invoice.update({
        where: { id: parent.id },
        data: {
          nextDueDate: newNextDue,
          lastSentAt: now,
        },
      })
    }

    logger.info('Recurring invoices processed', {
      context: { found: dueInvoices.length, created, emailed },
    })

    return NextResponse.json({
      success: true,
      data: { processed: dueInvoices.length, created, emailed },
    })
  } catch (error) {
    logger.error('Recurring invoice cron error', { error })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
