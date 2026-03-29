import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    let cryptoWallet = await prisma.cryptoWallet.findUnique({
      where: { userId: session.user.id },
    })

    if (!cryptoWallet) {
      cryptoWallet = await prisma.cryptoWallet.create({
        data: {
          userId: session.user.id,
          btcBalance: 0,
          ethBalance: 0,
          usdtBalance: 0,
        },
      })
    }

    const transactions = await prisma.cryptoTransaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({
      success: true,
      data: {
        wallet: cryptoWallet,
        transactions,
      },
    })
  } catch (error) {
    logger.error('Crypto wallet fetch error', { error })
    return NextResponse.json(
      { success: false, error: 'Failed to fetch crypto wallet' },
      { status: 500 }
    )
  }
}
