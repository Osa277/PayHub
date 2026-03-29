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
  currency: z.enum(['NGN', 'USD', 'EUR', 'GBP', 'CAD']).optional().default('NGN'),
})

// Simple exchange rates to NGN (update these based on current rates)
const EXCHANGE_RATES: Record<string, number> = {
  'NGN': 1,
  'USD': 1550, // 1 USD = ~1550 NGN
  'EUR': 1700, // 1 EUR = ~1700 NGN
  'GBP': 1950, // 1 GBP = ~1950 NGN
  'CAD': 1150, // 1 CAD = ~1150 NGN
}

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

    const userCurrency = parsed.data.currency || 'NGN'
    const userAmount = parsed.data.amount

    // Convert to NGN for Paystack (which only accepts NGN)
    const exchangeRate = EXCHANGE_RATES[userCurrency] || 1
    const amountInNGN = Math.round(userAmount * exchangeRate * 100) / 100 // Amount in NGN

    logger.info('Initializing Paystack payment', {
      userId: session.user.id,
      context: {
        userAmount,
        userCurrency,
        amountInNGN,
        exchangeRate,
      },
    })

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const reference = `payhub_${crypto.randomUUID()}`

    // Create a pending payment session in the DB
    const paymentSession = await prisma.paymentSession.create({
      data: {
        userId: session.user.id,
        amount: userAmount, // Store original amount in user's currency
        currency: userCurrency, // Store user's currency
        paymentProvider: 'paystack',
        status: 'pending',
        stripeSessionId: reference, // reuse the field for paystack reference
        redirectUrl: `${baseUrl}/wallet/paystack-callback?reference=${reference}`,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 mins
      },
    })

    logger.info('Payment session created', {
      context: {
        sessionId: paymentSession.id,
      },
    })

    // Initialize with NGN amount for Paystack
    const paystackRes = await initializePaystackPayment({
      email: session.user.email,
      amount: Math.round(amountInNGN * 100), // Convert to kobo for Paystack
      currency: 'NGN',
      reference,
      callbackUrl: `${baseUrl}/wallet/paystack-callback?reference=${reference}`,
      metadata: {
        userId: session.user.id,
        paymentSessionId: paymentSession.id,
        userCurrency,
        userAmount,
        purpose: 'wallet_topup',
      },
    })

    logger.info('Paystack initialization successful', {
      context: {
        reference,
        amountInNGN,
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Paystack initialize error', {
      error: error as Error,
    })
    return NextResponse.json(
      { success: false, error: `Failed to initialize payment: ${errorMessage}` },
      { status: 500 }
    )
  }
}
