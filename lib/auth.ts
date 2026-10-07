/**
 * Only ever redirect to a path ON THIS SITE. `?redirect=` comes from the URL, so accepting any value let a crafted login
 * link send a signed-in user to another domain (an open redirect). Absolute URLs, protocol-relative ("//evil.com") and
 * backslash tricks all fall back.
 */
export function safeRedirect(value: string | null | undefined, fallback = '/account'): string {
  if (!value || typeof value !== 'string') return fallback;
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback;
  if (/[\u0000-\u001f]/.test(value)) return fallback;
  return value;
}

/** OAuth providers the app offers that the site can also offer. Apple needs its provider configured in Supabase first. */
export const APPLE_LOGIN_ENABLED = process.env.NEXT_PUBLIC_ENABLE_APPLE_LOGIN === 'true';
