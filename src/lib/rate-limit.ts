import { NextRequest } from 'next/server'
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible'

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number }
}

const store: RateLimitStore = {}

export function rateLimit(
  request: NextRequest,
  limit: number = 100,
  windowMs: number = 60000,
): { success: boolean; remaining: number } {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const key = `${ip}`
  const now = Date.now()

  if (!store[key]) {
    store[key] = { count: 1, resetTime: now + windowMs }
    return { success: true, remaining: limit - 1 }
  }

  const record = store[key]

  if (now > record.resetTime) {
    record.count = 1
    record.resetTime = now + windowMs
    return { success: true, remaining: limit - 1 }
  }

  record.count++

  if (record.count > limit) {
    return { success: false, remaining: 0 }
  }

  return { success: true, remaining: limit - record.count }
}

export function getRateLimitHeaders(remaining: number, limit: number) {
  return {
    'RateLimit-Limit': limit.toString(),
    'RateLimit-Remaining': remaining.toString(),
    'RateLimit-Reset': new Date(Date.now() + 60000).toISOString(),
  }
}

function isRateLimiterRes(err: unknown): err is RateLimiterRes {
  return (
    typeof err === 'object' &&
    err !== null &&
    'msBeforeNext' in err &&
    typeof (err as RateLimiterRes).msBeforeNext === 'number'
  )
}

const AUTH_RATE_LIMIT_POINTS = parseInt(process.env.AUTH_RATE_LIMIT_POINTS ?? '10', 10)
const AUTH_RATE_LIMIT_DURATION_SECONDS = parseInt(
  process.env.AUTH_RATE_LIMIT_DURATION_SECONDS ?? String(15 * 60),
  10,
)

const signInFailureLimiter = new RateLimiterMemory({
  points: AUTH_RATE_LIMIT_POINTS,
  duration: AUTH_RATE_LIMIT_DURATION_SECONDS,
})

const registrationLimiter = new RateLimiterMemory({
  points: AUTH_RATE_LIMIT_POINTS,
  duration: AUTH_RATE_LIMIT_DURATION_SECONDS,
})

export async function isSignInRateLimited(
  ip: string,
): Promise<{ limited: boolean; retryAfter?: number }> {
  try {
    const res = await signInFailureLimiter.get(ip)
    if (res !== null && res.remainingPoints <= 0) {
      return { limited: true, retryAfter: Math.ceil(res.msBeforeNext / 1000) }
    }
    return { limited: false }
  } catch {
    return { limited: false }
  }
}

export async function recordSignInFailure(ip: string): Promise<void> {
  try {
    await signInFailureLimiter.consume(ip)
  } catch (err: unknown) {
    if (!isRateLimiterRes(err)) {
      throw err
    }
  }
}

export async function checkAuthRateLimit(
  request: NextRequest,
): Promise<{ limited: boolean; retryAfter?: number }> {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'

  try {
    await registrationLimiter.consume(ip)
    return { limited: false }
  } catch (err: unknown) {
    if (isRateLimiterRes(err)) {
      return { limited: true, retryAfter: Math.ceil(err.msBeforeNext / 1000) }
    }
    throw err
  }
}
