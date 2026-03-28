import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!stripe || !signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      // Demo mode or missing config — skip webhook verification
      return NextResponse.json({ received: true })
    }

    // Verify the webhook signature
    let event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } catch (err) {
      logger.error('Webhook signature verification failed', { error: err })
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    // Handle specific event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object
        const paymentSession = await prisma.paymentSession.findUnique({
          where: { stripeSessionId: paymentIntent.id },
        })

        if (paymentSession) {
          // Update payment session status
          await prisma.paymentSession.update({
            where: { id: paymentSession.id },
            data: { status: 'completed' },
          })

          // Find and update related transaction
          const transaction = await prisma.transaction.findFirst({
            where: {
              userId: paymentSession.userId,
              status: 'pending',
              amount: paymentSession.amount,
            },
            orderBy: { createdAt: 'desc' },
          })

          if (transaction) {
            await prisma.$transaction([
              prisma.transaction.update({
                where: { id: transaction.id },
                data: { status: 'completed' },
              }),
              prisma.wallet.update({
                where: { userId: paymentSession.userId },
                data: { balance: { decrement: transaction.amount + transaction.fee } },
              }),
            ])
          }
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const failedIntent = event.data.object
        const failedSession = await prisma.paymentSession.findUnique({
          where: { stripeSessionId: failedIntent.id },
        })

        if (failedSession) {
          await prisma.paymentSession.update({
            where: { id: failedSession.id },
            data: { status: 'failed' },
          })

          const failedTxn = await prisma.transaction.findFirst({
            where: {
              userId: failedSession.userId,
              status: 'pending',
              amount: failedSession.amount,
            },
            orderBy: { createdAt: 'desc' },
          })

          if (failedTxn) {
            await prisma.transaction.update({
              where: { id: failedTxn.id },
              data: { status: 'failed' },
            })
          }
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    logger.error('Webhook error', { error })
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
