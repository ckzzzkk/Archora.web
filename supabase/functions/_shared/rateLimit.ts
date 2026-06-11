import { Errors } from './errors.ts';

/**
 * Preferred entry point: returns a ready-to-send 429 Response when the caller
 * is over the limit, or null when the request is allowed. Unlike the boolean
 * checkRateLimit, this cannot be accidentally inverted at the call site:
 *
 *   const limited = await requireRateLimit(`key:${user.id}`, 10, 3600);
 *   if (limited) return limited;
 */
export async function requireRateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number,
  message = 'Too many requests',
): Promise<Response | null> {
  const allowed = await checkRateLimit(identifier, limit, windowSeconds);
  return allowed ? null : Errors.rateLimited(message);
}

/** Returns true when the request is ALLOWED (fails open if Redis is down). */
export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  // trim(): a secret stored with a stray trailing space/newline must not
  // produce an invalid URL (this 500'd every rate-limited endpoint once).
  const upstashUrl = Deno.env.get('UPSTASH_REDIS_REST_URL')?.trim();
  const upstashToken = Deno.env.get('UPSTASH_REDIS_REST_TOKEN')?.trim();

  if (!upstashUrl || !upstashToken) {
    // Fail open — rate limiting is a guard, not a gate.
    // If Redis isn't configured (e.g. local dev), allow the request through.
    console.warn('[rateLimit] Redis not configured — skipping rate limit for:', identifier);
    return true;
  }

  const key = `rate_limit:${identifier}`;

  try {
    const response = await fetch(`${upstashUrl}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${upstashToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, windowSeconds],
      ]),
    });

    if (!response.ok) {
      // Fail open — don't block user requests if Redis is temporarily unavailable.
      console.warn('[rateLimit] Redis request failed:', response.status, '— skipping limit for:', identifier);
      return true;
    }

    const results = await response.json() as Array<{ result: number }>;
    return results[0].result <= limit;
  } catch (err) {
    // Fail open on network errors / malformed URLs — a broken Redis config
    // must degrade to "no rate limiting", never to a 500 on every endpoint.
    console.warn('[rateLimit] Redis unreachable —', err instanceof Error ? err.message : err, '— skipping limit for:', identifier);
    return true;
  }
}
