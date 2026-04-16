import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { Errors } from '../_shared/errors.ts';
import { getAuthUser } from '../_shared/auth.ts';
import { logAudit } from '../_shared/audit.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';
import { checkQuota } from '../_shared/quota.ts';

type SubscriptionTier = 'starter' | 'creator' | 'pro' | 'architect';

function getTierFromPriceId(priceId: string): SubscriptionTier {
  const tierMap: Record<string, SubscriptionTier> = {
    [Deno.env.get('STRIPE_PRICE_CREATOR_MONTHLY') ?? '']: 'creator',
    [Deno.env.get('STRIPE_PRICE_CREATOR_ANNUAL') ?? '']: 'creator',
    [Deno.env.get('STRIPE_PRICE_PRO_MONTHLY') ?? '']: 'pro',
    [Deno.env.get('STRIPE_PRICE_PRO_ANNUAL') ?? '']: 'pro',
    [Deno.env.get('STRIPE_PRICE_ARCHITECT_MONTHLY') ?? '']: 'architect',
    [Deno.env.get('STRIPE_PRICE_ARCHITECT_ANNUAL') ?? '']: 'architect',
  };
  return tierMap[priceId] ?? 'starter';
}

Deno.serve(async (req: Request): Promise<Response> => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') return Errors.notFound();

  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeSecretKey) {
    // Graceful fallback — no Stripe configured
    return new Response(JSON.stringify({ synced: false, reason: 'not_configured' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let user: Awaited<ReturnType<typeof getAuthUser>>;
  try {
    user = await getAuthUser(req);
  } catch (errResponse) {
    return errResponse as Response;
  }

  const rateLimitOk = await checkRateLimit(`stripe-sync:${user.id}`, 30, 3600);
  if (!rateLimitOk) return Errors.rateLimited('Rate limit exceeded');

  const quotaOk = await checkQuota(user.id, 'ai_generation');
  if (!quotaOk) {
    console.warn('[stripe-sync] Quota check failed for user:', user.id);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });

  try {
    const { data: userData } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    const customerId = (userData as { stripe_customer_id?: string } | null)?.stripe_customer_id;
    if (!customerId) {
      return new Response(JSON.stringify({ synced: false, reason: 'no_customer' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch active subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      // No active subscription — downgrade to starter
      await supabase.from('users').update({ subscription_tier: 'starter' }).eq('id', user.id);
      await supabase
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('user_id', user.id)
        .eq('status', 'active');

      return new Response(JSON.stringify({ synced: true, tier: 'starter' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sub = subscriptions.data[0];
    const priceId = sub.items.data[0]?.price.id ?? '';
    const tier = getTierFromPriceId(priceId);

    await supabase.from('users').upsert({ id: user.id, subscription_tier: tier }, { onConflict: 'id' });
    await supabase.from('subscriptions').upsert({
      user_id: user.id,
      stripe_subscription_id: sub.id,
      stripe_customer_id: customerId,
      stripe_price_id: priceId,
      tier,
      status: sub.status,
      cancel_at_period_end: sub.cancel_at_period_end,
      current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    }, { onConflict: 'stripe_subscription_id' });

    await logAudit({
      user_id: user.id,
      action: 'stripe_sync',
      resource_type: 'subscription',
      metadata: { tier, subscriptionId: sub.id },
    });

    return new Response(JSON.stringify({ synced: true, tier }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[stripe-sync]', err);
    return Errors.internal();
  }
});
