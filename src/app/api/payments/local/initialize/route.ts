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

    // Check if user email is verified
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { emailVerified: true, isVerified: true },
    })

    if (!user?.emailVerified && !user?.isVerified) {
      return NextResponse.json(
        { success: false, error: 'Please verify your email before making payments' },
        { status: 403 }
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

    const { amount } = parsed.data

    // Amount in kobo (Paystack expects smallest unit)
    const amountInSmallestUnit = Math.round(amount * 100)

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const reference = `payhub_local_${crypto.randomUUID()}`

    logger.info('Initializing LOCAL payment (NGN)', {
      userId: session.user.id,
      context: {
        amount,
        currency: 'NGN',
      },
    })

    // Create a pending payment session in the DB
    const paymentSession = await prisma.paymentSession.create({
      data: {
        userId: session.user.id,
        amount,
        currency: 'NGN',
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
        purpose: 'wallet_topup_local',
      },
    })

    logger.info('LOCAL payment initialized', {
      context: {
        reference,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        authorizationUrl: paystackRes.data.authorization_url,
        reference: paystackRes.data.reference,
        sessionId: paymentSession.id,
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Local payment initialization error', { error: errorMessage })
    return NextResponse.json(
      { success: false, error: `Failed to initialize local payment: ${errorMessage}` },
      { status: 500 }
    )
  }
}
