/**
 * In-memory sliding-window rate limiter.
 * Works per server instance (sufficient for most deployments).
 * For multi-instance / edge deployments, swap the store for Redis / Upstash.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// key → { count, resetAt }
const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  Array.from(store.entries()).forEach(([key, entry]) => {
    if (entry.resetAt < now) store.delete(key)
  })
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  /** Max requests allowed within the window */
  limit: number
  /** Window duration in seconds */
  windowSecs: number
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number   // unix ms
  retryAfterSecs: number
}

/**
 * Check rate limit for a given key (e.g. userId or IP).
 *
 * @example
 * const result = checkRateLimit(`ai-tutor:${userId}`, { limit: 20, windowSecs: 60 })
 * if (!result.success) return new Response('Too Many Requests', { status: 429 })
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const windowMs = config.windowSecs * 1000

  const entry = store.get(key)

  // Window expired or first request — reset
  if (!entry || entry.resetAt < now) {
    const resetAt = now + windowMs
    store.set(key, { count: 1, resetAt })
    return {
      success: true,
      remaining: config.limit - 1,
      resetAt,
      retryAfterSecs: 0,
    }
  }

  // Within window
  if (entry.count >= config.limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfterSecs: Math.ceil((entry.resetAt - now) / 1000),
    }
  }

  entry.count++
  return {
    success: true,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
    retryAfterSecs: 0,
  }
}

/**
 * Build standard rate-limit response headers.
 */
export function rateLimitHeaders(result: RateLimitResult, limit: number): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
    ...(result.retryAfterSecs > 0 && { 'Retry-After': String(result.retryAfterSecs) }),
  }
}
