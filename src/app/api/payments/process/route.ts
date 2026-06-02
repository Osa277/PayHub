import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { processPaymentSchema } from '@/lib/validations'
import { notifyPaymentSent } from '@/lib/notifications'
import bcrypt from 'bcryptjs'

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

    const { transactionId, pin } = parsed.data

    // Validate transaction PIN server-side
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, phone: true, name: true, transactionPin: true },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.transactionPin) {
      return NextResponse.json(
        { success: false, error: 'Transaction PIN not set. Please set a PIN in your profile settings.' },
        { status: 400 }
      )
    }

    const pinValid = await bcrypt.compare(pin, user.transactionPin)
    if (!pinValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid transaction PIN' },
        { status: 403 }
      )
    }

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

    const totalAmount = Number(transaction.amount) + Number(transaction.fee)

    // Process: check balance and deduct atomically to prevent race conditions
    try {
      await prisma.$transaction(async (tx) => {
        const currentWallet = await tx.wallet.findUnique({
          where: { userId: session.user.id },
        })

        if (!currentWallet || Number(currentWallet.balance) < totalAmount) {
          // Mark transaction as failed
          await tx.transaction.update({
            where: { id: transactionId },
            data: { status: 'failed' },
          })
          throw new Error('Insufficient balance')
        }

        await tx.wallet.update({
          where: { userId: session.user.id },
          data: { balance: { decrement: totalAmount } },
        })

        await tx.transaction.update({
          where: { id: transactionId },
          data: { status: 'completed' },
        })
      })
    } catch (txError) {
      if ((txError as Error).message === 'Insufficient balance') {
        return NextResponse.json(
          { success: false, error: 'Insufficient balance' },
          { status: 400 }
        )
      }
      throw txError
    }

    const updatedTransaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    })

    // Send payment notification (non-blocking)
    if (user) {
      notifyPaymentSent(
        user.email,
        user.phone,
        {
          amount: Number(transaction.amount),
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
