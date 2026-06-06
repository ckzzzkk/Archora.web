import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { Errors, requireEnv } from '../_shared/errors.ts';
import { logAudit } from '../_shared/audit.ts';
import { resolveTierForEvent } from './tierResolver.ts';

// Product-id → tier mapping comes from env, mirroring stripe-webhook's price map.
function buildEnvMap(): Record<string, string> {
  const pairs: Array<[string | undefined, string]> = [
    [Deno.env.get('RC_PRODUCT_CREATOR_MONTHLY'), 'creator'],
    [Deno.env.get('RC_PRODUCT_CREATOR_ANNUAL'), 'creator'],
    [Deno.env.get('RC_PRODUCT_PRO_MONTHLY'), 'pro'],
    [Deno.env.get('RC_PRODUCT_PRO_ANNUAL'), 'pro'],
    [Deno.env.get('RC_PRODUCT_ARCHITECT_MONTHLY'), 'architect'],
    [Deno.env.get('RC_PRODUCT_ARCHITECT_ANNUAL'), 'architect'],
  ];
  const map: Record<string, string> = {};
  for (const [id, tier] of pairs) if (id) map[id] = tier;
  return map;
}

interface RCWebhookBody {
  event?: {
    type?: string;
    id?: string;
    app_user_id?: string;
    product_id?: string;
  };
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return Errors.notFound();

  const expectedAuth = Deno.env.get('REVENUECAT_WEBHOOK_AUTH');
  if (!expectedAuth) {
    console.warn('[revenuecat-webhook] REVENUECAT_WEBHOOK_AUTH not configured — skipping');
    return new Response(JSON.stringify({ received: true, note: 'auth_not_configured' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // RevenueCat sends the configured value verbatim in the Authorization header.
  const provided = req.headers.get('Authorization') ?? '';
  if (provided !== expectedAuth) {
    return Errors.unauthorized('Invalid webhook authorization');
  }

  let body: RCWebhookBody;
  try {
    body = await req.json() as RCWebhookBody;
  } catch {
    return Errors.validation('Invalid JSON body');
  }

  const event = body.event;
  const eventType = event?.type ?? '';
  const appUserId = event?.app_user_id ?? '';
  const productId = event?.product_id ?? '';
  const eventId = event?.id ?? '';

  if (!eventType || !appUserId) {
    return new Response(JSON.stringify({ received: true, note: 'missing_fields' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Idempotency via Upstash SET NX (same pattern as stripe-webhook).
  const upstashUrl = Deno.env.get('UPSTASH_REDIS_REST_URL');
  const upstashToken = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');
  if (upstashUrl && upstashToken && eventId) {
    const res = await fetch(
      `${upstashUrl}/set/rcwebhook:${eventId}/1/NX/EX/86400`,
      { method: 'GET', headers: { Authorization: `Bearer ${upstashToken}` } },
    ).catch(() => null);
    if (res?.ok) {
      const j = await res.json() as { result: string | null };
      if (j.result === null) {
        return new Response(JSON.stringify({ received: true, note: 'already_processed' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
  }

  const tier = resolveTierForEvent(eventType, productId, buildEnvMap());
  if (tier === null) {
    // CANCELLATION / unhandled — acknowledge without changing access.
    return new Response(JSON.stringify({ received: true, note: 'no_tier_change' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  );

  try {
    // app_user_id was set via Purchases.logIn(supabaseUserId), so it equals users.id.
    const { data: verifiedUser } = await supabase
      .from('users').select('id').eq('id', appUserId).single();
    if (!verifiedUser) {
      console.warn('[revenuecat-webhook] unknown app_user_id:', appUserId);
      return new Response(JSON.stringify({ received: true, note: 'unknown_user' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // CRITICAL write — this is what every tier gate reads.
    await supabase.from('users').update({ subscription_tier: tier }).eq('id', appUserId);

    // Best-effort record-keeping (must not throw the request).
    try {
      await supabase.from('subscriptions').upsert({
        user_id: appUserId,
        provider: 'revenuecat',
        store: eventType === 'EXPIRATION' ? null : 'app_store_or_play',
        rc_app_user_id: appUserId,
        product_id: productId || null,
        tier,
        status: tier === 'starter' ? 'canceled' : 'active',
      }, { onConflict: 'rc_app_user_id' });
    } catch (e) {
      console.warn('[revenuecat-webhook] subscriptions upsert skipped:', e);
    }

    await logAudit({
      user_id: appUserId,
      action: 'stripe_webhook',
      metadata: { event: eventType, tier, product_id: productId },
    });

    return new Response(JSON.stringify({ received: true, tier }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[revenuecat-webhook]', err);
    return Errors.internal();
  }
});
