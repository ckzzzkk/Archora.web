import { Platform } from 'react-native';
import Purchases, { type CustomerInfo, type PurchasesOffering } from 'react-native-purchases';
import { entitlementToTier } from '../utils/iapProducts';
import type { SubscriptionTier } from '../types';

let configured = false;

/** Configure the RC SDK once at app start. Safe to call when keys are absent. */
export function configureRevenueCat(): void {
  if (configured) return;
  const apiKey = Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
  }) ?? '';
  if (!apiKey) {
    console.warn('[revenuecat] No API key for platform — IAP disabled in this build');
    return;
  }
  Purchases.configure({ apiKey });
  configured = true;
}

/** Associate purchases with the signed-in Supabase user. */
export async function loginRevenueCat(userId: string): Promise<void> {
  if (!configured) configureRevenueCat();
  if (!configured) return;
  try {
    await Purchases.logIn(userId);
  } catch (e) {
    console.warn('[revenuecat] logIn failed:', e);
  }
}

/** Detach the RC identity on sign-out. */
export async function logoutRevenueCat(): Promise<void> {
  if (!configured) return;
  try {
    await Purchases.logOut();
  } catch (e) {
    console.warn('[revenuecat] logOut failed:', e);
  }
}

/** Derive the effective tier from a CustomerInfo's active entitlements. */
export function getCurrentTierFromCustomerInfo(info: CustomerInfo): SubscriptionTier {
  return entitlementToTier(Object.keys(info.entitlements.active));
}

/** Fetch the current default offering (packages to display). */
export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  if (!configured) configureRevenueCat();
  if (!configured) return null;
  const offerings = await Purchases.getOfferings();
  return offerings.current ?? null;
}
