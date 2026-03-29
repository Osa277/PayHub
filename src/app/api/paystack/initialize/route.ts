import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { initializePaystackPayment, isPaystackConfigured } from '@/lib/paystack'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import crypto from 'crypto'

const initSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0').max(50000),
  currency: z.enum(['NGN', 'GHS', 'ZAR', 'USD']).optional().default('NGN'),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!isPaystackConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Paystack is not configured' },
        { status: 503 }
      )
    }

    const body = await req.json()
    const parsed = initSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { amount, currency } = parsed.data

    // Amount in kobo/cents (Paystack expects smallest unit)
    const amountInSmallestUnit = Math.round(amount * 100)

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const reference = `payhub_${crypto.randomUUID()}`

    // Create a pending payment session in the DB
    const paymentSession = await prisma.paymentSession.create({
      data: {
        userId: session.user.id,
        amount,
        currency,
        paymentProvider: 'paystack',
        status: 'pending',
        stripeSessionId: reference, // reuse the field for paystack reference
        redirectUrl: `${baseUrl}/wallet/paystack-callback?reference=${reference}`,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 mins
      },
    })

    const paystackRes = await initializePaystackPayment({
      email: session.user.email,
      amount: amountInSmallestUnit,
      currency,
      reference,
      callbackUrl: `${baseUrl}/wallet/paystack-callback?reference=${reference}`,
      metadata: {
        userId: session.user.id,
        paymentSessionId: paymentSession.id,
        purpose: 'wallet_topup',
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        authorizationUrl: paystackRes.data.authorization_url,
        accessCode: paystackRes.data.access_code,
        reference: paystackRes.data.reference,
        sessionId: paymentSession.id,
      },
    })
  } catch (error) {
    logger.error('Paystack initialize error', { error })
    return NextResponse.json(
      { success: false, error: 'Failed to initialize payment' },
      { status: 500 }
    )
  }
}
