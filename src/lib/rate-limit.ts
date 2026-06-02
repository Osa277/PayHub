import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

/**
 * Rate limiter for Next.js — production-ready with Upstash Redis.
 *
 * When UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set,
 * uses Upstash Redis sliding window (works across all serverless instances).
 *
 * Falls back to in-memory store for local development when Redis is not configured.
 */

// ─── Redis client (lazy singleton) ───

const isRedisConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
)

let redis: Redis | null = null
function getRedis(): Redis {
  if (!redis) {
    redis = Redis.fromEnv()
  }
  return redis
}

// ─── In-memory fallback for local dev ───

interface MemoryEntry {
  count: number
  resetTime: number
}
const memoryStore: Record<string, MemoryEntry> = {}

function memoryRateLimit(key: string, maxRequests: number, windowMs: number): { success: boolean; remaining: number } {
  const now = Date.now()
  const entry = memoryStore[key]

  if (!entry || entry.resetTime < now) {
    memoryStore[key] = { count: 1, resetTime: now + windowMs }
    return { success: true, remaining: maxRequests - 1 }
  }

  entry.count++
  const remaining = Math.max(0, maxRequests - entry.count)
  return { success: entry.count <= maxRequests, remaining }
}

// ─── Upstash rate limiter cache (reuse instances) ───

const limiterCache = new Map<string, Ratelimit>()

function getUpstashLimiter(prefix: string, maxRequests: number, windowSec: number): Ratelimit {
  const cacheKey = `${prefix}:${maxRequests}:${windowSec}`
  let limiter = limiterCache.get(cacheKey)
  if (!limiter) {
    limiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(maxRequests, `${windowSec} s`),
      prefix: `ratelimit:${prefix}`,
    })
    limiterCache.set(cacheKey, limiter)
  }
  return limiter
}

// ─── Public API ───

export interface RateLimitOptions {
  interval?: number // Time window in ms (default: 60000)
  maxRequests?: number // Max requests per interval (default: 10)
  keyGenerator?: (req: NextRequest) => string // Custom key (default: IP)
}

/**
 * Rate limit middleware — drop-in replacement, same signature.
 * Returns true if the request should be blocked (rate limited).
 */
export async function rateLimitMiddleware(
  req: NextRequest,
  options: RateLimitOptions = {}
): Promise<boolean> {
  const { interval = 60000, maxRequests = 10, keyGenerator } = options
  const key = keyGenerator ? keyGenerator(req) : req.ip || req.headers.get('x-forwarded-for') || 'unknown'

  if (isRedisConfigured) {
    const windowSec = Math.ceil(interval / 1000)
    const limiter = getUpstashLimiter('middleware', maxRequests, windowSec)
    const { success } = await limiter.limit(key)
    return !success // true = blocked
  }

  // In-memory fallback
  const { success } = memoryRateLimit(`middleware:${key}`, maxRequests, interval)
  return !success
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
        'X-RateLimit-Remaining': '0',
      },
    }
  )
}

// ─── Legacy rateLimiters object ───

type LegacyResult = { success: boolean }

function createLegacyLimiter(
  prefix: string,
  maxRequests: number,
  windowMs: number
): (identifier: string) => LegacyResult {
  return (identifier: string): LegacyResult => {
    if (isRedisConfigured) {
      // For the legacy sync API, we fire-and-forget the Redis call
      // and use the in-memory store as an immediate check.
      // This keeps the interface synchronous while still tracking in Redis.
      const limiter = getUpstashLimiter(prefix, maxRequests, Math.ceil(windowMs / 1000))
      limiter.limit(identifier).catch(() => {
        // Swallow errors — Redis failures should not break auth
      })
    }
    return memoryRateLimit(`${prefix}:${identifier}`, maxRequests, windowMs)
  }
}

export const rateLimiters = {
  login: createLegacyLimiter('login', 5, 900_000),           // 5 per 15 min
  forgotPassword: createLegacyLimiter('forgot-password', 3, 900_000), // 3 per 15 min
  signup: createLegacyLimiter('signup', 5, 3_600_000),       // 5 per hour
  payment: createLegacyLimiter('payment', 10, 60_000),       // 10 per min
  transfer: createLegacyLimiter('transfer', 5, 60_000),      // 5 per min
}

