import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { z } from 'https://esm.sh/zod@3.23.8';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { Errors, requireEnv } from '../_shared/errors.ts';
import { getAuthUser } from '../_shared/auth.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';
import { logAudit } from '../_shared/audit.ts';

const RequestSchema = z.object({
  templateId: z.string().uuid(),
});

Deno.serve(async (req: Request): Promise<Response> => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') return Errors.notFound();

  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeSecretKey) {
    console.warn('[create-payment-intent] STRIPE_SECRET_KEY not configured');
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

  const rateLimitOk = await checkRateLimit(`payment:${user.id}`, 10, 3600);
  if (!rateLimitOk) return Errors.rateLimited('Rate limit exceeded');

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Errors.validation('Invalid JSON body');
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) return Errors.validation('Invalid request', parsed.error.issues);

  const { templateId } = parsed.data;

  const supabase = createClient(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  );

  // Fetch template — price + seller
  const { data: template, error: tErr } = await supabase
    .from('templates')
    .select('id, name, price, user_id')
    .eq('id', templateId)
    .single();

  if (tErr || !template) return Errors.notFound('Template not found');

  const row = template as { id: string; name: string; price: number; user_id: string };

  if (!row.price || row.price <= 0) {
    return Errors.validation('This template is free — no payment required');
  }

  // Prevent self-purchase
  if (row.user_id === user.id) {
    return Errors.validation('You cannot purchase your own template');
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });

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

  const amountCents = Math.round(row.price * 100);

  try {
    // Create a Checkout Session (mode: payment) — returns a hosted URL the client can open
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: row.name },
          unit_amount: amountCents,
        },
        quantity: 1,
      }],
      success_url: `asoria://purchase-success?templateId=${templateId}`,
      cancel_url: 'asoria://purchase-cancel',
      metadata: {
        type: 'template_purchase',
        user_id: user.id,
        template_id: templateId,
        seller_id: row.user_id,
      },
    });

    await logAudit({
      user_id: user.id,
      action: 'stripe_checkout',
      metadata: { session_id: session.id, template_id: templateId, amount_cents: amountCents },
    });

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[create-payment-intent] Stripe error:', err);
    return Errors.upstream('Payment service error');
  }
});
