import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // OPTIMIZED: Use upsert to create wallet if missing (1 query instead of 3)
    const [wallet, transactions] = await Promise.all([
      prisma.wallet.upsert({
        where: { userId: session.user.id },
        update: {},
        create: {
          userId: session.user.id,
          balance: 0,
          currency: 'NGN',
        },
      }),
      prisma.transaction.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ])

    // Format wallet for the frontend types (convert Decimal to number)
    const formattedWallet = {
      id: wallet.id,
      userId: wallet.userId,
      balance: Number(wallet.balance),
      currency: wallet.currency,
      transactions: [],
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    }

    // Format transactions for the frontend types (convert Decimal to number)
    const formattedTransactions = transactions.map((t) => ({
      id: t.id,
      userId: t.userId,
      type: t.type,
      amount: Number(t.amount),
      currency: t.currency,
      status: t.status,
      description: t.description,
      fee: Number(t.fee || 0),
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }))

    const response = NextResponse.json({
      success: true,
      data: {
        wallet: formattedWallet,
        transactions: formattedTransactions,
      },
    })

    response.headers.set('Cache-Control', 'private, max-age=10, stale-while-revalidate=30')
    return response
  } catch (error) {
    logger.error('Wallet fetch error', { error })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
