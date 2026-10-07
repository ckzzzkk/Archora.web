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
  let displayName = (user?.user_metadata?.display_name as string) ?? email.split('@')[0];

  // The tier is users.subscription_tier: the one value the app and every feature gate read, kept up to date by the Stripe
  // and store webhooks (the highest plan across both). The page used to read `subscriptions` with `.single()`, which
  // ignored that value and failed outright for anyone with two active rows.
  let tier = 'starter';
  if (user) {
    const { data: row } = await supabase
      .from('users')
      .select('subscription_tier, display_name')
      .eq('id', user.id)
      .maybeSingle();
    const t = (row as { subscription_tier?: string | null; display_name?: string | null } | null) ?? null;
    if (t?.subscription_tier) tier = t.subscription_tier;
    if (t?.display_name) displayName = t.display_name;
  }

  return (
    <AccountClient
      email={email}
      displayName={displayName}
      tier={tier}
    />
  );
}
