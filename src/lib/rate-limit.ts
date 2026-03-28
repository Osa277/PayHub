/**
 * Simple in-memory rate limiter for API routes.
 * For production with multiple instances, replace with Redis-backed solution.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key)
  }
}, 60_000)

interface RateLimitConfig {
  /** Max requests allowed in the window */
  max: number
  /** Window duration in seconds */
  windowSec: number
}

export function rateLimit(key: string, config: RateLimitConfig): { success: boolean; remaining: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + config.windowSec * 1000 })
    return { success: true, remaining: config.max - 1 }
  }

  if (entry.count >= config.max) {
    return { success: false, remaining: 0 }
  }

  entry.count++
  return { success: true, remaining: config.max - entry.count }
}

/** Pre-configured limiters for common routes */
export const rateLimiters = {
  /** 3 requests per 15 minutes for forgot-password */
  forgotPassword: (ip: string) => rateLimit(`forgot:${ip}`, { max: 3, windowSec: 900 }),
  /** 5 requests per hour for signup */
  signup: (ip: string) => rateLimit(`signup:${ip}`, { max: 5, windowSec: 3600 }),
  /** 10 requests per minute for payments */
  payment: (userId: string) => rateLimit(`payment:${userId}`, { max: 10, windowSec: 60 }),
  /** 20 requests per minute for transfers */
  transfer: (userId: string) => rateLimit(`transfer:${userId}`, { max: 20, windowSec: 60 }),
  /** 5 login attempts per 15 minutes */
  login: (ip: string) => rateLimit(`login:${ip}`, { max: 5, windowSec: 900 }),
}
