import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import crypto from 'crypto'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || ''

function verifyWebhookSignature(body: string, signature: string): boolean {
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(body)
    .digest('hex')
  return hash === signature
}

export async function POST(req: NextRequest) {
  try {
    if (!PAYSTACK_SECRET_KEY || !PAYSTACK_SECRET_KEY.startsWith('sk_')) {
      logger.error('Paystack webhook: secret key not configured')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }

    const rawBody = await req.text()
    const signature = req.headers.get('x-paystack-signature')

    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      logger.error('Paystack webhook: invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(rawBody)

    if (event.event === 'charge.failed') {
      const { reference } = event.data
      const paymentSession = await prisma.paymentSession.findFirst({
        where: { stripeSessionId: reference },
      })
      if (paymentSession && paymentSession.status === 'pending') {
        await prisma.paymentSession.update({
          where: { id: paymentSession.id },
          data: { status: 'failed' },
        })
        logger.info('Paystack webhook: payment failed', { context: { reference } })
      }
      return NextResponse.json({ received: true })
    }

    if (event.event === 'charge.success') {
      const { reference, amount, currency, metadata } = event.data
      const amountInMajorUnit = amount / 100

      // Find the payment session by reference
      const paymentSession = await prisma.paymentSession.findFirst({
        where: { stripeSessionId: reference },
      })

      if (!paymentSession) {
        logger.error('Paystack webhook: session not found', { context: { reference } })
        return NextResponse.json({ received: true })
      }

      // Skip if already completed
      if (paymentSession.status === 'completed') {
        return NextResponse.json({ received: true })
      }

      const userId = paymentSession.userId

      await prisma.$transaction(async (tx) => {
        await tx.paymentSession.update({
          where: { id: paymentSession.id },
          data: { status: 'completed' },
        })

        await tx.wallet.update({
          where: { userId },
          data: { balance: { increment: amountInMajorUnit } },
        })

        await tx.transaction.create({
          data: {
            userId,
            type: 'deposit',
            amount: amountInMajorUnit,
            currency: currency || 'NGN',
            status: 'completed',
            description: `Paystack top-up (${reference})`,
            fee: 0,
            metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
          },
        })
      })

      logger.info('Paystack webhook: payment processed', { context: { reference, amount: amountInMajorUnit } })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    logger.error('Paystack webhook error', { error })
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
