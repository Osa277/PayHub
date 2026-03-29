import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { createEthereumWallet } from '@/lib/wallet-manager'
import crypto from 'crypto'

const createWalletSchema = z.object({
  name: z.string().min(1, 'Wallet name required').max(50),
  cryptocurrency: z.enum(['BTC', 'ETH', 'USDT']).optional().default('ETH'),
  privateKey: z.string().optional(), // For importing
  mnemonic: z.string().optional(), // For importing
})

const updateWalletSchema = z.object({
  name: z.string().optional(),
  isActive: z.boolean().optional(),
})

/**
 * Encrypt sensitive data (AES-256-GCM)
 */
function encryptData(data: string, key: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    Buffer.from(key.slice(0, 32).padEnd(32, '0')),
    iv
  )
  let encrypted = cipher.update(data, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${encrypted}:${tag.toString('hex')}`
}

/**
 * Decrypt sensitive data
 */
function decryptData(encrypted: string, key: string): string {
  const [ivHex, encryptedHex, tagHex] = encrypted.split(':')
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(key.slice(0, 32).padEnd(32, '0')),
    Buffer.from(ivHex, 'hex')
  )
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const wallets = await prisma.blockchainWallet.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
        cryptocurrency: true,
        address: true,
        isActive: true,
        isViewOnly: true,
        source: true,
        createdAt: true,
      },
      orderBy: { isActive: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: wallets,
    })
  } catch (error) {
    logger.error('Wallet list error', { context: { error: (error as Error).message } })
    return NextResponse.json({ success: false, error: 'Failed to fetch wallets' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = createWalletSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { name, cryptocurrency, privateKey, mnemonic } = parsed.data
    let walletData: any

    // Generate new wallet or import existing
    if (privateKey) {
      // Import existing wallet
      try {
        walletData = createEthereumWallet({ network: 'testnet', privateKey })
      } catch (error) {
        return NextResponse.json({ success: false, error: 'Invalid private key format' }, { status: 400 })
      }
    } else if (mnemonic) {
      // Import from seed phrase
      try {
        walletData = createEthereumWallet({ network: 'testnet', mnemonic })
      } catch (error) {
        return NextResponse.json({ success: false, error: 'Invalid seed phrase' }, { status: 400 })
      }
    } else {
      // Generate random wallet
      walletData = createEthereumWallet({ network: 'testnet' })
    }

    // Check if address already exists
    const existing = await prisma.blockchainWallet.findFirst({
      where: { userId: session.user.id, address: walletData.address },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'This wallet address is already imported' },
        { status: 400 }
      )
    }

    // Deactivate other wallets if this is the first one being imported
    const walletCount = await prisma.blockchainWallet.count({
      where: { userId: session.user.id },
    })

    const encryptionKey = session.user.id // Using userId as key (should use actual secret in production)

    // Create wallet record with encrypted private key
    const wallet = await prisma.blockchainWallet.create({
      data: {
        userId: session.user.id,
        name,
        cryptocurrency,
        address: walletData.address,
        encryptedPrivateKey: walletData.privateKey ? encryptData(walletData.privateKey, encryptionKey) : null,
        encryptedMnemonic: walletData.mnemonic ? encryptData(walletData.mnemonic, encryptionKey) : null,
        isActive: walletCount === 0, // First wallet is active by default
        isViewOnly: !walletData.privateKey,
        source: privateKey || mnemonic ? 'imported' : 'generated',
      },
      select: {
        id: true,
        name: true,
        cryptocurrency: true,
        address: true,
        isActive: true,
        isViewOnly: true,
        source: true,
        createdAt: true,
      },
    })

    logger.info('Blockchain wallet created', {
      userId: session.user.id,
      context: {
        walletId: wallet.id,
        name: wallet.name,
        cryptocurrency: wallet.cryptocurrency,
      },
    })

    return NextResponse.json({
      success: true,
      data: wallet,
      message: `${cryptocurrency} wallet "${name}" created successfully`,
    })
  } catch (error) {
    logger.error('Wallet creation error', { context: { error: (error as Error).message } })
    return NextResponse.json({ success: false, error: 'Failed to create wallet' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const walletId = searchParams.get('id')
    if (!walletId) {
      return NextResponse.json({ success: false, error: 'Wallet ID required' }, { status: 400 })
    }

    const body = await req.json()
    const parsed = updateWalletSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { name, isActive } = parsed.data

    // Verify wallet belongs to user
    const wallet = await prisma.blockchainWallet.findFirst({
      where: { id: walletId, userId: session.user.id },
    })

    if (!wallet) {
      return NextResponse.json({ success: false, error: 'Wallet not found' }, { status: 404 })
    }

    // If setting as active, deactivate others
    if (isActive === true) {
      await prisma.blockchainWallet.updateMany({
        where: { userId: session.user.id, id: { not: walletId } },
        data: { isActive: false },
      })
    }

    const updated = await prisma.blockchainWallet.update({
      where: { id: walletId },
      data: {
        ...(name && { name }),
        ...(isActive !== undefined && { isActive }),
      },
      select: {
        id: true,
        name: true,
        cryptocurrency: true,
        address: true,
        isActive: true,
        isViewOnly: true,
        source: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Wallet updated successfully',
    })
  } catch (error) {
    logger.error('Wallet update error', { context: { error: (error as Error).message } })
    return NextResponse.json({ success: false, error: 'Failed to update wallet' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const walletId = searchParams.get('id')
    if (!walletId) {
      return NextResponse.json({ success: false, error: 'Wallet ID required' }, { status: 400 })
    }

    // Verify wallet belongs to user
    const wallet = await prisma.blockchainWallet.findFirst({
      where: { id: walletId, userId: session.user.id },
    })

    if (!wallet) {
      return NextResponse.json({ success: false, error: 'Wallet not found' }, { status: 404 })
    }

    // Don't allow deletion of last wallet
    const walletCount = await prisma.blockchainWallet.count({
      where: { userId: session.user.id },
    })

    if (walletCount === 1) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete your only wallet' },
        { status: 400 }
      )
    }

    await prisma.blockchainWallet.delete({
      where: { id: walletId },
    })

    // If deleted wallet was active, activate another one
    if (wallet.isActive) {
      const nextWallet = await prisma.blockchainWallet.findFirst({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'asc' },
      })
      if (nextWallet) {
        await prisma.blockchainWallet.update({
          where: { id: nextWallet.id },
          data: { isActive: true },
        })
      }
    }

    logger.info('Blockchain wallet deleted', {
      userId: session.user.id,
      context: { walletId },
    })

    return NextResponse.json({
      success: true,
      message: 'Wallet deleted successfully',
    })
  } catch (error) {
    logger.error('Wallet deletion error', { context: { error: (error as Error).message } })
    return NextResponse.json({ success: false, error: 'Failed to delete wallet' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const walletId = searchParams.get('id')
    const action = searchParams.get('action')

    if (!walletId) {
      return NextResponse.json({ success: false, error: 'Wallet ID required' }, { status: 400 })
    }

    // Verify wallet belongs to user
    const wallet = await prisma.blockchainWallet.findFirst({
      where: { id: walletId, userId: session.user.id },
    })

    if (!wallet) {
      return NextResponse.json({ success: false, error: 'Wallet not found' }, { status: 404 })
    }

    // Get private key action
    if (action === 'get-private-key') {
      if (wallet.isViewOnly || !wallet.encryptedPrivateKey) {
        return NextResponse.json(
          { success: false, error: 'This wallet does not have a private key' },
          { status: 400 }
        )
      }

      const encryptionKey = session.user.id
      try {
        const privateKey = decryptData(wallet.encryptedPrivateKey, encryptionKey)
        return NextResponse.json({
          success: true,
          data: { privateKey },
          message: '⚠️ Keep this private key secure and never share it!',
        })
      } catch {
        return NextResponse.json({ success: false, error: 'Failed to decrypt private key' }, { status: 500 })
      }
    }

    // Get mnemonic action
    if (action === 'get-mnemonic') {
      if (!wallet.encryptedMnemonic) {
        return NextResponse.json(
          { success: false, error: 'This wallet does not have a seed phrase' },
          { status: 400 }
        )
      }

      const encryptionKey = session.user.id
      try {
        const mnemonic = decryptData(wallet.encryptedMnemonic, encryptionKey)
        return NextResponse.json({
          success: true,
          data: { mnemonic },
          message: '⚠️ Keep this seed phrase secure and never share it!',
        })
      } catch {
        return NextResponse.json({ success: false, error: 'Failed to decrypt seed phrase' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    logger.error('Wallet action error', { context: { error: (error as Error).message } })
    return NextResponse.json({ success: false, error: 'Failed to perform wallet action' }, { status: 500 })
  }
}
