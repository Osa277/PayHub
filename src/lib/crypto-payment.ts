/**
 * Crypto payment provider — NOWPayments integration.
 * Supports BTC, ETH, USDT, USDC with real payment creation,
 * amount conversion, and payment status tracking via NOWPayments API.
 *
 * Get your API key at: https://nowpayments.io
 * Sandbox: https://sandbox.nowpayments.io
 */

import { logger } from '@/lib/logger'

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY || ''
const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET || ''
const NOWPAYMENTS_BASE_URL = process.env.NOWPAYMENTS_SANDBOX === 'true'
  ? 'https://api-sandbox.nowpayments.io/v1'
  : 'https://api.nowpayments.io/v1'

const isConfigured = Boolean(NOWPAYMENTS_API_KEY)

export { NOWPAYMENTS_IPN_SECRET }

export const SUPPORTED_CRYPTOS = [
  { id: 'btc', name: 'Bitcoin', icon: '₿', network: 'Bitcoin', color: '#F7931A' },
  { id: 'eth', name: 'Ethereum', icon: 'Ξ', network: 'Ethereum (ERC-20)', color: '#627EEA' },
  { id: 'usdttrc20', name: 'Tether (TRC-20)', icon: '₮', network: 'Tron (TRC-20)', color: '#26A17B' },
  { id: 'usdcerc20', name: 'USD Coin', icon: '$', network: 'Ethereum (ERC-20)', color: '#2775CA' },
] as const

export type CryptoId = (typeof SUPPORTED_CRYPTOS)[number]['id']

export interface CryptoPaymentRequest {
  amountUsd: number
  cryptoCurrency: CryptoId
  userId: string
  recipientEmail?: string
  description?: string
}

export interface CryptoPaymentSession {
  id: string
  paymentId: number | null
  walletAddress: string
  cryptoAmount: number
  cryptoCurrency: CryptoId
  amountUsd: number
  exchangeRate: number
  network: string
  status: 'awaiting_payment' | 'confirming' | 'completed' | 'expired' | 'failed'
  expiresAt: Date
  createdAt: Date
}

/** Call the NOWPayments API */
async function nowPaymentsRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${NOWPAYMENTS_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'x-api-key': NOWPAYMENTS_API_KEY,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.text()
    logger.error('NOWPayments API error', { context: { status: res.status, body, endpoint } })
    throw new Error(`NOWPayments API error: ${res.status}`)
  }

  return res.json() as Promise<T>
}

/**
 * Get the estimated price for a crypto amount from NOWPayments.
 */
export async function convertUsdToCrypto(
  amountUsd: number,
  crypto: CryptoId
): Promise<{ cryptoAmount: number; rate: number }> {
  if (!isConfigured) {
    // Fallback demo rates when API key not set
    const demoRates: Record<string, number> = { btc: 67500, eth: 3450, usdttrc20: 1, usdcerc20: 1 }
    const rate = demoRates[crypto] || 1
    return { cryptoAmount: parseFloat((amountUsd / rate).toFixed(8)), rate }
  }

  const data = await nowPaymentsRequest<{ estimated_amount: number }>(
    `/estimate?amount=${amountUsd}&currency_from=usd&currency_to=${crypto}`
  )

  const cryptoAmount = data.estimated_amount
  const rate = amountUsd / cryptoAmount

  return { cryptoAmount: parseFloat(cryptoAmount.toFixed(8)), rate: parseFloat(rate.toFixed(2)) }
}

/**
 * Get the current exchange rate for a crypto via NOWPayments.
 */
export async function getCryptoRate(crypto: CryptoId): Promise<number> {
  const { rate } = await convertUsdToCrypto(1, crypto)
  return rate
}

/**
 * Create a crypto payment via NOWPayments API.
 * Returns a payment session with a real wallet address and exact amount.
 */
export async function createCryptoPayment(request: CryptoPaymentRequest): Promise<CryptoPaymentSession> {
  const { amountUsd, cryptoCurrency } = request
  const cryptoInfo = SUPPORTED_CRYPTOS.find((c) => c.id === cryptoCurrency)!

  if (!isConfigured) {
    // Demo mode fallback
    logger.warn('NOWPayments not configured — using demo mode')
    const { cryptoAmount, rate } = await convertUsdToCrypto(amountUsd, cryptoCurrency)
    return {
      id: `demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      paymentId: null,
      walletAddress: 'DEMO_MODE_NO_REAL_ADDRESS',
      cryptoAmount,
      cryptoCurrency,
      amountUsd,
      exchangeRate: rate,
      network: cryptoInfo.network,
      status: 'awaiting_payment',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      createdAt: new Date(),
    }
  }

  // Create real payment via NOWPayments
  const callbackUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/nowpayments`
  const orderDescription = request.description || 'PayHub crypto payment'

  const paymentData = await nowPaymentsRequest<{
    payment_id: number
    payment_status: string
    pay_address: string
    pay_amount: number
    pay_currency: string
    price_amount: number
    price_currency: string
    order_id: string
    order_description: string
    created_at: string
    expiration_estimate_date: string
  }>('/payment', {
    method: 'POST',
    body: JSON.stringify({
      price_amount: amountUsd,
      price_currency: 'usd',
      pay_currency: cryptoCurrency,
      ipn_callback_url: callbackUrl,
      order_id: `${request.userId}_${Date.now()}`,
      order_description: orderDescription,
    }),
  })

  const rate = amountUsd / paymentData.pay_amount

  return {
    id: paymentData.order_id,
    paymentId: paymentData.payment_id,
    walletAddress: paymentData.pay_address,
    cryptoAmount: paymentData.pay_amount,
    cryptoCurrency,
    amountUsd,
    exchangeRate: parseFloat(rate.toFixed(2)),
    network: cryptoInfo.network,
    status: 'awaiting_payment',
    expiresAt: new Date(paymentData.expiration_estimate_date),
    createdAt: new Date(paymentData.created_at),
  }
}

/**
 * Check payment status via NOWPayments API.
 */
export async function checkCryptoPaymentStatus(paymentId: number): Promise<string> {
  if (!isConfigured) return 'waiting'

  const data = await nowPaymentsRequest<{ payment_status: string }>(
    `/payment/${paymentId}`
  )
  return data.payment_status
}

/**
 * Map NOWPayments status to our internal status.
 */
export function mapNowPaymentsStatus(
  npStatus: string
): 'awaiting_payment' | 'confirming' | 'completed' | 'expired' | 'failed' {
  switch (npStatus) {
    case 'waiting':
      return 'awaiting_payment'
    case 'confirming':
    case 'sending':
      return 'confirming'
    case 'confirmed':
    case 'finished':
      return 'completed'
    case 'expired':
      return 'expired'
    case 'failed':
    case 'refunded':
      return 'failed'
    default:
      return 'awaiting_payment'
  }
}

/**
 * Format a crypto amount for display.
 */
export function formatCryptoAmount(amount: number, crypto: CryptoId): string {
  const decimals = crypto === 'btc' ? 8 : crypto === 'eth' ? 6 : 2
  return `${amount.toFixed(decimals)} ${crypto.toUpperCase()}`
}
