const isProduction = Deno.env.get('APP_ENV') === 'production';

// Production allows: web app, mobile deep link, and subdomains
// Development allows all origins for testing
const allowedOrigins = isProduction
  ? ['https://asoria.app', 'asoria://']
  : ['*'];

function getCorsOrigin(origin: string | null): string {
  if (!isProduction) return '*';
  if (!origin) return 'null';
  // Allow exact matches
  if (allowedOrigins.includes(origin)) return origin;
  // Allow subdomain matches for the main app
  if (origin.endsWith('.asoria.app') || origin === 'https://asoria.app') return origin;
  return 'null'; // Reject unknown origins in production
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': getCorsOrigin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self' https://asoria.app",
};

// Alias — all new functions should import securityHeaders
export const securityHeaders = corsHeaders;

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('origin');
    const responseHeaders = {
      ...corsHeaders,
      'Access-Control-Allow-Origin': getCorsOrigin(origin),
    };
    return new Response('ok', { headers: responseHeaders });
  }
  return null;
}
