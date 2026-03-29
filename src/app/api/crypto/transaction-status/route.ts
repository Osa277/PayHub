import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { getTransactionStatus as getEthTxStatus } from '@/lib/wallet-manager'
import { getBitcoinTransactionStatus } from '@/lib/bitcoin-handler'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const transactionId = searchParams.get('id')

    if (!transactionId) {
      return NextResponse.json({ success: false, error: 'Transaction ID required' }, { status: 400 })
    }

    // Get transaction from database
    const transaction = await prisma.cryptoTransaction.findUnique({
      where: { id: transactionId },
      include: { cryptoWallet: true },
    })

    if (!transaction || transaction.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 })
    }

    if (!transaction.transactionHash) {
      return NextResponse.json({
        success: true,
        data: {
          id: transaction.id,
          status: transaction.status,
          confirmations: 0,
          message: 'Transaction not yet broadcast to blockchain',
        },
      })
    }

    const isTestnet = process.env.BLOCKCHAIN_TESTNET === 'true'
    const network = isTestnet ? 'testnet' : 'mainnet'

    let blockchainStatus = { status: 'pending' as const, confirmations: 0 }

    try {
      if (transaction.cryptocurrency === 'BTC') {
        blockchainStatus = await getBitcoinTransactionStatus({
          hash: transaction.transactionHash,
          network: network as 'mainnet' | 'testnet',
        })
      } else if (transaction.cryptocurrency === 'ETH' || transaction.cryptocurrency === 'USDT') {
        blockchainStatus = await getEthTxStatus({
          hash: transaction.transactionHash,
          network: network as 'mainnet' | 'testnet',
        })
      }
    } catch (error) {
      logger.warn('Failed to fetch blockchain status', { error, transactionHash: transaction.transactionHash })
    }

    // Update transaction status if confirmed
    if (blockchainStatus.status === 'confirmed' && transaction.status === 'pending') {
      await prisma.cryptoTransaction.update({
        where: { id: transactionId },
        data: { status: 'completed' },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: transaction.id,
        type: transaction.type,
        cryptocurrency: transaction.cryptocurrency,
        amount: transaction.amount,
        fee: transaction.fee,
        status: blockchainStatus.status,
        confirmations: blockchainStatus.confirmations,
        blockchainHash: transaction.transactionHash,
        createdAt: transaction.createdAt,
      },
    })
  } catch (error) {
    logger.error('Transaction status check error', { error })
    return NextResponse.json({ success: false, error: 'Failed to check status' }, { status: 500 })
  }
}
