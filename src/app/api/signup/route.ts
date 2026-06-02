import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { logger } from '@/lib/logger'
import { signupSchema } from '@/lib/validations'
import { notifyWelcome } from '@/lib/notifications'
import { sendVerificationEmail } from '@/lib/email'
import { rateLimiters } from '@/lib/rate-limit'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const { success: allowed } = rateLimiters.signup(ip)
    if (!allowed) {
      return NextResponse.json(apiError('Too many signup attempts. Please try again later.', 429), { status: 429 })
    }

    const body = await request.json()
    const parsed = signupSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(apiError(parsed.error.issues[0].message, 400), { status: 400 })
    }

    const { name, email, password, phone, country } = parsed.data

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    })

    if (existing) {
      return NextResponse.json(apiError('Unable to create account. Please try a different email.', 409), { status: 409 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user with wallet
    const user = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
        phone: phone || null,
        country: country || null,
        wallet: {
          create: {
            balance: 0,
            currency: 'NGN',
          },
        },
      },
      include: { wallet: true },
    })

    // Send welcome email (non-blocking)
    notifyWelcome(user.email, user.name || 'there').catch((error) => {
      logger.warn('Failed to send welcome email', { error })
    })

    // Generate verification token and send verification email
    const verificationToken = crypto.randomBytes(32).toString('hex')
    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token: verificationToken,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    })
    sendVerificationEmail(user.email, verificationToken).catch((error) => {
      logger.error('Failed to send verification email', { error })
    })

    return NextResponse.json(
      apiSuccess(
        {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        'Account created successfully. Please check your email to verify your account.'
      )
    )
  } catch (error) {
    logger.error('Signup error', { error })
    return NextResponse.json(apiError('Internal server error', 500), { status: 500 })
  }
}
