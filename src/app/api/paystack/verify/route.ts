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

    // Find the payment session
    const paymentSession = await prisma.paymentSession.findFirst({
      where: {
        stripeSessionId: reference,
        userId: session.user.id,
      },
    })

    if (!paymentSession) {
      return NextResponse.json(
        { success: false, error: 'Payment session not found' },
        { status: 404 }
      )
    }

    // Already completed
    if (paymentSession.status === 'completed') {
      return NextResponse.json({
        success: true,
        data: { status: 'completed', amount: paymentSession.amount },
        message: 'Payment already processed',
      })
    }

    // Verify with Paystack API
    const verification = await verifyPaystackPayment(reference)

    if (verification.data.status === 'success') {
      // Credit the user's wallet
      const amountInMajorUnit = verification.data.amount / 100

      await prisma.$transaction(async (tx) => {
        // Update payment session
        await tx.paymentSession.update({
          where: { id: paymentSession.id },
          data: { status: 'completed' },
        })

        // Credit wallet
        await tx.wallet.update({
          where: { userId: session.user.id },
          data: { balance: { increment: amountInMajorUnit } },
        })

        // Record transaction
        await tx.transaction.create({
          data: {
            userId: session.user.id,
            type: 'deposit',
            amount: amountInMajorUnit,
            currency: verification.data.currency,
            status: 'completed',
            description: `Paystack top-up (${reference})`,
            fee: 0,
          },
        })
      })

      return NextResponse.json({
        success: true,
        data: { status: 'completed', amount: amountInMajorUnit },
        message: 'Payment verified and wallet credited',
      })
    } else if (verification.data.status === 'failed') {
      await prisma.paymentSession.update({
        where: { id: paymentSession.id },
        data: { status: 'failed' },
      })

      return NextResponse.json({
        success: false,
        error: 'Payment failed',
        data: { status: 'failed' },
      })
    }

    // Still pending/abandoned
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
