import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    })

    return NextResponse.json({
      success: true,
      data: wallet
        ? {
            id: wallet.id,
            userId: wallet.userId,
            balance: wallet.balance,
            currency: wallet.currency,
            transactions: [],
            createdAt: wallet.createdAt,
            updatedAt: wallet.updatedAt,
          }
        : null,
    })
  } catch (error) {
    logger.error('Wallet fetch error', { error })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { currency } = await req.json()

    const existing = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Wallet already exists' },
        { status: 409 }
      )
    }

    const wallet = await prisma.wallet.create({
      data: {
        userId: session.user.id,
        currency: currency || 'USD',
        balance: 0,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: wallet,
        message: 'Wallet created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error('Wallet create error', { error })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
