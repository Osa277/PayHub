import { logger } from './logger'

/**
 * Bitcoin transaction handler
 * Uses blockchain APIs for transaction creation and broadcasting
 */

type BitcoinNetwork = 'mainnet' | 'testnet'

// Bitcoin RPC config
const BITCOIN_RPC = {
  mainnet: process.env.BITCOIN_MAINNET_RPC || 'https://blockstream.info/api',
  testnet: process.env.BITCOIN_TESTNET_RPC || 'https://blockstream.info/testnet/api',
}

interface BitcoinTransactionParams {
  fromAddress: string
  toAddress: string
  amount: number // in BTC
  feeRate: number // satoshis per vB
  network: BitcoinNetwork
}

/**
 * Validate Bitcoin address format
 */
export function validateBitcoinAddressFormat(address: string): boolean {
  // P2PKH (starts with 1)
  if (/^1[a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) return true
  // P2SH (starts with 3)
  if (/^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) return true
  // Bech32 (starts with bc1 or tb1 for testnet)
  if (/^(bc1|tb1)[a-z0-9]{39,59}$/.test(address)) return true
  return false
}

/**
 * Get Bitcoin address balance
 */
export async function getBitcoinBalance(params: {
  address: string
  network: BitcoinNetwork
}): Promise<{
  balance: number // in BTC
  unconfirmedBalance: number // in BTC
}> {
  try {
    const { address, network } = params
    const rpcUrl = BITCOIN_RPC[network]

    const res = await fetch(`${rpcUrl}/address/${address}`)
    if (!res.ok) throw new Error('Failed to fetch address')

    const data = await res.json()

    return {
      balance: data.chain_stats.funded_txo_sum / 1e8,
      unconfirmedBalance: data.mempool_stats.funded_txo_sum / 1e8,
    }
  } catch (error) {
    logger.error('Failed to get Bitcoin balance', { error })
    throw error
  }
}

/**
 * Get current Bitcoin fee rate
 */
export async function getBitcoinFeeRate(params: {
  priority: 'fast' | 'standard' | 'slow'
  network: BitcoinNetwork
}): Promise<number> {
  try {
    const { priority } = params

    // Use Blockchair or Mempool API for fee rates
    const res = await fetch('https://mempool.space/api/v1/fees/recommended')
    if (!res.ok) throw new Error('Failed to fetch fee rates')

    const data = await res.json()

    const feeMap = {
      fast: data.fastestFee,
      standard: data.halfHourFee,
      slow: data.hourFee,
    }

    return feeMap[priority]
  } catch (error) {
    logger.error('Failed to get Bitcoin fee rate', { error })
    // Fallback rates (satoshis per vB)
    return { fast: 50, standard: 30, slow: 10 }[params.priority]
  }
}

/**
 * Get unspent outputs for address
 */
export async function getBitcoinUTXOs(params: {
  address: string
  network: BitcoinNetwork
}): Promise<
  Array<{
    txid: string
    vout: number
    value: number // in satoshis
    status: { confirmed: boolean; block_height: number }
  }>
> {
  try {
    const { address, network } = params
    const rpcUrl = BITCOIN_RPC[network]

    const res = await fetch(`${rpcUrl}/address/${address}/utxo`)
    if (!res.ok) throw new Error('Failed to fetch UTXOs')

    return await res.json()
  } catch (error) {
    logger.error('Failed to get Bitcoin UTXOs', { error })
    throw error
  }
}

/**
 * Create and broadcast a Bitcoin transaction
 * Note: In production, you'd use a library like bitcoinjs-lib with a signing service
 */
export async function createBitcoinTransaction(params: BitcoinTransactionParams): Promise<{
  hash: string
  from: string
  to: string
  amount: number
  fee: number
  status: 'pending'
}> {
  try {
    const { fromAddress, toAddress, amount, feeRate, network } = params

    // Validate addresses
    if (!validateBitcoinAddressFormat(fromAddress)) {
      throw new Error('Invalid sender address')
    }
    if (!validateBitcoinAddressFormat(toAddress)) {
      throw new Error('Invalid recipient address')
    }

    // Get UTXOs
    const utxos = await getBitcoinUTXOs({ address: fromAddress, network })
    if (utxos.length === 0) {
      throw new Error('No UTXOs available')
    }

    // Calculate fee
    const txSize = 250 // approximate bytes for typical transaction
    const fee = (feeRate * txSize) / 1e8 // convert to BTC

    // Verify sufficient balance
    const totalUTXOValue = utxos.reduce((sum, utxo) => sum + utxo.value, 0) / 1e8
    if (totalUTXOValue < amount + fee) {
      throw new Error('Insufficient balance')
    }

    logger.info('Bitcoin transaction prepared', {
      context: {
        from: fromAddress,
        to: toAddress,
        amount,
        fee,
        estimatedSize: txSize,
      },
    })

    /**
     * In production, you would:
     * 1. Use bitcoinjs-lib to create the transaction
     * 2. Sign it with the private key (should be done in a secure service)
     * 3. Broadcast it to the network
     *
     * For now, this returns a prepared transaction object
     */
    return {
      hash: `0x${Math.random().toString(16).slice(2)}`, // mock hash
      from: fromAddress,
      to: toAddress,
      amount,
      fee,
      status: 'pending',
    }
  } catch (error) {
    logger.error('Failed to create Bitcoin transaction', { error })
    throw error
  }
}

/**
 * Get Bitcoin transaction status
 */
export async function getBitcoinTransactionStatus(params: {
  hash: string
  network: BitcoinNetwork
}): Promise<{
  status: 'pending' | 'confirmed' | 'failed'
  confirmations: number
  blockHeight?: number
}> {
  try {
    const { hash, network } = params
    const rpcUrl = BITCOIN_RPC[network]

    const res = await fetch(`${rpcUrl}/tx/${hash}`)
    if (!res.ok) {
      return { status: 'pending', confirmations: 0 }
    }

    const data = await res.json()

    return {
      status: data.status.confirmed ? 'confirmed' : 'pending',
      confirmations: data.status.confirmed ? data.status.confirmations : 0,
      blockHeight: data.status.block_height,
    }
  } catch (error) {
    logger.error('Failed to get Bitcoin transaction status', { error })
    throw error
  }
}
