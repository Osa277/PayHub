import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const sellSchema = z.object({
  cryptocurrency: z.enum(['BTC', 'ETH', 'USDT']),
  cryptoAmount: z.number().positive('Amount must be greater than 0'),
  fiatCurrency: z.string().default('NGN'),
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
    const parsed = sellSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { cryptocurrency, cryptoAmount, fiatCurrency } = parsed.data

    const cryptoWallet = await prisma.cryptoWallet.findUnique({
      where: { userId: session.user.id },
    })

    if (!cryptoWallet) {
      return NextResponse.json(
        { success: false, error: 'Crypto wallet not found' },
        { status: 404 }
      )
    }

    // Check balance
    const balanceKey = {
      BTC: 'btcBalance',
      ETH: 'ethBalance',
      USDT: 'usdtBalance',
    }[cryptocurrency] as keyof typeof cryptoWallet

    const currentBalance = cryptoWallet[balanceKey] as number
    if (currentBalance < cryptoAmount) {
      return NextResponse.json(
        { success: false, error: 'Insufficient crypto balance' },
        { status: 400 }
      )
    }

    // Mock exchange rates
    const CRYPTO_RATES: Record<string, number> = {
      BTC: 0.000015,
      ETH: 0.0002,
      USDT: 0.0006,
    }

    const exchangeRate = CRYPTO_RATES[cryptocurrency] || 0
    const fiatAmount = cryptoAmount / exchangeRate

    // Create transaction
    const transaction = await prisma.cryptoTransaction.create({
      data: {
        userId: session.user.id,
        cryptoWalletId: cryptoWallet.id,
        type: 'sell',
        cryptocurrency,
        amount: cryptoAmount,
        fiatAmount,
        fiatCurrency,
        exchangeRate,
        status: 'completed',
      },
    })

    // Update balance
    const updateData: any = {}
    if (cryptocurrency === 'BTC') updateData.btcBalance = { decrement: cryptoAmount }
    if (cryptocurrency === 'ETH') updateData.ethBalance = { decrement: cryptoAmount }
    if (cryptocurrency === 'USDT') updateData.usdtBalance = { decrement: cryptoAmount }

    await prisma.cryptoWallet.update({
      where: { id: cryptoWallet.id },
      data: updateData,
    })

    logger.info('Crypto sold', {
      userId: session.user.id,
      context: {
        cryptocurrency,
        amount: cryptoAmount,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        transaction,
        fiatAmount,
        balance: (await prisma.cryptoWallet.findUnique({ where: { id: cryptoWallet.id } }))!,
      },
      message: `Successfully sold ${cryptoAmount.toFixed(8)} ${cryptocurrency} for ${fiatAmount.toFixed(2)} ${fiatCurrency}`,
    })
  } catch (error) {
    logger.error('Crypto sell error', { error })
    return NextResponse.json(
      { success: false, error: 'Failed to sell crypto' },
      { status: 500 }
    )
  }
}
