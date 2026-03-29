import { logger } from './logger'

// Types for blockchain
export interface BlockchainTransaction {
  hash: string
  from: string
  to: string
  amount: string
  fee: string
  status: 'pending' | 'confirmed' | 'failed'
  confirmations: number
  timestamp: number
}

// Validate Bitcoin addresses
export function validateBitcoinAddress(address: string): boolean {
  // P2PKH (starts with 1)
  if (/^1[a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) return true
  // P2SH (starts with 3)
  if (/^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) return true
  // Bech32 (starts with bc1)
  if (/^bc1[a-z0-9]{39,59}$/.test(address)) return true
  return false
}

// Validate Ethereum addresses
export function validateEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

// Validate USDT address (same as Ethereum)
export function validateUSDTAddress(address: string): boolean {
  return validateEthereumAddress(address)
}

// Get Bitcoin transaction fee estimate
export async function getBitcoinFeeEstimate(): Promise<{
  fast: number // satoshis/vB
  standard: number
  slow: number
}> {
  try {
    const response = await fetch('https://btcbook.gitlab.io/api/feerates')
    if (!response.ok) throw new Error('Fee estimate failed')

    const data = await response.json()
    return {
      fast: Math.round(data.fast),
      standard: Math.round(data.standard),
      slow: Math.round(data.slow),
    }
  } catch (error) {
    logger.error('Bitcoin fee estimate error', { error })
    // Fallback rates
    return { fast: 50, standard: 30, slow: 10 }
  }
}

// Get Ethereum gas prices
export async function getEthereumGasPrices(): Promise<{
  standard: string // gwei
  fast: string
  slow: string
}> {
  try {
    const response = await fetch('https://api.etherscan.io/api?module=gastracker&action=gasoracle')
    if (!response.ok) throw new Error('Gas price fetch failed')

    const data = await response.json()
    return {
      slow: data.result.SafeGasPrice,
      standard: data.result.ProposeGasPrice,
      fast: data.result.FastGasPrice,
    }
  } catch (error) {
    logger.error('Ethereum gas price error', { error })
    // Fallback rates (gwei)
    return { slow: '20', standard: '40', fast: '60' }
  }
}

// Format address for display
export function formatAddress(address: string): string {
  if (address.length <= 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// Mock transaction simulation (replace with real blockchain calls)
export async function simulateTransaction(params: {
  from: string
  to: string
  amount: string
  crypto: 'BTC' | 'ETH' | 'USDT'
}): Promise<BlockchainTransaction> {
  const { from, to, amount, crypto } = params

  // Validate addresses based on crypto type
  if (crypto === 'BTC' && !validateBitcoinAddress(to)) {
    throw new Error('Invalid Bitcoin address')
  }
  if ((crypto === 'ETH' || crypto === 'USDT') && !validateEthereumAddress(to)) {
    throw new Error('Invalid Ethereum address')
  }

  // Calculate realistic fees
  let fee = '0'
  if (crypto === 'BTC') {
    const feeRate = 30 // satoshis/vB
    const txSize = 250 // bytes
    fee = String((feeRate * txSize) / 1e8) // convert to BTC
  } else if (crypto === 'ETH' || crypto === 'USDT') {
    const gasPrice = 40e9 // 40 gwei in wei
    const gasLimit = crypto === 'ETH' ? 21000 : 65000 // ETH: 21k, USDT: ~65k
    fee = String((gasPrice * gasLimit) / 1e18) // convert to ETH
  }

  return {
    hash: `0x${Math.random().toString(16).slice(2)}`, // mock hash
    from,
    to,
    amount,
    fee,
    status: 'pending',
    confirmations: 0,
    timestamp: Date.now(),
  }
}
