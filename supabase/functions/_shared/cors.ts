// CORS + security headers shared by every edge function.
//
// This is a Bearer-token API (auth is sent in the Authorization header, never
// cookies), so a wildcard origin is safe and correct:
//   - CORS does not gate who can call the API (any server/curl can); it only
//     controls whether a browser lets cross-origin JS READ the response.
//   - With no cookies, there is nothing for a malicious origin to ride on, so
//     `*` exposes nothing extra.
// `Access-Control-Allow-Credentials` is intentionally NOT set: it is unnecessary
// without cookies and is invalid in combination with a wildcard origin.
//
// NOTE: the previous version assigned a FUNCTION to `Access-Control-Allow-Origin`,
// which serialized to an invalid header value and broke CORS for every web client
// (mobile was unaffected). If strict per-origin allow-listing is ever needed,
// compute the origin per-request and pass it into each response (a wildcard cannot
// be narrowed from a single shared static object).
export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

// Alias — some functions import securityHeaders
export const securityHeaders = corsHeaders;

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  return null;
}
