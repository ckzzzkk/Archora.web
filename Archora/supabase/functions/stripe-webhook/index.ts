import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { corsHeaders } from '../_shared/cors.ts';
import { Errors } from '../_shared/errors.ts';
import { logAudit } from '../_shared/audit.ts';

type SubscriptionTier = 'starter' | 'creator' | 'architect';

const PRICE_TO_TIER: Record<string, SubscriptionTier> = {
  // These are populated from env to avoid hardcoding Stripe IDs
};

function getTierFromPriceId(priceId: string): SubscriptionTier {
  const envMap: Record<string, string> = {
    [Deno.env.get('STRIPE_PRICE_CREATOR_MONTHLY') ?? '']: 'creator',
    [Deno.env.get('STRIPE_PRICE_CREATOR_ANNUAL') ?? '']: 'creator',
    [Deno.env.get('STRIPE_PRICE_ARCHITECT_MONTHLY') ?? '']: 'architect',
    [Deno.env.get('STRIPE_PRICE_ARCHITECT_ANNUAL') ?? '']: 'architect',
  };
  return (envMap[priceId] as SubscriptionTier | undefined) ?? 'starter';
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return Errors.notFound();

  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!webhookSecret || !stripeSecretKey) {
    console.warn('[stripe-webhook] STRIPE keys not configured — ignoring webhook');
    return new Response(JSON.stringify({ received: true, note: 'keys_not_configured' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });

  const sig = req.headers.get('stripe-signature');
  if (!sig) return Errors.unauthorized('Missing Stripe signature');

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return Errors.validation('Webhook signature verification failed');
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const priceId = sub.items.data[0]?.price.id ?? '';
        const tier = getTierFromPriceId(priceId);
        const active = sub.status === 'active' || sub.status === 'trialing';

        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (user) {
          const userId = (user as Record<string, unknown>).id as string;
          await supabase
            .from('users')
            .update({ subscription_tier: active ? tier : 'starter' })
            .eq('id', userId);

          await supabase.from('subscriptions').upsert({
            user_id: userId,
            stripe_subscription_id: sub.id,
            stripe_customer_id: customerId,
            stripe_price_id: priceId,
            tier,
            status: sub.status,
            current_period_end: new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000).toISOString(),
          }, { onConflict: 'stripe_subscription_id' });

          await logAudit({
            user_id: userId,
            action: 'stripe_webhook',
            metadata: { event: event.type, tier, status: sub.status },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (user) {
          const userId = (user as Record<string, unknown>).id as string;
          await supabase
            .from('users')
            .update({ subscription_tier: 'starter' })
            .eq('id', userId);

          await supabase
            .from('subscriptions')
            .update({ status: 'canceled' })
            .eq('stripe_subscription_id', sub.id);

          await logAudit({
            user_id: userId,
            action: 'stripe_webhook',
            metadata: { event: 'subscription.deleted' },
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (user) {
          await supabase
            .from('subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_customer_id', customerId);
        }
        break;
      }

      default:
        // Unhandled — safe to ignore
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[stripe-webhook]', err);
    return Errors.internal();
  }
});
