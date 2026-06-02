import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { initializePaystackPayment, isPaystackConfigured } from '@/lib/paystack'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import crypto from 'crypto'
import { convertToNGN, getExchangeRate } from '@/lib/exchange-rates'

const initSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0').max(50000),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD']),
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
        { success: false, error: 'Payment service not configured' },
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

    // Convert to NGN for Paystack processing
    const exchangeRate = await getExchangeRate(currency)
    const amountInNGN = await convertToNGN(amount, currency)
    const amountInSmallestUnit = Math.round(amountInNGN * 100)

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const reference = `payhub_intl_${crypto.randomUUID()}`

    logger.info('Initializing INTERNATIONAL payment', {
      userId: session.user.id,
      context: {
        userAmount: amount,
        userCurrency: currency,
        amountInNGN,
        exchangeRate,
      },
    })

    // Create a pending payment session in the DB
    const paymentSession = await prisma.paymentSession.create({
      data: {
        userId: session.user.id,
        amount,
        currency,
        paymentProvider: 'paystack',
        status: 'pending',
        stripeSessionId: reference,
        redirectUrl: `${baseUrl}/wallet/paystack-callback?reference=${reference}`,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    })

    const paystackRes = await initializePaystackPayment({
      email: session.user.email,
      amount: amountInSmallestUnit,
      currency: 'NGN',
      reference,
      callbackUrl: `${baseUrl}/wallet/paystack-callback?reference=${reference}`,
      metadata: {
        userId: session.user.id,
        paymentSessionId: paymentSession.id,
        userCurrency: currency,
        userAmount: amount,
        purpose: 'wallet_topup_international',
      },
    })

    logger.info('INTERNATIONAL payment initialized', {
      context: {
        reference,
        amountInNGN,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        authorizationUrl: paystackRes.data.authorization_url,
        reference: paystackRes.data.reference,
        sessionId: paymentSession.id,
        amountInNGN,
        exchangeRate,
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error('International payment initialization error', { error: errorMessage })
    return NextResponse.json(
      { success: false, error: `Failed to initialize international payment: ${errorMessage}` },
      { status: 500 }
    )
  }
}
