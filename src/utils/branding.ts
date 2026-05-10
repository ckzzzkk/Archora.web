/**
 * ASORIA Brand Configuration
 * Centralized branding for consistent app identity across OAuth, UI, and web
 */

export const BRAND = {
  // Core identity
  name: process.env.EXPO_PUBLIC_APP_NAME ?? 'ASORIA',
  tagline: process.env.EXPO_PUBLIC_APP_TAGLINE ?? 'Describe it. Build it. Walk through it.',
  url: process.env.EXPO_PUBLIC_APP_URL ?? 'https://asoria.app',
  supportEmail: process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? 'asoria.app@gmail.com',

  // Display variants
  displayName: 'ASORIA',
  fullName: 'ASORIA - AI Architecture Design',
  shortName: 'ASORIA',

  // OAuth / Provider display
  oauthDisplayName: 'ASORIA',
  providerName: 'ASORIA',

  // Colors (for reference)
  colors: {
    primary: '#C8C8C8',
    background: '#1A1A1A',
    surface: '#222222',
    text: '#F0EDE8',
  },

  // URLs
  urls: {
    website: 'https://asoria.app',
    pricing: 'https://asoria.app/pricing',
    support: 'https://asoria.app/contact',
    privacy: 'https://asoria.app/privacy',
    terms: 'https://asoria.app/terms',
  },

  // Social
  social: {
    twitter: 'https://x.com/Asoria_app',
    instagram: 'https://www.instagram.com/asoria.app/',
    tiktok: 'https://www.tiktok.com/@asoria.app',
    facebook: 'https://www.facebook.com/profile.php?id=61589310296162',
  },
} as const;

/**
 * Get app name for OAuth consent screens
 * Use this for any OAuth provider configuration
 */
export const getOAuthDisplayName = (): string => BRAND.oauthDisplayName;

/**
 * Get formatted sign-in text
 */
export const getSignInText = (provider: string): string => {
  return `Sign in to ${BRAND.displayName} with ${provider}`;
};

/**
 * Get consent screen description
 */
export const getConsentDescription = (): string => {
  return `${BRAND.displayName} ${BRAND.tagline.toLowerCase()}`;
};
