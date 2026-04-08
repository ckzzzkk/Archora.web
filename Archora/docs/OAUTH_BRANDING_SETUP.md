# OAuth Branding Setup Guide

**Date:** 2026-04-07  
**Purpose:** Fix OAuth consent screen to show "ASORIA" instead of Supabase project URL

---

## ✅ Completed (Code Changes)

### 1. Environment Variables Updated
**File:** `.env`

Added branding configuration:
```env
EXPO_PUBLIC_APP_NAME=ASORIA
EXPO_PUBLIC_APP_TAGLINE="Describe it. Build it. Walk through it."
EXPO_PUBLIC_APP_URL=https://asoria.app
EXPO_PUBLIC_SUPPORT_EMAIL=support@asoria.app
```

### 2. App Configuration Updated
**File:** `app.json`

- Updated display name: `"ASORIA - AI Architecture Design"`
- Added iOS `CFBundleDisplayName` and `CFBundleName`
- Added web manifest configuration
- Updated descriptions and metadata

### 3. Branding Module Created
**File:** `src/utils/branding.ts`

Centralized branding configuration for consistent usage across the app.

### 4. UI Components Updated
**Files:** 
- `src/screens/auth/WelcomeScreen.tsx` - Uses `BRAND.displayName` and `BRAND.tagline`
- `src/stores/authStore.ts` - Imports branding for OAuth

---

## 🔧 Required Manual Steps

### Step 1: Supabase Dashboard Configuration

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `harhahyurvxwnoxugehe`
3. Navigate to **Authentication** → **Providers** → **Google**
4. Update these fields:
   - **Client ID** (from Google Cloud Console - see Step 2)
   - **Client Secret** (from Google Cloud Console - see Step 2)
   - **Authorized Redirect URI**: `https://harhahyurvxwnoxugehe.supabase.co/auth/v1/callback`

5. Go to **Authentication** → **URL Configuration**
   - **Site URL**: `https://asoria.app` (or your production domain)
   - Add to **Redirect URLs**:
     - `asoria://auth/callback`
     - `https://asoria.app/auth/callback` (if using web)
     - `http://localhost:3000/auth/callback` (for local dev)

### Step 2: Google Cloud Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project linked to your Supabase OAuth
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. Configure OAuth Consent Screen:

#### App Information
| Field | Value |
|-------|-------|
| **App name** | `ASORIA` |
| **User support email** | your-email@example.com |
| **App logo** | Upload your app icon (optional) |
| **App domain** | `https://asoria.app` |
| **Application home page** | `https://asoria.app` |
| **Application privacy policy link** | `https://asoria.app/privacy` |
| **Application terms of service link** | `https://asoria.app/terms` |

#### App Domain
| Field | Value |
|-------|-------|
| **Application home page** | `https://asoria.app` |
| **Authorized domains** | `asoria.app`, `supabase.co` |

#### Developer Contact Information
| Field | Value |
|-------|-------|
| **Developer contact** | your-email@example.com |
n
5. Add Scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`

6. Add Test Users (for development):
   - Add your test email addresses

7. Go to **Credentials** → **OAuth 2.0 Client IDs**
   - Find your Web client
   - Add **Authorized redirect URIs**:
     - `https://harhahyurvxwnoxugehe.supabase.co/auth/v1/callback`
     - `asoria://auth/callback`

8. Copy the **Client ID** and **Client Secret** to Supabase Dashboard

---

## 🎨 What the User Will See

### Before Fix
```
Choose an account
to continue to harhahyurvxwnoxugehe.supabase.co
```

### After Fix
```
Choose an account
to continue to ASORIA
```

With your app logo if uploaded.

---

## 🔒 Security Considerations

1. **Never commit** `.env` files with real credentials to git
2. Keep `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` - it's safe to expose
3. Store `STRIPE_SECRET_KEY` in Supabase Vault (not in .env)
4. Use environment-specific configurations (dev/staging/prod)

---

## 🧪 Testing

After configuration, test the OAuth flow:

1. Start the app: `npx expo start`
2. Go to Welcome Screen
3. Tap "Continue with Google"
4. Verify the consent screen shows "ASORIA" not the project URL

---

## 📋 Verification Checklist

- [ ] Supabase Dashboard: Site URL set to `https://asoria.app`
- [ ] Supabase Dashboard: Redirect URLs include `asoria://auth/callback`
- [ ] Google Cloud Console: OAuth consent screen App name = "ASORIA"
- [ ] Google Cloud Console: App logo uploaded (optional)
- [ ] Google Cloud Console: Authorized domains include `asoria.app`
- [ ] Google Cloud Console: Redirect URIs include Supabase callback URL
- [ ] Client ID and Secret copied from Google Cloud to Supabase
- [ ] Test user added (for development)
- [ ] App rebuilt and tested

---

## 🐛 Troubleshooting

### Issue: Still showing project URL
**Solution:** 
- Changes may take 5-10 minutes to propagate
- Clear browser cache and retry
- Check that the OAuth consent screen is published (not in testing mode)

### Issue: "Invalid redirect URI" error
**Solution:**
- Verify redirect URI in Google Cloud Console matches exactly
- Must include `https://harhahyurvxwnoxugehe.supabase.co/auth/v1/callback`

### Issue: "App not verified" warning
**Solution:**
- This is normal for development
- For production, submit app for verification in Google Cloud Console

---

## 📚 Related Files

| File | Purpose |
|------|---------|
| `.env` | Environment variables including branding |
| `app.json` | Expo configuration with display names |
| `src/utils/branding.ts` | Centralized branding constants |
| `src/screens/auth/WelcomeScreen.tsx` | Auth UI using branding |
| `src/stores/authStore.ts` | OAuth configuration |

---

**Need help?** Contact support at support@asoria.app
