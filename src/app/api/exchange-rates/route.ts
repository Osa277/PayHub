import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse, ExchangeRate } from '@/types'

// Fallback rates used when the live API is unreachable
const FALLBACK_RATES: Record<string, Record<string, number>> = {
  USD: { EUR: 0.92, GBP: 0.79, JPY: 157.5, AUD: 1.52, CAD: 1.36, CHF: 0.88, CNY: 7.24, INR: 83.12 },
  EUR: { USD: 1.09, GBP: 0.86, JPY: 171.2, AUD: 1.65, CAD: 1.48, CHF: 0.96, CNY: 7.88, INR: 90.35 },
  GBP: { USD: 1.27, EUR: 1.16, JPY: 199.0, AUD: 1.92, CAD: 1.72, CHF: 1.12, CNY: 9.16, INR: 105.0 },
}

// Simple in-memory cache (key → { rate, expiry })
const cache = new Map<string, { rate: number; expiry: number }>()
const CACHE_TTL = 600_000 // 10 minutes

export async function GET(req: NextRequest) {
  try {
    const from = req.nextUrl.searchParams.get('from') || 'USD'
    const to = req.nextUrl.searchParams.get('to') || 'EUR'

    if (from === to) {
      return NextResponse.json({
        success: true,
        data: { from, to, rate: 1, timestamp: new Date() },
      } as ApiResponse<ExchangeRate>)
    }

    const cacheKey = `${from}_${to}`
    const cached = cache.get(cacheKey)
    if (cached && cached.expiry > Date.now()) {
      return NextResponse.json({
        success: true,
        data: { from, to, rate: cached.rate, timestamp: new Date() },
      } as ApiResponse<ExchangeRate>)
    }

    // Try live API (frankfurter.app — free, no key required)
    let rate: number | null = null
    try {
      const res = await fetch(
        `https://api.frankfurter.app/latest?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        { signal: AbortSignal.timeout(3000) }
      )
      if (res.ok) {
        const data = await res.json()
        rate = data.rates?.[to] ?? null
      }
    } catch {
      // Live API unreachable — fall through to fallback
    }

    // Fallback to static rates
    if (rate === null) {
      rate = FALLBACK_RATES[from]?.[to] || 1
    }

    cache.set(cacheKey, { rate, expiry: Date.now() + CACHE_TTL })

    return NextResponse.json({
      success: true,
      data: { from, to, rate, timestamp: new Date() },
    } as ApiResponse<ExchangeRate>)
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as ApiResponse<null>,
      { status: 500 }
    )
  }
}
