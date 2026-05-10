import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { Errors, requireEnv } from '../_shared/errors.ts';
import { getAuthUser } from '../_shared/auth.ts';
import { logAudit } from '../_shared/audit.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';

Deno.serve(async (req: Request): Promise<Response> => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') return Errors.notFound();

  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeSecretKey) {
    console.warn('[stripe-checkout] STRIPE_SECRET_KEY not configured');
    return new Response(
      JSON.stringify({ error: 'Payment not configured', code: 'UPSTREAM_ERROR' }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  let user: Awaited<ReturnType<typeof getAuthUser>>;
  try {
    user = await getAuthUser(req);
  } catch (errResponse) {
    return errResponse as Response;
  }

  const rateLimitOk = await checkRateLimit(`stripe-checkout:${user.id}`, 10, 3600);
  if (!rateLimitOk) return Errors.rateLimited('Rate limit exceeded');

  let body: { priceId?: string; successUrl?: string; cancelUrl?: string };
  try {
    body = await req.json();
  } catch {
    return Errors.validation('Invalid JSON body');
  }

  const { priceId } = body;

  // Validate optional redirect URLs against whitelist
  const ALLOWED_URL_PREFIXES = ['asoria://', 'https://asoria.app', 'https://asoria.vercel.app', 'http://localhost:3000'];
  const isUrlAllowed = (url: string) => ALLOWED_URL_PREFIXES.some(p => url.startsWith(p));

  const successUrl = body.successUrl && isUrlAllowed(body.successUrl)
    ? body.successUrl
    : 'asoria://subscription-success';
  const cancelUrl = body.cancelUrl && isUrlAllowed(body.cancelUrl)
    ? body.cancelUrl
    : 'asoria://subscription-cancel';
  if (!priceId || typeof priceId !== 'string') {
    return Errors.validation('priceId is required');
  }

  // Validate required price IDs are configured — Pro and Architect tiers require env vars
  const STRIPE_PRICE_PRO_MONTHLY = Deno.env.get('STRIPE_PRICE_PRO_MONTHLY');
  const STRIPE_PRICE_PRO_ANNUAL = Deno.env.get('STRIPE_PRICE_PRO_ANNUAL');
  const STRIPE_PRICE_ARCHITECT_MONTHLY = Deno.env.get('STRIPE_PRICE_ARCHITECT_MONTHLY');
  const STRIPE_PRICE_ARCHITECT_ANNUAL = Deno.env.get('STRIPE_PRICE_ARCHITECT_ANNUAL');

  if (!STRIPE_PRICE_PRO_MONTHLY || !STRIPE_PRICE_PRO_ANNUAL) {
    console.warn('[stripe-checkout] STRIPE_PRICE_PRO price IDs not configured');
    return new Response(
      JSON.stringify({ error: 'Pro subscription not configured', code: 'UPSTREAM_ERROR' }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  if (!STRIPE_PRICE_ARCHITECT_MONTHLY || !STRIPE_PRICE_ARCHITECT_ANNUAL) {
    console.warn('[stripe-checkout] STRIPE_PRICE_ARCHITECT price IDs not configured');
    return new Response(
      JSON.stringify({ error: 'Architect subscription not configured', code: 'UPSTREAM_ERROR' }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  // Whitelist valid price IDs — reject anything not in our Stripe products
  const VALID_PRICE_IDS = new Set(
    [
      Deno.env.get('STRIPE_PRICE_CREATOR_MONTHLY'),
      Deno.env.get('STRIPE_PRICE_CREATOR_ANNUAL'),
      STRIPE_PRICE_PRO_MONTHLY,
      STRIPE_PRICE_PRO_ANNUAL,
      STRIPE_PRICE_ARCHITECT_MONTHLY,
      STRIPE_PRICE_ARCHITECT_ANNUAL,
    ].filter(Boolean),
  );
  if (!VALID_PRICE_IDS.has(priceId)) {
    return Errors.validation('Invalid price ID');
  }

  const supabase = createClient(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  );

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });

  try {
    // Get or create Stripe customer
    const { data: userData } = await supabase
      .from('users')
      .select('email, stripe_customer_id')
      .eq('id', user.id)
      .single();

    let customerId: string = (userData as { stripe_customer_id?: string } | null)?.stripe_customer_id ?? '';

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: (userData as { email?: string } | null)?.email ?? user.email ?? '',
        metadata: { user_id: user.id },
      });
      customerId = customer.id;

      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { user_id: user.id },
    });

    await logAudit({
      user_id: user.id,
      action: 'stripe_checkout',
      metadata: { session_id: session.id, price_id: priceId },
    });

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[stripe-checkout]', err);
    return Errors.internal();
  }
});
