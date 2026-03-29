import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { convertFiatToCrypto, getCryptoPrice } from '@/lib/crypto-rates'

const buySchema = z.object({
  cryptocurrency: z.enum(['BTC', 'ETH', 'USDT']),
  fiatAmount: z.number().positive('Amount must be greater than 0'),
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
    const parsed = buySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { cryptocurrency, fiatAmount, fiatCurrency } = parsed.data

    // Get real exchange rate from CoinGecko
    const exchangeRate = await getCryptoPrice(
      cryptocurrency,
      fiatCurrency.toLowerCase() as any
    )
    const cryptoAmount = await convertFiatToCrypto(
      fiatAmount,
      cryptocurrency,
      fiatCurrency.toLowerCase() as any
    )

    // Check if user has crypto wallet
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

    // Create transaction
    const transaction = await prisma.cryptoTransaction.create({
      data: {
        userId: session.user.id,
        cryptoWalletId: cryptoWallet.id,
        type: 'buy',
        cryptocurrency,
        amount: cryptoAmount,
        fiatAmount,
        fiatCurrency,
        exchangeRate,
        status: 'completed',
      },
    })

    // Update crypto wallet balance
    const updateData: any = {}
    if (cryptocurrency === 'BTC') updateData.btcBalance = { increment: cryptoAmount }
    if (cryptocurrency === 'ETH') updateData.ethBalance = { increment: cryptoAmount }
    if (cryptocurrency === 'USDT') updateData.usdtBalance = { increment: cryptoAmount }

    await prisma.cryptoWallet.update({
      where: { id: cryptoWallet.id },
      data: updateData,
    })

    logger.info('Crypto bought', {
      userId: session.user.id,
      cryptocurrency,
      amount: cryptoAmount,
      fiatAmount,
      exchangeRate,
    })

    return NextResponse.json({
      success: true,
      data: {
        transaction,
        balance: (await prisma.cryptoWallet.findUnique({ where: { id: cryptoWallet.id } }))!,
        exchangeRate,
      },
      message: `Successfully bought ${cryptoAmount.toFixed(8)} ${cryptocurrency} at ${exchangeRate.toFixed(2)} ${fiatCurrency}/${cryptocurrency}`,
    })
  } catch (error) {
    logger.error('Crypto buy error', { error })
    return NextResponse.json(
      { success: false, error: 'Failed to buy crypto' },
      { status: 500 }
    )
  }
}

