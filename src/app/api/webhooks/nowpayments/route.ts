import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { NOWPAYMENTS_IPN_SECRET, mapNowPaymentsStatus } from '@/lib/crypto-payment'

/**
 * NOWPayments IPN (Instant Payment Notification) webhook handler.
 * Receives payment status updates and updates our DB accordingly.
 * Docs: https://documenter.getpostman.com/view/7907941/2s93JwMgmb#ipn-callbacks
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const receivedSignature = req.headers.get('x-nowpayments-sig')

    // Verify HMAC signature if IPN secret is configured
    if (NOWPAYMENTS_IPN_SECRET && receivedSignature) {
      const sortedBody = JSON.stringify(
        Object.keys(body).sort().reduce((sorted: Record<string, unknown>, key) => {
          sorted[key] = body[key]
          return sorted
        }, {})
      )
      const expectedSignature = createHmac('sha512', NOWPAYMENTS_IPN_SECRET)
        .update(sortedBody)
        .digest('hex')

      if (receivedSignature !== expectedSignature) {
        logger.error('NOWPayments webhook signature mismatch')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
      }
    }

    const {
      payment_id,
      payment_status,
      order_id,
      actually_paid,
      pay_amount,
      outcome_amount,
      outcome_currency,
    } = body

    logger.info('NOWPayments webhook received', {
      context: { payment_id, payment_status, order_id },
    })

    if (!order_id || !payment_status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Find payment session by the crypto session ID stored in stripeSessionId field
    const paymentSession = await prisma.paymentSession.findFirst({
      where: { stripeSessionId: order_id },
    })

    if (!paymentSession) {
      logger.warn('NOWPayments webhook: payment session not found', {
        context: { order_id },
      })
      return NextResponse.json({ received: true })
    }

    const internalStatus = mapNowPaymentsStatus(payment_status)

    // Update payment session status
    await prisma.paymentSession.update({
      where: { id: paymentSession.id },
      data: { status: internalStatus === 'completed' ? 'completed' : internalStatus === 'failed' || internalStatus === 'expired' ? 'failed' : 'pending' },
    })

    // Find the related pending transaction
    const transaction = await prisma.transaction.findFirst({
      where: {
        userId: paymentSession.userId,
        status: 'pending',
        amount: paymentSession.amount,
      },
      orderBy: { createdAt: 'desc' },
    })

    if (transaction) {
      if (internalStatus === 'completed') {
        // Payment confirmed — mark transaction completed, deduct from wallet
        await prisma.$transaction([
          prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              status: 'completed',
              metadata: {
                paymentId: payment_id,
                actuallyPaid: actually_paid,
                payAmount: pay_amount,
                outcomeAmount: outcome_amount,
                outcomeCurrency: outcome_currency,
                confirmedAt: new Date().toISOString(),
              },
            },
          }),
          prisma.wallet.update({
            where: { userId: paymentSession.userId },
            data: { balance: { decrement: transaction.amount + transaction.fee } },
          }),
        ])

        logger.info('Crypto payment completed', {
          context: { transactionId: transaction.id, payment_id },
        })
      } else if (internalStatus === 'failed' || internalStatus === 'expired') {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: 'failed' },
        })

        logger.info('Crypto payment failed/expired', {
          context: { transactionId: transaction.id, payment_id, status: payment_status },
        })
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    logger.error('NOWPayments webhook error', { error })
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
