import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { createCryptoPayment, type CryptoId } from '@/lib/crypto-payment'
import { logger } from '@/lib/logger'
import { paymentSchema } from '@/lib/validations'
import { rateLimiters } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { success: allowed } = rateLimiters.payment(session.user.id)
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many payment requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const parsed = paymentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { amount, currency, cryptoCurrency, recipientEmail, description } = parsed.data

    // Idempotency check: prevent duplicate payments
    const idempotencyKey = req.headers.get('x-idempotency-key')
    if (idempotencyKey) {
      const existing = await prisma.paymentSession.findFirst({
        where: { userId: session.user.id, stripeSessionId: `idem_${idempotencyKey}` },
      })
      if (existing) {
        return NextResponse.json({
          success: true,
          data: { sessionId: existing.id, status: existing.status },
          message: 'Duplicate request — returning existing payment session',
        })
      }
    }

    // Create crypto payment session
    const cryptoSession = await createCryptoPayment({
      amountUsd: amount,
      cryptoCurrency: cryptoCurrency as CryptoId,
      userId: session.user.id,
      recipientEmail: recipientEmail ?? undefined,
      description,
    })

    // Create payment session in DB
    const paymentSession = await prisma.paymentSession.create({
      data: {
        userId: session.user.id,
        amount,
        currency,
        paymentProvider: 'crypto',
        status: 'pending',
        stripeSessionId: cryptoSession.id, // reuse field for crypto session ID
        expiresAt: cryptoSession.expiresAt,
      },
    })

    // Create pending transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        type: 'payment',
        amount,
        currency,
        status: 'pending',
        description: description || 'Crypto payment via PayHub',
        recipientEmail: recipientEmail || null,
        fee: amount * 0.01, // 1% fee for crypto
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        sessionId: paymentSession.id,
        transactionId: transaction.id,
        cryptoSessionId: cryptoSession.id,
        walletAddress: cryptoSession.walletAddress,
        cryptoAmount: cryptoSession.cryptoAmount,
        cryptoCurrency: cryptoSession.cryptoCurrency,
        exchangeRate: cryptoSession.exchangeRate,
        network: cryptoSession.network,
        amount,
        currency,
        paymentProvider: 'crypto',
        status: 'awaiting_payment',
        expiresAt: cryptoSession.expiresAt,
      },
      message: `Send ${cryptoSession.cryptoAmount} ${cryptoCurrency} to the wallet address to complete payment`,
    })
  } catch (error) {
    logger.error('Payment creation error', { error })
    return NextResponse.json(
      { success: false, error: 'Failed to create payment. Please try again.' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const sessionId = req.nextUrl.searchParams.get('sessionId')

    if (sessionId) {
      const paymentSession = await prisma.paymentSession.findUnique({
        where: { id: sessionId },
      })

      if (!paymentSession || paymentSession.userId !== session.user.id) {
        return NextResponse.json(
          { success: false, error: 'Payment session not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ success: true, data: paymentSession })
    }

    // List user's transactions
    const transactions = await prisma.transaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ success: true, data: transactions })
  } catch (error) {
    logger.error('Payment retrieval error', { error })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
