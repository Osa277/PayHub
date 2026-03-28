import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { logger } from '@/lib/logger'
import { forgotPasswordSchema } from '@/lib/validations'
import { rateLimiters } from '@/lib/rate-limit'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const { success: allowed } = rateLimiters.forgotPassword(ip)
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const parsed = forgotPasswordSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email } = parsed.data

    // Always return success to avoid email enumeration
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists, a reset link has been sent',
      })
    }

    // Delete existing tokens for this user
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    })

    // Create reset token (expires in 1 hour)
    const token = randomBytes(32).toString('hex')
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + 3600_000),
      },
    })

    // Send password reset email (falls back to logging if Resend not configured)
    await sendPasswordResetEmail(email, token)

    return NextResponse.json({
      success: true,
      message: 'If an account exists, a reset link has been sent',
    })
  } catch (error) {
    logger.error('Forgot password error', { error })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
