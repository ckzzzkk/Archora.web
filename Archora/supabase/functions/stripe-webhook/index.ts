import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { corsHeaders } from '../_shared/cors.ts';
import { Errors } from '../_shared/errors.ts';
import { logAudit } from '../_shared/audit.ts';

type SubscriptionTier = 'starter' | 'creator' | 'pro' | 'architect';

function getTierFromPriceId(priceId: string): SubscriptionTier {
  const envMap: Record<string, string> = {
    [Deno.env.get('STRIPE_PRICE_CREATOR_MONTHLY') ?? '']: 'creator',
    [Deno.env.get('STRIPE_PRICE_CREATOR_ANNUAL') ?? '']: 'creator',
    [Deno.env.get('STRIPE_PRICE_PRO_MONTHLY') ?? '']: 'pro',
    [Deno.env.get('STRIPE_PRICE_PRO_ANNUAL') ?? '']: 'pro',
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

  // Idempotency — atomic SET NX prevents double-processing on Stripe retries
  const upstashUrl = Deno.env.get('UPSTASH_REDIS_REST_URL');
  const upstashToken = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');
  if (upstashUrl && upstashToken) {
    const idempotencyRes = await fetch(
      `${upstashUrl}/set/webhook:${event.id}/1/NX/EX/86400`,
      { method: 'GET', headers: { Authorization: `Bearer ${upstashToken}` } },
    ).catch(() => null);
    if (idempotencyRes?.ok) {
      const body = await idempotencyRes.json() as { result: string | null };
      if (body.result === null) {
        // Key already existed — event already processed
        return new Response(JSON.stringify({ received: true, note: 'already_processed' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      // Redis unavailable — fail open, process anyway; DB upsert provides secondary idempotency
      console.warn('[stripe-webhook] Redis unavailable for idempotency check — processing anyway');
    }
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const metaUserId = session.metadata?.user_id;
        const customerId = session.customer as string;
        if (!metaUserId || !customerId) break;

        // Verify the user referenced in metadata actually exists before trusting it
        const { data: verifiedUser } = await supabase
          .from('users').select('id').eq('id', metaUserId).single();
        if (!verifiedUser) {
          console.warn('[stripe-webhook] checkout.session.completed — unknown user_id in metadata:', metaUserId);
          break;
        }

        await supabase
          .from('users')
          .update({ stripe_customer_id: customerId })
          .eq('id', metaUserId);

        if (session.mode === 'payment' && session.metadata?.type === 'template_purchase') {
          // Template one-time purchase — save template for buyer + notify
          const templateId = session.metadata.template_id;
          const sellerId = session.metadata.seller_id;

          if (templateId) {
            await supabase
              .from('saves')
              .upsert({ user_id: metaUserId, template_id: templateId }, { onConflict: 'user_id,template_id' });

            await supabase.rpc('increment_template_download', { p_template_id: templateId });

            await supabase.from('notifications').insert({
              user_id: metaUserId,
              type: 'system',
              payload: {
                title: 'Purchase complete!',
                message: 'Your template has been saved. Open it from your saved designs.',
              },
            });

            // Notify seller if different from buyer
            if (sellerId && sellerId !== metaUserId) {
              await supabase.from('notifications').insert({
                user_id: sellerId,
                type: 'system',
                payload: {
                  title: 'Template sold!',
                  message: 'Someone purchased your template.',
                },
              });
            }

            await logAudit({
              user_id: metaUserId,
              action: 'stripe_webhook',
              metadata: { event: 'template_purchase', template_id: templateId },
            });
          }
        } else {
          // Subscription checkout completion
          await supabase.from('notifications').insert({
            user_id: metaUserId,
            type: 'system',
            payload: {
              title: 'Welcome to Asoria Pro!',
              message: 'Your subscription is now active. Enjoy unlimited building.',
            },
          });
        }
        break;
      }

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

          await supabase.from('notifications').insert({
            user_id: userId,
            type: 'system',
            payload: {
              title: 'Subscription ended',
              message: 'Your subscription has been cancelled. You\'ve been moved to the Starter plan.',
            },
          });

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
          const userId = (user as Record<string, unknown>).id as string;
          await supabase
            .from('subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_customer_id', customerId);

          await supabase.from('notifications').insert({
            user_id: userId,
            type: 'system',
            payload: {
              title: 'Payment failed',
              message: 'We couldn\'t charge your card. Please update your payment details to keep your subscription.',
            },
          });
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
