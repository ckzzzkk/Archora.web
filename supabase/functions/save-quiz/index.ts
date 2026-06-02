import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.23.8';
import { getAuthUser } from '../_shared/auth.ts';
import { securityHeaders } from '../_shared/cors.ts';
import { Errors, requireEnv } from '../_shared/errors.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';

const RequestSchema = z.object({
  buildingType: z.string().optional(),
  styles: z.array(z.string()).optional(),
  budget: z.number().optional(),
  household: z.string().optional(),
  priority: z.string().optional(),
});

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: securityHeaders });
  if (req.method !== 'POST') return Errors.notFound();

  try {
    const user = await getAuthUser(req);

    const allowed = await checkRateLimit(`save-quiz:${user.id}`, 10, 60);
    if (!allowed) return Errors.rateLimited('Too many requests');

    const body = await req.json() as unknown;
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) return Errors.validation('Invalid quiz payload', parsed.error.issues);

    const supabaseAdmin = createClient(
      requireEnv('SUPABASE_URL'),
      requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    );

    const { error } = await supabaseAdmin
      .from('user_quiz_answers')
      .upsert({
        user_id: user.id,
        answers: parsed.data,
        completed_at: new Date().toISOString(),
      });

    if (error) {
      console.error('[save-quiz] upsert failed:', error.message);
      return Errors.internal('Failed to save quiz answers');
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...securityHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[save-quiz]', err);
    return Errors.internal();
  }
});
