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

    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    })

    const transactions = await prisma.transaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    // Format wallet for the frontend types
    const formattedWallet = wallet
      ? {
          id: wallet.id,
          userId: wallet.userId,
          balance: wallet.balance,
          currency: wallet.currency,
          transactions: [],
          createdAt: wallet.createdAt,
          updatedAt: wallet.updatedAt,
        }
      : null

    // Format transactions for the frontend types
    const formattedTransactions = transactions.map((t) => ({
      id: t.id,
      userId: t.userId,
      type: t.type,
      amount: t.amount,
      currency: t.currency,
      status: t.status,
      description: t.description,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }))

    return NextResponse.json({
      success: true,
      data: {
        wallet: formattedWallet,
        transactions: formattedTransactions,
      },
    })
  } catch (error) {
    logger.error('Wallet fetch error', { error })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
