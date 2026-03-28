import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { topupSchema } from '@/lib/validations'

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
    const parsed = topupSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { amount } = parsed.data

    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.update({
        where: { userId: session.user.id },
        data: { balance: { increment: amount } },
      })

      const transaction = await tx.transaction.create({
        data: {
          userId: session.user.id,
          type: 'deposit',
          amount,
          currency: wallet.currency,
          status: 'completed',
          description: `Wallet top-up`,
          fee: 0,
        },
      })

      return { wallet, transaction }
    })

    return NextResponse.json({
      success: true,
      data: {
        balance: result.wallet.balance,
        transaction: result.transaction,
      },
      message: `Successfully added ${amount} to your wallet`,
    })
  } catch (error) {
    logger.error('Top-up error', { error })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
