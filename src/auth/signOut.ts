import { supabase } from '../lib/supabase';
import { Storage } from '../utils/storage';

export async function signOut(): Promise<void> {
  // Preserve privacy acceptance before clearing MMKV
  const privacyAccepted = Storage.getString('privacyPolicyAccepted');

  // Sign out from Supabase — clears AsyncStorage tokens automatically
  await supabase.auth.signOut();

  // Clear MMKV (non-token) storage but keep privacy acceptance
  Storage.clearAll();
  if (privacyAccepted) {
    Storage.set('privacyPolicyAccepted', privacyAccepted);
  }
}