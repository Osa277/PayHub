import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { logger } from '@/lib/logger'
import { sendVerificationEmail } from '@/lib/email'
import { rateLimitMiddleware, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    // Rate limit: max 3 resend attempts per 15 min per IP
    const isRateLimited = await rateLimitMiddleware(req, {
      interval: 900000,
      maxRequests: 3,
    })
    if (isRateLimited) {
      return rateLimitResponse(900)
    }

    const body = await req.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    // Always return success to prevent email enumeration
    const successResponse = NextResponse.json({
      success: true,
      message: 'If an account exists with that email, a verification link has been sent.',
    })

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, isVerified: true },
    })

    if (!user || user.isVerified) {
      return successResponse
    }

    // Delete any existing verification tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    })

    // Generate new token
    const token = crypto.randomBytes(32).toString('hex')
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    })

    await sendVerificationEmail(email, token)

    logger.info('Verification email resent', { context: { email } })

    return successResponse
  } catch (error) {
    logger.error('Resend verification error', { error })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
