export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const upstashUrl = Deno.env.get('UPSTASH_REDIS_REST_URL');
  const upstashToken = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');

  if (!upstashUrl || !upstashToken) {
    console.warn('Rate limiting not configured — Upstash Redis credentials missing');
    return true; // fail open until configured
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

  if (!response.ok) return true; // fail open

  const results = await response.json() as Array<{ result: number }>;
  return results[0].result <= limit;
}
