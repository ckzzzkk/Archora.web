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

  const email = user?.email ?? '';
  const displayName = (user?.user_metadata?.display_name as string) ?? email.split('@')[0];

  // Get current subscription tier from subscriptions table
  let tier = 'starter';
  if (user) {
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();
    tier = subData?.tier ?? 'starter';
  }

  return (
    <AccountClient
      email={email}
      displayName={displayName}
      tier={tier}
    />
  );
}
