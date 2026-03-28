import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { invoiceSchema } from '@/lib/validations'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const invoices = await prisma.invoice.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({
      success: true,
      data: invoices,
    })
  } catch (error) {
    logger.error('Invoices fetch error', { error })
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

    const { transactionId, amount, currency, items, dueDate } = parsed.data

    const invoice = await prisma.invoice.create({
      data: {
        userId: session.user.id,
        transactionId,
        amount,
        currency,
        status: 'draft',
        items,
        dueDate: new Date(dueDate),
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: invoice,
        message: 'Invoice created',
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
