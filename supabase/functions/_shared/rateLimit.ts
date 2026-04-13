export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const upstashUrl = Deno.env.get('UPSTASH_REDIS_REST_URL');
  const upstashToken = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');

  if (!upstashUrl || !upstashToken) {
    // Fail open — rate limiting is a guard, not a gate.
    // If Redis isn't configured (e.g. local dev), allow the request through.
    console.warn('[rateLimit] Redis not configured — skipping rate limit for:', identifier);
    return true;
  }

  const key = `rate_limit:${identifier}`;

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
}
