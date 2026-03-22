import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.23.8';
import { getAuthUser } from '../_shared/auth.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { Errors } from '../_shared/errors.ts';

const RequestSchema = z.object({
  templateId: z.string().uuid(),
});

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const user = await getAuthUser(req);

    const body = await req.json() as unknown;
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) return Errors.validation('Invalid request', parsed.error.issues);

    const { templateId } = parsed.data;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Fetch template price + seller
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

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return Errors.internal('Payment service not configured');
    }

    const amountCents = Math.round(row.price * 100);

    // Create Stripe PaymentIntent
    const stripeBody = new URLSearchParams({
      amount: String(amountCents),
      currency: 'usd',
      'metadata[templateId]': templateId,
      'metadata[templateName]': row.name,
      'metadata[buyerId]': user.id,
      'metadata[sellerId]': row.user_id,
      'automatic_payment_methods[enabled]': 'true',
    });

    const stripeRes = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: stripeBody.toString(),
    });

    if (!stripeRes.ok) {
      const err = await stripeRes.text();
      console.error('[create-payment-intent] Stripe error:', err);
      return Errors.upstream('Payment service error');
    }

    const intent = await stripeRes.json() as { client_secret: string; id: string };

    return new Response(
      JSON.stringify({
        clientSecret: intent.client_secret,
        paymentIntentId: intent.id,
        amount: amountCents,
        currency: 'usd',
        templateName: row.name,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[create-payment-intent]', err);
    return Errors.internal();
  }
});
