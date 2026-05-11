import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.23.8';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { Errors, requireEnv } from '../_shared/errors.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';

const RequestSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(200),
  subject: z.string().min(1).max(500),
  message: z.string().min(1).max(5000),
});

Deno.serve(async (req: Request): Promise<Response> => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') return Errors.notFound();

  // Rate limit by IP (no auth required for contact form)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const allowed = await checkRateLimit(`contact:${ip}`, 3, 3600);
  if (!allowed) return Errors.rateLimited('Too many messages. Please try again later.');

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Errors.validation('Invalid JSON');
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) return Errors.validation('Invalid form data', parsed.error.issues);

  const supabase = createClient(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  );

  const { error } = await supabase.from('contact_messages').insert({
    name: parsed.data.name,
    email: parsed.data.email,
    subject: parsed.data.subject,
    message: parsed.data.message,
  });

  if (error) {
    console.error('[contact-form]', error);
    return new Response(JSON.stringify({ error: 'Failed to send message', details: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
