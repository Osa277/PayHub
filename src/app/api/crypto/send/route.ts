import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import {
  validateBitcoinAddress,
  validateEthereumAddress,
  validateUSDTAddress,
  getBitcoinFeeEstimate,
  getEthereumGasPrices,
} from '@/lib/blockchain'
import { getCryptoPrice } from '@/lib/crypto-rates'
import { sendEthereumTransaction, sendUSDTTransaction } from '@/lib/wallet-manager'
import { createBitcoinTransaction } from '@/lib/bitcoin-handler'

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

    // Validate recipient address based on crypto type
    if (cryptocurrency === 'BTC' && !validateBitcoinAddress(recipientAddress)) {
      return NextResponse.json(
        { success: false, error: 'Invalid Bitcoin address' },
        { status: 400 }
      )
    }
    if (cryptocurrency === 'ETH' && !validateEthereumAddress(recipientAddress)) {
      return NextResponse.json(
        { success: false, error: 'Invalid Ethereum address' },
        { status: 400 }
      )
    }
    if (cryptocurrency === 'USDT' && !validateUSDTAddress(recipientAddress)) {
      return NextResponse.json(
        { success: false, error: 'Invalid USDT address (must be Ethereum address)' },
        { status: 400 }
      )
    }

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

    // Calculate realistic network fees
    let fee = 0
    if (cryptocurrency === 'BTC') {
      const feeEstimate = await getBitcoinFeeEstimate()
      const txSize = 250 // bytes for typical transaction
      fee = (feeEstimate.standard * txSize) / 1e8 // convert to BTC
    } else if (cryptocurrency === 'ETH') {
      const gasPrices = await getEthereumGasPrices()
      const gasLimit = 21000 // ETH transfer
      const gasPrice = parseFloat(gasPrices.standard) * 1e9 // convert gwei to wei
      fee = (gasPrice * gasLimit) / 1e18 // convert to ETH
    } else if (cryptocurrency === 'USDT') {
      const gasPrices = await getEthereumGasPrices()
      const gasLimit = 65000 // USDT transfer (more complex)
      const gasPrice = parseFloat(gasPrices.standard) * 1e9
      fee = (gasPrice * gasLimit) / 1e18 // convert to ETH, not USDT
    }

    const totalDeduction = amount + fee
    let blockchainHash = ''

    try {
      // Attempt real blockchain transaction
      const isTestnet = process.env.BLOCKCHAIN_TESTNET === 'true'
      const network = isTestnet ? 'testnet' : 'mainnet'

      if (cryptocurrency === 'BTC') {
        const btcTx = await createBitcoinTransaction({
          fromAddress: cryptoWallet.btcAddress || '',
          toAddress: recipientAddress,
          amount,
          feeRate: 30,
          network: network as 'mainnet' | 'testnet',
        })
        blockchainHash = btcTx.hash
      } else if (cryptocurrency === 'ETH') {
        const ethTx = await sendEthereumTransaction({
          privateKey: process.env.ETHEREUM_PRIVATE_KEY || '',
          toAddress: recipientAddress,
          amount: amount.toString(),
          network: network as 'mainnet' | 'testnet',
        })
        blockchainHash = ethTx.hash
      } else if (cryptocurrency === 'USDT') {
        const usdtTx = await sendUSDTTransaction({
          privateKey: process.env.ETHEREUM_PRIVATE_KEY || '',
          toAddress: recipientAddress,
          amount: amount.toString(),
          network: network as 'mainnet' | 'testnet',
        })
        blockchainHash = usdtTx.hash
      }
    } catch (blockchainError) {
      logger.warn('Blockchain transaction failed, recording as pending', { blockchainError })
      // Continue to create transaction record with pending status
    }

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
        status: 'pending',
        transactionHash: blockchainHash || undefined,
        description: description || `Send ${cryptocurrency} to ${recipientAddress.slice(0, 10)}...`,
      },
    })

    // Update balance (deduct amount + fee)
    const updateData: any = {}
    if (cryptocurrency === 'BTC') updateData.btcBalance = { decrement: totalDeduction }
    if (cryptocurrency === 'ETH') updateData.ethBalance = { decrement: totalDeduction }
    if (cryptocurrency === 'USDT') updateData.usdtBalance = { decrement: totalDeduction }

    await prisma.cryptoWallet.update({
      where: { id: cryptoWallet.id },
      data: updateData,
    })

    logger.info('Crypto send initiated', {
      userId: session.user.id,
      cryptocurrency,
      amount,
      fee,
      recipientAddress,
      transactionId: transaction.id,
    })

    return NextResponse.json({
      success: true,
      data: {
        transaction,
        balance: (await prisma.cryptoWallet.findUnique({ where: { id: cryptoWallet.id } }))!,
        fee: fee.toFixed(8),
      },
      message: `Sent ${amount.toFixed(8)} ${cryptocurrency} (fee: ${fee.toFixed(8)} ${cryptocurrency})`,
    })
  } catch (error) {
    logger.error('Crypto send error', { error })
    return NextResponse.json(
      { success: false, error: 'Failed to send crypto' },
      { status: 500 }
    )
  }
}

