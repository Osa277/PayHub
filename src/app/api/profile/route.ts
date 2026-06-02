import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { profileUpdateSchema, pinSetupSchema } from '@/lib/validations'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // OPTIMIZED: Single query with eager loading instead of 2 separate queries
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        phone: true,
        country: true,
        bio: true,
        transactionPin: true,
        wallet: {
          select: { currency: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        avatar: user?.avatar,
        phone: user?.phone,
        country: user?.country,
        bio: user?.bio,
        transactionPin: undefined,
        hasTransactionPin: !!user?.transactionPin,
        currency: user?.wallet?.currency ?? 'USD',
      },
    })
  } catch (error) {
    logger.error('Profile fetch error', { error })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = profileUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { currency, avatar, bio, name, phone, country } = parsed.data

    const data: Record<string, string | null> = {}
    if (avatar !== undefined) data.avatar = avatar || null
    if (bio !== undefined) data.bio = bio || null
    if (name) data.name = name
    if (phone !== undefined) data.phone = phone || null
    if (country !== undefined) data.country = country || null

    if (Object.keys(data).length > 0) {
      await prisma.user.update({
        where: { id: session.user.id },
        data,
      })
    }

    if (currency) {
      // OPTIMIZED: Use upsert to create wallet if missing (1 query instead of 2)
      const wallet = await prisma.wallet.upsert({
        where: { userId: session.user.id },
        update: {},
        create: { userId: session.user.id, balance: 0, currency },
      })
      if (wallet && Number(wallet.balance) > 0 && wallet.currency !== currency) {
        return NextResponse.json(
          { success: false, error: 'Cannot change currency while wallet has a non-zero balance' },
          { status: 400 }
        )
      }
      await prisma.wallet.updateMany({
        where: { userId: session.user.id },
        data: { currency },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Profile update error', { error })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = pinSetupSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { pin, currentPin } = parsed.data

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { transactionPin: true },
    })

    // If PIN already set, require current PIN to change it
    if (user?.transactionPin) {
      if (!currentPin) {
        return NextResponse.json(
          { success: false, error: 'Current PIN is required to change your PIN' },
          { status: 400 }
        )
      }
      const currentPinValid = await bcrypt.compare(currentPin, user.transactionPin)
      if (!currentPinValid) {
        return NextResponse.json(
          { success: false, error: 'Current PIN is incorrect' },
          { status: 403 }
        )
      }
    }

    const hashedPin = await bcrypt.hash(pin, 10)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { transactionPin: hashedPin },
    })

    return NextResponse.json({
      success: true,
      message: user?.transactionPin ? 'Transaction PIN updated' : 'Transaction PIN set successfully',
    })
  } catch (error) {
    logger.error('PIN setup error', { error })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
