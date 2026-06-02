import { logger } from './logger'
import * as bitcoin from 'bitcoinjs-lib'
import ECPairFactory from 'ecpair'
import * as ecc from 'tiny-secp256k1'

const ECPair = ECPairFactory(ecc)

/**
 * Bitcoin transaction handler
 * Uses bitcoinjs-lib for real transaction creation, signing, and broadcasting
 * via Blockstream Esplora API.
 */

type BitcoinNetwork = 'mainnet' | 'testnet'

// Bitcoin RPC config
const BITCOIN_RPC = {
  mainnet: process.env.BITCOIN_MAINNET_RPC || 'https://blockstream.info/api',
  testnet: process.env.BITCOIN_TESTNET_RPC || 'https://blockstream.info/testnet/api',
}

interface BitcoinTransactionParams {
  privateKeyWIF: string // WIF-encoded private key for signing
  fromAddress: string
  toAddress: string
  amount: number // in BTC
  feeRate: number // satoshis per vB
  network: BitcoinNetwork
}

function getBitcoinNetwork(network: BitcoinNetwork): bitcoin.Network {
  return network === 'mainnet' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet
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

    // OPTIMIZED: Add 5-second timeout to prevent request hangs
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(`${rpcUrl}/address/${address}`, { signal: controller.signal })
    clearTimeout(timeout)
    
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

    // OPTIMIZED: Add 5-second timeout to prevent request hangs
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    // Use Blockchair or Mempool API for fee rates
    const res = await fetch('https://mempool.space/api/v1/fees/recommended', { signal: controller.signal })
    clearTimeout(timeout)
    
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
 * Fetch raw transaction hex for a UTXO (needed for non-segwit inputs)
 */
async function fetchRawTransaction(txid: string, network: BitcoinNetwork): Promise<string> {
  const rpcUrl = BITCOIN_RPC[network]
  const res = await fetch(`${rpcUrl}/tx/${txid}/hex`)
  if (!res.ok) throw new Error(`Failed to fetch raw tx ${txid}`)
  return res.text()
}

/**
 * Broadcast a signed raw transaction hex to the network
 */
export async function broadcastTransaction(txHex: string, network: BitcoinNetwork): Promise<string> {
  const rpcUrl = BITCOIN_RPC[network]
  const res = await fetch(`${rpcUrl}/tx`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: txHex,
  })
  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Broadcast failed: ${errorText}`)
  }
  return res.text() // returns txid
}

/**
 * Create, sign, and broadcast a Bitcoin transaction using bitcoinjs-lib.
 * Supports P2WPKH (native segwit / bech32) addresses.
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
    const { privateKeyWIF, fromAddress, toAddress, amount, feeRate, network } = params
    const btcNetwork = getBitcoinNetwork(network)

    // Validate addresses
    if (!validateBitcoinAddressFormat(fromAddress)) {
      throw new Error('Invalid sender address')
    }
    if (!validateBitcoinAddressFormat(toAddress)) {
      throw new Error('Invalid recipient address')
    }

    // Derive key pair from WIF
    const keyPair = ECPair.fromWIF(privateKeyWIF, btcNetwork)

    // Get UTXOs
    const utxos = await getBitcoinUTXOs({ address: fromAddress, network })
    if (utxos.length === 0) {
      throw new Error('No UTXOs available')
    }

    const amountSats = BigInt(Math.round(amount * 1e8))

    // Select UTXOs using simple greedy approach (largest first)
    const sorted = [...utxos].sort((a, b) => b.value - a.value)
    const selected: typeof utxos = []
    let inputSum = BigInt(0)
    for (const utxo of sorted) {
      selected.push(utxo)
      inputSum += BigInt(utxo.value)
      // Estimate tx size: ~68 bytes per input + 31 per output + 10 overhead
      const estimatedSize = selected.length * 68 + 2 * 31 + 10
      const estimatedFee = BigInt(estimatedSize * feeRate)
      if (inputSum >= amountSats + estimatedFee) break
    }

    // Final fee calculation based on actual input count
    const txSize = selected.length * 68 + 2 * 31 + 10
    const feeSats = BigInt(txSize * feeRate)
    const fee = Number(feeSats) / 1e8

    if (inputSum < amountSats + feeSats) {
      throw new Error('Insufficient balance')
    }

    const changeSats = inputSum - amountSats - feeSats

    // Build PSBT
    const psbt = new bitcoin.Psbt({ network: btcNetwork })

    // Add inputs — fetch raw tx for each UTXO
    for (const utxo of selected) {
      if (fromAddress.startsWith('bc1') || fromAddress.startsWith('tb1')) {
        // Native segwit (P2WPKH) — use witnessUtxo
        const p2wpkh = bitcoin.payments.p2wpkh({
          pubkey: Buffer.from(keyPair.publicKey),
          network: btcNetwork,
        })
        psbt.addInput({
          hash: utxo.txid,
          index: utxo.vout,
          witnessUtxo: {
            script: p2wpkh.output!,
            value: BigInt(utxo.value),
          },
        })
      } else {
        // Legacy (P2PKH / P2SH) — needs full raw transaction
        const rawHex = await fetchRawTransaction(utxo.txid, network)
        psbt.addInput({
          hash: utxo.txid,
          index: utxo.vout,
          nonWitnessUtxo: Buffer.from(rawHex, 'hex'),
        })
      }
    }

    // Add recipient output
    psbt.addOutput({
      address: toAddress,
      value: amountSats,
    })

    // Add change output (back to sender) if change is above dust (546 sats)
    if (changeSats > BigInt(546)) {
      psbt.addOutput({
        address: fromAddress,
        value: changeSats,
      })
    }

    // Sign all inputs
    for (let i = 0; i < selected.length; i++) {
      psbt.signInput(i, keyPair)
    }

    // Finalize and extract raw hex
    psbt.finalizeAllInputs()
    const txHex = psbt.extractTransaction().toHex()

    logger.info('Bitcoin transaction signed', {
      context: {
        from: fromAddress,
        to: toAddress,
        amount,
        fee,
        inputCount: selected.length,
        txSize,
      },
    })

    // Broadcast to network
    const txid = await broadcastTransaction(txHex, network)

    logger.info('Bitcoin transaction broadcast', {
      context: { txid },
    })

    return {
      hash: txid,
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
