// DEPRECATED: Crypto payment provider removed (Paystack-only version)
// This file is intentionally left blank after crypto removal.

export type CryptoId = 'BTC' | 'ETH' | 'USDT'

export const SUPPORTED_CRYPTOS: CryptoId[] = []
export const NOWPAYMENTS_IPN_SECRET = ''

export async function createCryptoPayment() {
  throw new Error('Crypto features are deprecated')
}

export async function convertUsdToCrypto() {
  throw new Error('Crypto features are deprecated')
}

export function formatCryptoAmount() {
  throw new Error('Crypto features are deprecated')
}

export function mapNowPaymentsStatus() {
  throw new Error('Crypto features are deprecated')
}
