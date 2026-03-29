import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { logger } from '@/lib/logger'

/**
 * Testnet utilities for development
 * Only enabled when BLOCKCHAIN_TESTNET=true
 */

export async function POST(req: NextRequest) {
  // Only allow in testnet mode
  if (process.env.BLOCKCHAIN_TESTNET !== 'true') {
    return NextResponse.json(
      { success: false, error: 'Testnet utilities not available in production' },
      { status: 403 }
    )
  }

  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')

  if (action === 'generate-wallet') {
    return generateWallet()
  } else if (action === 'verify-setup') {
    return verifySetup()
  } else if (action === 'get-config') {
    return getConfig()
  }

  return NextResponse.json(
    { success: false, error: 'Unknown action' },
    { status: 400 }
  )
}

/**
 * Generate a random test wallet
 */
async function generateWallet() {
  try {
    const privateKey = '0x' + crypto.randomBytes(32).toString('hex')

    // Simple address generation (mock for testnet)
    const addressHash = crypto.createHash('sha256').update(privateKey).digest('hex')
    const address = '0x' + addressHash.slice(0, 40)

    logger.info('Test wallet generated')

    return NextResponse.json({
      success: true,
      data: {
        privateKey,
        address,
        instructions: [
          '1. Copy the privateKey above',
          '2. Add to .env: ETHEREUM_PRIVATE_KEY="' + privateKey + '"',
          '3. Get testnet ETH: https://sepoliafaucet.com',
          '4. Paste your address: ' + address,
          '5. Restart dev server: npm run dev',
        ],
      },
      message: 'Test wallet generated. Never share the private key!',
    })
  } catch (error) {
    logger.error('Wallet generation failed', { error })
    return NextResponse.json(
      { success: false, error: 'Failed to generate wallet' },
      { status: 500 }
    )
  }
}

/**
 * Verify blockchain configuration
 */
async function verifySetup() {
  try {
    const checks = {
      testnetEnabled: process.env.BLOCKCHAIN_TESTNET === 'true',
      ethereumRpcUrl: !!process.env.ETHEREUM_RPC_URL,
      infrauraApiKey: !!process.env.INFURA_API_KEY,
      privateKeyConfigured: !!process.env.ETHEREUM_PRIVATE_KEY,
      bitcoinTestnetRpc: !!process.env.BITCOIN_TESTNET_RPC,
    }

    const allConfigured = Object.values(checks).every(v => v === true)

    // Test RPC connection
    let rpcStatus = 'not-tested'
    try {
      if (process.env.ETHEREUM_RPC_URL) {
        const response = await fetch(process.env.ETHEREUM_RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_chainId',
            params: [],
            id: 1,
          }),
        })
        rpcStatus = response.ok ? 'connected' : 'failed'
      }
    } catch (error) {
      rpcStatus = 'error'
    }

    return NextResponse.json({
      success: true,
      data: {
        configuration: checks,
        rpcConnection: rpcStatus,
        allConfigured,
        nextSteps: allConfigured
          ? ['✅ Setup complete! Start testing on http://localhost:3000']
          : [
              '❌ Missing configuration',
              'Follow TESTNET_SETUP_GUIDE.md to complete setup',
            ],
      },
    })
  } catch (error) {
    logger.error('Setup verification failed', { error })
    return NextResponse.json(
      { success: false, error: 'Failed to verify setup' },
      { status: 500 }
    )
  }
}

/**
 * Get current configuration (sanitized)
 */
async function getConfig() {
  try {
    return NextResponse.json({
      success: true,
      data: {
        blockchain: {
          testnetMode: process.env.BLOCKCHAIN_TESTNET === 'true',
          network: process.env.BLOCKCHAIN_NETWORK || 'ethereum',
          rpcProvider: process.env.ETHEREUM_RPC_URL ? 'configured' : 'not-configured',
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          nextAuthUrl: process.env.NEXTAUTH_URL,
        },
        chains: {
          ethereum: {
            enabled: !!process.env.ETHEREUM_RPC_URL,
            testnet: process.env.BLOCKCHAIN_TESTNET === 'true',
          },
          bitcoin: {
            enabled: !!process.env.BITCOIN_TESTNET_RPC,
            testnet: true,
          },
        },
      },
      message: 'Configuration loaded from environment',
    })
  } catch (error) {
    logger.error('Config retrieval failed', { error })
    return NextResponse.json(
      { success: false, error: 'Failed to get configuration' },
      { status: 500 }
    )
  }
}
