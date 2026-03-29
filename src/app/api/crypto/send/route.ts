import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const sendSchema = z.object({
  cryptocurrency: z.enum(['BTC', 'ETH', 'USDT']),
  amount: z.number().positive('Amount must be greater than 0'),
  recipientAddress: z.string().min(20, 'Invalid recipient address'),
  description: z.string().optional(),
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
    const parsed = sendSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { cryptocurrency, amount, recipientAddress, description } = parsed.data

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

    if (cryptoWallet[balanceKey] < amount) {
      return NextResponse.json(
        { success: false, error: 'Insufficient crypto balance' },
        { status: 400 }
      )
    }

    // Mock transaction fee
    const fee = amount * 0.001 // 0.1% fee
    const totalDeduction = amount + fee

    // Create transaction
    const transaction = await prisma.cryptoTransaction.create({
      data: {
        userId: session.user.id,
        cryptoWalletId: cryptoWallet.id,
        type: 'send',
        cryptocurrency,
        amount,
        toAddress: recipientAddress,
        fee,
        status: 'pending', // Would wait for blockchain confirmation
        description: description || `Send ${cryptocurrency} to ${recipientAddress.slice(0, 10)}...`,
      },
    })

    // Update balance
    const updateData: any = {}
    if (cryptocurrency === 'BTC') updateData.btcBalance = { decrement: totalDeduction }
    if (cryptocurrency === 'ETH') updateData.ethBalance = { decrement: totalDeduction }
    if (cryptocurrency === 'USDT') updateData.usdtBalance = { decrement: totalDeduction }

    await prisma.cryptoWallet.update({
      where: { id: cryptoWallet.id },
      data: updateData,
    })

    logger.info('Crypto sent', { userId: session.user.id, cryptocurrency, amount, recipientAddress })

    return NextResponse.json({
      success: true,
      data: {
        transaction,
        balance: (await prisma.cryptoWallet.findUnique({ where: { id: cryptoWallet.id } }))!,
      },
      message: `Successfully sent ${amount.toFixed(8)} ${cryptocurrency}`,
    })
  } catch (error) {
    logger.error('Crypto send error', { error })
    return NextResponse.json(
      { success: false, error: 'Failed to send crypto' },
      { status: 500 }
    )
  }
}
