import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import { logger } from '@/lib/logger'

/**
 * Testnet utilities for development
 * Only enabled when BLOCKCHAIN_TESTNET=true
 * Generates real wallets using ethers.js
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

export async function GET(req: NextRequest) {
  // Only allow in testnet mode
  if (process.env.BLOCKCHAIN_TESTNET !== 'true') {
    return NextResponse.json(
      { success: false, error: 'Testnet utilities not available in production' },
      { status: 403 }
    )
  }

  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')

  if (action === 'get-config') {
    return getConfig()
  } else if (action === 'verify-setup') {
    return verifySetup()
  }

  return NextResponse.json(
    { success: false, error: 'Unknown action' },
    { status: 400 }
  )
}

/**
 * Generate a real test wallet using ethers.js
 * Returns: address, private key, and mnemonic seed phrase
 */
async function generateWallet() {
  try {
    // Generate random wallet (ethers.js uses secure crypto)
    const wallet = ethers.Wallet.createRandom()

    logger.info('Test wallet generated', {
      context: {
        address: wallet.address,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic?.phrase,
        network: 'Sepolia (Testnet)',
        instructions: [
          '✅ Real Ethereum testnet wallet created',
          '',
          '📋 Setup Steps:',
          '1. Copy your PRIVATE KEY above',
          '2. Edit your .env file',
          '3. Add: ETHEREUM_PRIVATE_KEY="' + wallet.privateKey + '"',
          '4. Get free Sepolia ETH from: https://sepoliafaucet.com',
          '5. Enter your address above',
          '6. Restart dev server: npm run dev',
          '7. Go to Crypto page and test transactions!',
          '',
          '⚠️ SECURITY:',
          '- Never share your private key',
          '- This is testnet only (test ETH has no value)',
          '- If lost, just generate a new wallet',
        ],
      },
      message: 'Testnet wallet generated successfully! 🎉',
    })
  } catch (error) {
    logger.error('Wallet generation failed', { context: { error: (error as Error).message } })
    return NextResponse.json(
      { success: false, error: 'Failed to generate wallet' },
      { status: 500 }
    )
  }
}

/**
 * Verify blockchain configuration completeness
 */
async function verifySetup() {
  try {
    const isTestnet = process.env.BLOCKCHAIN_TESTNET === 'true'
    const hasInfuraKey = !!process.env.INFURA_API_KEY
    const hasPrivateKey = !!process.env.ETHEREUM_PRIVATE_KEY &&
                           process.env.ETHEREUM_PRIVATE_KEY !== '0x0000000000000000000000000000000000000000000000000000000000000000'

    // Build RPC URL with Infura key if available
    let rpcUrl = process.env.ETHEREUM_RPC_URL
    if (!rpcUrl && hasInfuraKey && isTestnet) {
      rpcUrl = `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`
    }

    // Test RPC connection
    let rpcStatus = 'not-configured'
    let rpcError = ''

    if (rpcUrl) {
      try {
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_chainId',
            params: [],
            id: 1,
          }),
        })

        if (response.ok) {
          // Sepolia chain ID is 0xaa36a7 (11155111)
          rpcStatus = 'connected'
        } else {
          rpcStatus = 'error'
          rpcError = `HTTP ${response.status}`
        }
      } catch (error) {
        rpcStatus = 'error'
        rpcError = (error as Error).message
      }
    }

    // Validate private key format if set
    let privateKeyValid = false
    if (hasPrivateKey && process.env.ETHEREUM_PRIVATE_KEY) {
      try {
        new ethers.Wallet(process.env.ETHEREUM_PRIVATE_KEY)
        privateKeyValid = true
      } catch {
        privateKeyValid = false
      }
    }

    const readyForTransactions = isTestnet && hasInfuraKey && hasPrivateKey && privateKeyValid && rpcStatus === 'connected'

    return NextResponse.json({
      success: true,
      data: {
        blockchain: {
          testnetMode: isTestnet,
          network: isTestnet ? 'Sepolia' : 'Mainnet',
          rpcProvider: rpcStatus,
          privateKey: hasPrivateKey ? (privateKeyValid ? 'valid' : 'invalid') : 'not-configured',
        },
        chains: {
          ethereum: {
            enabled: rpcStatus === 'connected',
            testnet: isTestnet,
            rpcStatus,
          },
        },
        allConfigured: readyForTransactions,
        status: readyForTransactions ? 'ready' : 'incomplete',
        nextSteps: readyForTransactions
          ? [
              '✅ Setup complete!',
              'Your testnet is ready for ETH and USDT transactions',
              'Get Sepolia ETH: https://sepoliafaucet.com',
              'Then start testing on the Crypto page',
            ]
          : [
              ...(isTestnet ? [] : ['⚠️ Not in testnet mode (BLOCKCHAIN_TESTNET=true)']),
              ...(hasInfuraKey ? [] : ['❌ Missing INFURA_API_KEY']),
              ...(hasPrivateKey
                ? privateKeyValid
                  ? []
                  : ['❌ Invalid private key format']
                : ['❌ Missing ETHEREUM_PRIVATE_KEY']),
              ...(rpcStatus === 'connected' ? [] : [`❌ RPC connection failed: ${rpcError}`]),
              '',
              '📖 See /TESTNET_SETUP_GUIDE.md for detailed setup instructions',
            ],
      },
      rpcError: rpcError || undefined,
    })
  } catch (error) {
    logger.error('Setup verification failed', { context: { error: (error as Error).message } })
    return NextResponse.json(
      { success: false, error: 'Failed to verify setup' },
      { status: 500 }
    )
  }
}

/**
 * Get current configuration (sanitized for frontend)
 */
async function getConfig() {
  try {
    const isTestnet = process.env.BLOCKCHAIN_TESTNET === 'true'
    const hasPrivateKey = !!process.env.ETHEREUM_PRIVATE_KEY &&
                           process.env.ETHEREUM_PRIVATE_KEY !== '0x0000000000000000000000000000000000000000000000000000000000000000'

    return NextResponse.json({
      success: true,
      data: {
        blockchain: {
          testnetMode: isTestnet,
          network: isTestnet ? 'Sepolia (Testnet)' : 'Ethereum (Mainnet)',
          rpcProvider: process.env.ETHEREUM_RPC_URL ? 'configured' : 'not-configured',
          privateKey: hasPrivateKey ? 'configured' : 'not-configured',
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          nextAuthUrl: process.env.NEXTAUTH_URL,
        },
        chains: {
          ethereum: {
            enabled: isTestnet,
            testnet: isTestnet,
            network: isTestnet ? 'Sepolia' : 'Mainnet',
          },
        },
      },
      message: 'Configuration loaded',
    })
  } catch (error) {
    logger.error('Config retrieval failed', { context: { error: (error as Error).message } })
    return NextResponse.json(
      { success: false, error: 'Failed to get configuration' },
      { status: 500 }
    )
  }
}
