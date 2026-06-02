import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { verifyPaystackPayment } from '@/lib/paystack'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const reference = req.nextUrl.searchParams.get('reference')
    if (!reference) {
      return NextResponse.json(
        { success: false, error: 'Reference is required' },
        { status: 400 }
      )
    }

    logger.info('Verifying payment', {
      userId: session.user.id,
      context: {
        reference,
      },
    })

    // Find the payment session
    const paymentSession = await prisma.paymentSession.findFirst({
      where: {
        stripeSessionId: reference,
        userId: session.user.id,
      },
    })

    logger.info('Payment session lookup', { userId: session.user.id, context: { sessionId: paymentSession?.id, status: paymentSession?.status, reference } })

    if (!paymentSession) {
      logger.error('Payment session not found', { userId: session.user.id, context: { reference } })
      return NextResponse.json(
        { success: false, error: 'Payment session not found' },
        { status: 404 }
      )
    }

    // Already completed
    if (paymentSession.status === 'completed') {
      return NextResponse.json({
        success: true,
        data: { status: 'completed', amount: Number(paymentSession.amount) },
        message: 'Payment already processed',
      })
    }

    // Verify with Paystack API
    logger.info('Verifying with Paystack', { context: { reference } })
    const verification = await verifyPaystackPayment(reference)
    logger.info('Paystack verification result', { context: { reference, status: verification.data.status } })

    if (verification.data.status === 'success') {
      // Credit the user's wallet with original amount in their currency
      const amountToCredit = Number(paymentSession.amount)

      logger.info('Crediting wallet', { userId: session.user.id, context: { amount: amountToCredit, currency: paymentSession.currency } })

      await prisma.$transaction(async (tx) => {
        // Update payment session
        await tx.paymentSession.update({
          where: { id: paymentSession.id },
          data: { status: 'completed' },
        })

        // Credit wallet with original amount in user's currency
        await tx.wallet.update({
          where: { userId: session.user.id },
          data: { balance: { increment: amountToCredit } },
        })

        // Record transaction
        await tx.transaction.create({
          data: {
            userId: session.user.id,
            type: 'deposit',
            amount: amountToCredit,
            currency: paymentSession.currency,
            status: 'completed',
            description: `Paystack top-up (${reference})`,
            fee: 0,
          },
        })
      })

      logger.info('Wallet credited successfully', { userId: session.user.id, context: { amount: amountToCredit } })

      return NextResponse.json({
        success: true,
        data: { status: 'completed', amount: amountToCredit },
        message: 'Payment verified and wallet credited',
      })
    } else if (verification.data.status === 'failed') {
      logger.warn('Payment failed', { context: { reference } })
      await prisma.paymentSession.update({
        where: { id: paymentSession.id },
        data: { status: 'failed' },
      })

      return NextResponse.json(
        {
          success: false,
          error: 'Payment failed',
          data: { status: 'failed' },
        }
      )
    }

    // Still pending/abandoned
    logger.info('Payment pending', { context: { reference, status: verification.data.status } })
    return NextResponse.json({
      success: true,
      data: { status: verification.data.status },
      message: 'Payment is still pending',
    })
  } catch (error) {
    logger.error('Paystack verify error', { error })
    return NextResponse.json(
      { success: false, error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}
