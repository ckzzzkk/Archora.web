import { supabase } from '../utils/supabaseClient';

export const authService = {
  async uploadAvatar(userId: string, uri: string): Promise<string | null> {
    const path = `${userId}/avatar.jpg`;
    const response = await fetch(uri);
    const blob = await response.blob();
    const { error } = await supabase.storage.from('avatars').upload(path, blob, {
      upsert: true,
      contentType: 'image/jpeg',
    });
    if (error) return null;
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return data.publicUrl;
  },

  async exportUserData(): Promise<{ error: Error | null }> {
    const { error } = await supabase.functions.invoke('export-user-data');
    return { error: error ?? null };
  },

  async deleteAccount(): Promise<{ error: Error | null }> {
    const { error } = await supabase.functions.invoke('delete-account');
    return { error: error ?? null };
  },

  async getStripePortalUrl(): Promise<{ url: string | null; error: Error | null }> {
    const { data, error } = await supabase.functions.invoke('stripe-portal');
    if (error || !data?.url) {
      return { url: null, error: error ?? new Error('No URL returned') };
    }
    return { url: data.url as string, error: null };
  },
};
