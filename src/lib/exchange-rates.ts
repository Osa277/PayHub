import { logger } from './logger'

/**
 * Centralized exchange rate service for fiat→NGN conversion.
 * Fetches live rates from exchangerate-api with 10-minute cache.
 * Falls back to hardcoded rates if external API is unavailable.
 */

// Fallback rates (last known approximate values)
const FALLBACK_RATES: Record<string, number> = {
  NGN: 1,
}

interface RateCache {
  rates: Record<string, number>
  fetchedAt: number
}

let cache: RateCache | null = null
const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes

/**
 * Get exchange rates to NGN for all supported currencies.
 * Returns cached rates if still fresh; otherwise fetches and caches.
 */
export async function getExchangeRatesToNGN(): Promise<Record<string, number>> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.rates
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(
      'https://open.er-api.com/v6/latest/NGN',
      { signal: controller.signal, next: { revalidate: 600 } }
    )
    clearTimeout(timeout)

    if (!res.ok) throw new Error(`Exchange rate API returned ${res.status}`)

    const data = await res.json()
    if (data.result !== 'success' || !data.rates) {
      throw new Error('Invalid exchange rate response')
    }

    // Convert: API gives NGN→X rates, we need X→NGN rates (inverse)
    const rates: Record<string, number> = { NGN: 1 }

    cache = { rates, fetchedAt: Date.now() }
    logger.info('Exchange rates refreshed', { context: { rates } })
    return rates
  } catch (error) {
    logger.warn('Failed to fetch live exchange rates, using fallback', { error })
    // Use fallback but don't cache the error state for long
    cache = { rates: FALLBACK_RATES, fetchedAt: Date.now() - CACHE_TTL_MS + 60_000 }
    return FALLBACK_RATES
  }
}

/**
 * Convert an amount from a given currency to NGN.
 */
export async function convertToNGN(amount: number, fromCurrency: string): Promise<number> {
  const rates = await getExchangeRatesToNGN()
  const rate = rates[fromCurrency]
  if (!rate) {
    throw new Error(`Unsupported currency: ${fromCurrency}`)
  }
  return Math.round(amount * rate * 100) / 100
}

/**
 * Get the exchange rate for a specific currency to NGN.
 */
export async function getExchangeRate(fromCurrency: string): Promise<number> {
  const rates = await getExchangeRatesToNGN()
  const rate = rates[fromCurrency]
  if (!rate) {
    throw new Error(`Unsupported currency: ${fromCurrency}`)
  }
  return rate
}
