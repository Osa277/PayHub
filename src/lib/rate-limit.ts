import { NextRequest, NextResponse } from 'next/server'

/**
 * Simple in-memory rate limiter for Next.js
 * Tracks requests by IP or user ID
 */

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number }
}

const store: RateLimitStore = {}

/**
 * Clean up expired entries
 */
setInterval(() => {
  const now = Date.now()
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  }
}, 60000) // Clean every minute

export interface RateLimitOptions {
  interval?: number // Time window in ms (default: 60s)
  maxRequests?: number // Max requests per interval (default: 10)
  keyGenerator?: (req: NextRequest) => string // Custom key (default: IP)
}

/**
 * Rate limit middleware
 * Usage: if (await rateLimitMiddleware(req, options)) return TooManyRequests
 */
export async function rateLimitMiddleware(
  req: NextRequest,
  options: RateLimitOptions = {}
): Promise<boolean> {
  const { interval = 60000, maxRequests = 10, keyGenerator } = options

  // Generate rate limit key (IP address by default)
  const key = keyGenerator ? keyGenerator(req) : req.ip || 'unknown'

  const now = Date.now()
  const entry = store[key]

  if (!entry) {
    // First request in window
    store[key] = { count: 1, resetTime: now + interval }
    return false // Not rate limited
  }

  if (entry.resetTime < now) {
    // Window expired, reset
    store[key] = { count: 1, resetTime: now + interval }
    return false // Not rate limited
  }

  // Within window
  entry.count++
  return entry.count > maxRequests // Rate limited if over limit
}

/**
 * Create rate limit response
 */
export function rateLimitResponse(retryAfter: number = 60) {
  return NextResponse.json(
    {
      success: false,
      error: 'Too many requests. Please try again later.',
      retryAfter,
    },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': '0',
      },
    }
  )
}

// ─── Backward Compatibility (Legacy API) ───

/**
 * Legacy rate limiters object for backward compatibility
 * Old endpoints use this API
 */
export const rateLimiters = {
  forgotPassword: (ip: string) => {
    const key = `forgot-password:${ip}`
    const now = Date.now()
    const entry = store[key]

    if (!entry) {
      store[key] = { count: 1, resetTime: now + 900000 } // 15 min window
      return { success: true }
    }

    if (entry.resetTime < now) {
      store[key] = { count: 1, resetTime: now + 900000 }
      return { success: true }
    }

    entry.count++
    return { success: entry.count <= 3 } // Max 3 per 15 min
  },

  signup: (ip: string) => {
    const key = `signup:${ip}`
    const now = Date.now()
    const entry = store[key]

    if (!entry) {
      store[key] = { count: 1, resetTime: now + 3600000 } // 1 hour window
      return { success: true }
    }

    if (entry.resetTime < now) {
      store[key] = { count: 1, resetTime: now + 3600000 }
      return { success: true }
    }

    entry.count++
    return { success: entry.count <= 5 } // Max 5 per hour
  },

  payment: (ip: string) => {
    const key = `payment:${ip}`
    const now = Date.now()
    const entry = store[key]

    if (!entry) {
      store[key] = { count: 1, resetTime: now + 60000 } // 1 min window
      return { success: true }
    }

    if (entry.resetTime < now) {
      store[key] = { count: 1, resetTime: now + 60000 }
      return { success: true }
    }

    entry.count++
    return { success: entry.count <= 10 } // Max 10 per min
  },

  transfer: (ip: string) => {
    const key = `transfer:${ip}`
    const now = Date.now()
    const entry = store[key]

    if (!entry) {
      store[key] = { count: 1, resetTime: now + 60000 } // 1 min window
      return { success: true }
    }

    if (entry.resetTime < now) {
      store[key] = { count: 1, resetTime: now + 60000 }
      return { success: true }
    }

    entry.count++
    return { success: entry.count <= 5 } // Max 5 per min
  },
}

