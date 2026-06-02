import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { transactionCreateSchema } from '@/lib/validations'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')))
    const type = searchParams.get('type')
    const status = searchParams.get('status')

    const validTypes = ['payment', 'transfer', 'deposit', 'withdrawal']
    const validStatuses = ['pending', 'completed', 'failed']

    if (type && !validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = { userId: session.user.id }
    if (type) where.type = type
    if (status) where.status = status

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    })
  } catch (error) {
    logger.error('Transactions fetch error', { error })
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
    const parsed = transactionCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { type, amount, currency, description, recipientEmail } = parsed.data

    // Validate wallet balance for outgoing transactions
    if (type === 'payment' || type === 'transfer' || type === 'withdrawal') {
      const wallet = await prisma.wallet.findUnique({ where: { userId: session.user.id } })
      const fee = type === 'payment' ? amount * 0.01 : type === 'transfer' ? amount * 0.005 : 0
      if (!wallet || Number(wallet.balance) < amount + fee) {
        return NextResponse.json(
          { success: false, error: 'Insufficient balance' },
          { status: 400 }
        )
      }
    }

    const fee = type === 'payment' ? amount * 0.01 : type === 'transfer' ? amount * 0.005 : 0

    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        type,
        amount,
        currency,
        status: 'pending',
        description: description || '',
        recipientEmail: recipientEmail || null,
        fee,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: transaction,
        message: 'Transaction created',
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error('Transaction create error', { error })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
