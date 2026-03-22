import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { Errors } from '../_shared/errors.ts';
import { getAuthUser } from '../_shared/auth.ts';
import { logAudit } from '../_shared/audit.ts';

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

  let body: { priceId?: string };
  try {
    body = await req.json();
  } catch {
    return Errors.validation('Invalid JSON body');
  }

  const { priceId } = body;
  if (!priceId || typeof priceId !== 'string') {
    return Errors.validation('priceId is required');
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
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
      success_url: 'asoria://subscription-success',
      cancel_url: 'asoria://subscription-cancel',
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
