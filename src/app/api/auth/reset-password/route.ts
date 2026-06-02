import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { logger } from '@/lib/logger'
import { resetPasswordSchema } from '@/lib/validations'
import { rateLimitMiddleware, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    // Rate limit: max 5 reset attempts per 15 min per IP
    const isRateLimited = await rateLimitMiddleware(req, {
      interval: 900000,
      maxRequests: 5,
    })
    if (isRateLimited) {
      return rateLimitResponse(900)
    }

    const body = await req.json()
    const parsed = resetPasswordSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email, token, password } = parsed.data

    // Find and validate token
    const verificationToken = await prisma.verificationToken.findFirst({
      where: { identifier: email, token },
    })

    if (!verificationToken) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired reset link' },
        { status: 400 }
      )
    }

    if (verificationToken.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: {
          identifier_token: { identifier: email, token },
        },
      })
      return NextResponse.json(
        { success: false, error: 'Reset link has expired' },
        { status: 400 }
      )
    }

    // Update password and delete token
    const hashedPassword = await bcrypt.hash(password, 12)

    await prisma.$transaction([
      prisma.user.update({
        where: { email },
        data: { hashedPassword },
      }),
      prisma.verificationToken.delete({
        where: {
          identifier_token: { identifier: email, token },
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully',
    })
  } catch (error) {
    logger.error('Reset password error', { error })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
