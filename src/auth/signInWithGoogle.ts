/**
 * Google OAuth via openBrowserAsync.
 * Key difference from the old approach:
 * - openBrowserAsync opens a Chrome Custom Tab (same process on Android)
 * - It awaits the result (success/cancel/close) before returning
 * - No manual deep link interception needed — Supabase handles the redirect
 */
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';

export async function signInWithGoogle(): Promise<void> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'asoria://login-callback',
      skipBrowserRedirect: false,
    },
  });
  if (error) {
    throw error;
  }
  if (!data.url) {
    throw new Error('No OAuth URL returned');
  }

  // openBrowserAsync opens Chrome Custom Tab and awaits completion
  const result = await WebBrowser.openBrowserAsync(data.url, {
    toolbarColor: '#1A1A1A',
    controlsColor: '#C8C8C8',
  });

  if (result.type === 'cancel') {
    throw new Error('Sign in was cancelled');
  }
}