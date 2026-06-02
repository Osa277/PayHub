import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { invoiceSchema } from '@/lib/validations'
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

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // OPTIMIZED: Add pagination support (page, limit from query params)
    const searchParams = req.nextUrl.searchParams
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'))
    const skip = (page - 1) * limit

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where: { userId: session.user.id } }),
    ])

    const formattedInvoices = invoices.map((inv) => ({
      ...inv,
      amount: Number(inv.amount),
      items: Array.isArray(inv.items)
        ? (inv.items as any[]).map((item: any) => ({
            ...item,
            unitPrice: Number(item.unitPrice ?? 0),
            total: Number(item.total ?? 0),
          }))
        : inv.items,
    }))

    const response = NextResponse.json({
      success: true,
      data: formattedInvoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })

    // Cache for 30 seconds
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60')
    return response
  } catch (error) {
    logger.error('Invoice fetch error', { error })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const parsed = invoiceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { transactionId, amount, currency, items, dueDate, recipientEmail, recipientName, isRecurring, recurrencePattern, recurrenceInterval } = parsed.data

    // Validate recurring invoice fields
    if (isRecurring && !recurrencePattern) {
      return NextResponse.json(
        { success: false, error: 'recurrencePattern is required for recurring invoices' },
        { status: 400 }
      )
    }

    // Verify transaction belongs to user
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, userId: session.user.id },
    })

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Check if invoice already exists for this transaction
    const existing = await prisma.invoice.findUnique({
      where: { transactionId },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Invoice already exists for this transaction' },
        { status: 400 }
      )
    }

    // Compute item totals
    const itemsWithTotals = items.map((item) => ({
      ...item,
      total: item.quantity * item.unitPrice,
    }))

    const dueDateObj = new Date(dueDate)
    const invoice = await prisma.invoice.create({
      data: {
        userId: session.user.id,
        transactionId,
        amount,
        currency,
        status: 'draft',
        recipientEmail: recipientEmail ?? null,
        recipientName: recipientName ?? null,
        items: itemsWithTotals,
        dueDate: dueDateObj,
        isRecurring: isRecurring ?? false,
        recurrencePattern: isRecurring ? recurrencePattern : null,
        recurrenceInterval: isRecurring ? (recurrenceInterval ?? 1) : 1,
        nextDueDate: isRecurring ? computeNextDueDate(dueDateObj, recurrencePattern ?? 'monthly', recurrenceInterval ?? 1) : null,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: invoice,
        message: 'Invoice created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error('Invoice create error', { error })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['sent'],
  sent: ['paid', 'overdue'],
  overdue: ['paid'],
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { invoiceId, status, recipientEmail: bodyEmail } = body

    if (!invoiceId || typeof invoiceId !== 'string' || !status || typeof status !== 'string') {
      return NextResponse.json(
        { success: false, error: 'invoiceId and status are required' },
        { status: 400 }
      )
    }

    const validStatuses = ['draft', 'sent', 'paid', 'overdue']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId: session.user.id },
    })

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      )
    }

    const allowedNext = VALID_STATUS_TRANSITIONS[invoice.status]
    if (!allowedNext?.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Cannot transition from '${invoice.status}' to '${status}'` },
        { status: 400 }
      )
    }

    // If transitioning to 'sent', require a recipientEmail (from body or stored)
    const recipientEmail = (typeof bodyEmail === 'string' && bodyEmail) ? bodyEmail : invoice.recipientEmail
    if (status === 'sent' && !recipientEmail) {
      return NextResponse.json(
        { success: false, error: 'recipientEmail is required to send an invoice' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = { status }
    // Store recipientEmail if provided
    if (typeof bodyEmail === 'string' && bodyEmail) {
      updateData.recipientEmail = bodyEmail
    }

    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
    })

    // Send email when marking as sent
    if (status === 'sent' && recipientEmail) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true },
      })
      const items = (Array.isArray(invoice.items) ? invoice.items : []) as {
        description: string; quantity: number; unitPrice: number; total: number
      }[]
      try {
        await sendInvoiceEmail(recipientEmail, {
          invoiceId: invoice.id,
          recipientName: updated.recipientName,
          amount: Number(invoice.amount).toFixed(2),
          currency: invoice.currency,
          dueDate: formatDate(invoice.dueDate),
          items,
          senderName: user?.name || user?.email || 'PayHub User',
        })
      } catch (emailError) {
        logger.error('Failed to send invoice email', { error: emailError })
        // Don't fail the status update if email fails
      }
    }

    logger.info('Invoice status updated', {
      userId: session.user.id,
      context: { invoiceId, from: invoice.status, to: status },
    })

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Invoice marked as ${status}`,
    })
  } catch (error) {
    logger.error('Invoice update error', { error })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
