import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { Errors } from '../_shared/errors.ts';
import { getAuthUser } from '../_shared/auth.ts';

Deno.serve(async (req: Request): Promise<Response> => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') return Errors.notFound();

  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeSecretKey) {
    console.warn('[stripe-portal] STRIPE_SECRET_KEY not configured');
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

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });

  try {
    // Get Stripe customer ID from users table
    const { data: userData } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    const customerId = (userData as { stripe_customer_id?: string } | null)?.stripe_customer_id;

    if (!customerId) {
      return Errors.validation('No active subscription found');
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: 'asoria://account',
    });

    return new Response(
      JSON.stringify({ url: portalSession.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[stripe-portal]', err);
    return Errors.internal();
  }
});
