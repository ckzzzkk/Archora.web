import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase-server';
import AccountClient from './AccountClient';

export const metadata: Metadata = {
  title: 'Account',
  description: 'Manage your ASORIA subscription and account settings.',
};

export default async function AccountPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch profile/tier from user metadata or profiles table
  const tier = (user?.user_metadata?.tier as string) ?? 'starter';
  const email = user?.email ?? '';
  const displayName = (user?.user_metadata?.display_name as string) ?? email.split('@')[0];

  return (
    <AccountClient
      email={email}
      displayName={displayName}
      tier={tier}
    />
  );
}
