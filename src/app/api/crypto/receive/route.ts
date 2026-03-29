import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const receiveSchema = z.object({
  cryptocurrency: z.enum(['BTC', 'ETH', 'USDT']),
  label: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const parsed = receiveSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { cryptocurrency, label } = parsed.data

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

    // Generate mock address (in production, use blockchain API)
    const generateAddress = (crypto: string) => {
      const chars = '0123456789abcdef'
      let addr = ''
      if (crypto === 'BTC') {
        addr = '1' + Array(33).fill(0).map(() => chars[Math.floor(Math.random() * 16)]).join('')
      } else if (crypto === 'ETH') {
        addr = '0x' + Array(40).fill(0).map(() => chars[Math.floor(Math.random() * 16)]).join('')
      } else if (crypto === 'USDT') {
        addr = '0x' + Array(40).fill(0).map(() => chars[Math.floor(Math.random() * 16)]).join('')
      }
      return addr
    }

    const address = generateAddress(cryptocurrency)

    // Check if address already exists
    const existing = await prisma.cryptoAddress.findFirst({
      where: {
        userId: session.user.id,
        cryptocurrency,
      },
    })

    // If exists, return it; otherwise create new
    let cryptoAddress = existing
    if (!existing) {
      cryptoAddress = await prisma.cryptoAddress.create({
        data: {
          userId: session.user.id,
          cryptoWalletId: cryptoWallet.id,
          cryptocurrency,
          address,
          label: label || `${cryptocurrency} Address`,
          isDefault: true,
        },
      })
    }

    if (!cryptoAddress) {
      throw new Error('Failed to create or retrieve address')
    }

    logger.info('Crypto address generated', {
      userId: session.user.id,
      context: {
        cryptocurrency,
        address,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        address: cryptoAddress.address,
        cryptocurrency,
        label: cryptoAddress.label,
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${cryptoAddress.address}`,
      },
      message: `${cryptocurrency} receive address generated`,
    })
  } catch (error) {
    logger.error('Crypto receive error', { error })
    return NextResponse.json(
      { success: false, error: 'Failed to generate receive address' },
      { status: 500 }
    )
  }
}

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const addresses = await prisma.cryptoAddress.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: addresses,
    })
  } catch (error) {
    logger.error('Crypto addresses fetch error', { error })
    return NextResponse.json(
      { success: false, error: 'Failed to fetch addresses' },
      { status: 500 }
    )
  }
}
