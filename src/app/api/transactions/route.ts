import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { transactionCreateSchema } from '@/lib/validations'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({
      success: true,
      data: transactions,
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
      const fee = type === 'payment' ? amount * 0.015 : type === 'transfer' ? amount * 0.005 : 0
      if (!wallet || wallet.balance < amount + fee) {
        return NextResponse.json(
          { success: false, error: 'Insufficient balance' },
          { status: 400 }
        )
      }
    }

    const fee = type === 'payment' ? amount * 0.015 : type === 'transfer' ? amount * 0.005 : 0

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
