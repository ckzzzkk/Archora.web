export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const upstashUrl = Deno.env.get('UPSTASH_REDIS_REST_URL');
  const upstashToken = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');

  if (!upstashUrl || !upstashToken) {
    console.error('[rateLimit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set — blocking request');
    return false; // fail closed: no Redis = no access
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
    console.error('[rateLimit] Upstash Redis request failed:', response.status, '— blocking request');
    return false; // fail closed: Redis unreachable = no access
  }

  const results = await response.json() as Array<{ result: number }>;
  return results[0].result <= limit;
}
