import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { processPaymentSchema } from '@/lib/validations'
import { notifyPaymentSent } from '@/lib/notifications'

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
    const parsed = processPaymentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { transactionId } = parsed.data

    // Find the transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    })

    if (!transaction || transaction.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      )
    }

    if (transaction.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Transaction already processed' },
        { status: 400 }
      )
    }

    // Check wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    })

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet not found' },
        { status: 404 }
      )
    }

    const totalAmount = transaction.amount + transaction.fee
    if (wallet.balance < totalAmount) {
      // Mark transaction as failed
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'failed' },
      })

      return NextResponse.json(
        { success: false, error: 'Insufficient balance' },
        { status: 400 }
      )
    }

    // Process: deduct balance and mark as completed
    await prisma.$transaction([
      prisma.wallet.update({
        where: { userId: session.user.id },
        data: { balance: { decrement: totalAmount } },
      }),
      prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'completed' },
      }),
    ])

    const updatedTransaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    })

    // Send payment notification (non-blocking)
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (user) {
      notifyPaymentSent(
        user.email,
        user.phone,
        {
          amount: transaction.amount,
          currency: transaction.currency,
          recipient: transaction.recipientEmail || 'N/A',
          txnId: transactionId,
        }
      ).catch(() => {})
    }

    return NextResponse.json({
      success: true,
      data: updatedTransaction,
      message: 'Payment processed successfully',
    })
  } catch (error) {
    logger.error('Process payment error', { error })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
