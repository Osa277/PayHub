import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { rateLimitMiddleware, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    // Rate limit: max 10 verify attempts per 15 min per IP
    const isRateLimited = await rateLimitMiddleware(req, {
      interval: 900000,
      maxRequests: 10,
    })
    if (isRateLimited) {
      return rateLimitResponse(900)
    }

    const body = await req.json()
    const { email, token } = body

    if (!email || !token) {
      return NextResponse.json(
        { success: false, error: 'Email and token are required' },
        { status: 400 }
      )
    }

    // Find the verification token
    const verificationToken = await prisma.verificationToken.findFirst({
      where: { identifier: email, token },
    })

    if (!verificationToken) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired verification link' },
        { status: 400 }
      )
    }

    if (verificationToken.expires < new Date()) {
      // Clean up expired token
      await prisma.verificationToken.delete({
        where: {
          identifier_token: { identifier: email, token },
        },
      })
      return NextResponse.json(
        { success: false, error: 'Verification link has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Verify the user and delete the token
    await prisma.$transaction([
      prisma.user.update({
        where: { email },
        data: {
          emailVerified: new Date(),
          isVerified: true,
        },
      }),
      prisma.verificationToken.delete({
        where: {
          identifier_token: { identifier: email, token },
        },
      }),
    ])

    logger.info('Email verified', { context: { email } })

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully. You can now use all features.',
    })
  } catch (error) {
    logger.error('Email verification error', { error })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
