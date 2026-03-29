import { logger } from './logger'

interface CoinData {
  [key: string]: {
    usd: number
    ngn: number
    eur: number
    gbp: number
    cad: number
  }
}

// Cache exchange rates for 5 minutes
let rateCache: { data: CoinData; timestamp: number } | null = null
const CACHE_DURATION = 5 * 60 * 1000

async function fetchFromCoinGecko(): Promise<CoinData> {
  try {
    const url = new URL('https://api.coingecko.com/api/v3/simple/price')
    url.searchParams.append('ids', 'bitcoin,ethereum,tether')
    url.searchParams.append('vs_currencies', 'usd,ngn,eur,gbp,cad')

    const response = await fetch(url.toString())
    if (!response.ok) throw new Error('CoinGecko API error')

    const data = await response.json()
    return {
      bitcoin: data.bitcoin,
      ethereum: data.ethereum,
      tether: data.tether,
    }
  } catch (error) {
    logger.error('CoinGecko fetch error', { error })
    // Fallback to mock rates if API fails
    return {
      bitcoin: { usd: 67000, ngn: 104000000, eur: 60000, gbp: 52000, cad: 90000 },
      ethereum: { usd: 3500, ngn: 5425000, eur: 3150, gbp: 2800, cad: 4725 },
      tether: { usd: 1, ngn: 1550, eur: 0.92, gbp: 0.79, cad: 1.36 },
    }
  }
}

export async function getExchangeRates() {
  const now = Date.now()

  // Return cached rates if fresh
  if (rateCache && now - rateCache.timestamp < CACHE_DURATION) {
    return rateCache.data
  }

  // Fetch new rates
  const data = await fetchFromCoinGecko()
  rateCache = { data, timestamp: now }

  logger.info('Exchange rates updated', {
    context: {
      timestamp: now,
    },
  })
  return data
}

export async function getCryptoPrice(
  crypto: 'BTC' | 'ETH' | 'USDT',
  currency: 'usd' | 'ngn' | 'eur' | 'gbp' | 'cad' = 'usd'
) {
  const rates = await getExchangeRates()

  const cryptoMap = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    USDT: 'tether',
  }

  const key = cryptoMap[crypto] as keyof typeof rates
  const price = rates[key]?.[currency as keyof typeof rates.bitcoin]

  if (!price) {
    throw new Error(`Price not found for ${crypto} in ${currency}`)
  }

  return price
}

export async function convertCryptoToFiat(
  amount: number,
  crypto: 'BTC' | 'ETH' | 'USDT',
  fiatCurrency: 'usd' | 'ngn' | 'eur' | 'gbp' | 'cad' = 'usd'
) {
  const price = await getCryptoPrice(crypto, fiatCurrency)
  return amount * price
}

export async function convertFiatToCrypto(
  amount: number,
  crypto: 'BTC' | 'ETH' | 'USDT',
  fiatCurrency: 'usd' | 'ngn' | 'eur' | 'gbp' | 'cad' = 'usd'
) {
  const price = await getCryptoPrice(crypto, fiatCurrency)
  return amount / price
}
