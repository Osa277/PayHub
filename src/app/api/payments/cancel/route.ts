import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const cancelSchema = z.object({
  transactionId: z.string().min(1, 'Transaction ID is required'),
  reason: z.string().max(500).optional(),
})

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
    const parsed = cancelSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { transactionId, reason } = parsed.data

    // Find the transaction — must belong to the user
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    })

    if (!transaction || transaction.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Only pending transactions can be cancelled
    if (transaction.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: `Cannot cancel a ${transaction.status} transaction` },
        { status: 400 }
      )
    }

    // Cancel atomically — update transaction + payment session if linked
    await prisma.$transaction(async (tx) => {
      // Update transaction status
      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'cancelled',
          description: reason
            ? `${transaction.description} [Cancelled: ${reason}]`
            : transaction.description,
        },
      })

      // If this payment had a wallet deduction already (shouldn't for pending, but be safe)
      // No refund needed since pending payments haven't been processed yet

      // Cancel any linked payment session
      const paymentSession = await tx.paymentSession.findFirst({
        where: {
          userId: session.user.id,
          status: 'pending',
          createdAt: {
            gte: new Date(transaction.createdAt.getTime() - 5000), // within 5s
            lte: new Date(transaction.createdAt.getTime() + 5000),
          },
          amount: transaction.amount,
        },
      })

      if (paymentSession) {
        await tx.paymentSession.update({
          where: { id: paymentSession.id },
          data: { status: 'cancelled' },
        })
      }
    })

    logger.info('Payment cancelled', {
      userId: session.user.id,
      context: { transactionId, reason },
    })

    return NextResponse.json({
      success: true,
      message: 'Payment cancelled successfully',
    })
  } catch (error) {
    logger.error('Payment cancellation error', { error })
    return NextResponse.json(
      { success: false, error: 'Failed to cancel payment' },
      { status: 500 }
    )
  }
}
