import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { securityHeaders } from '../_shared/cors.ts';
import { getAuthUser } from '../_shared/auth.ts';
import { logAudit } from '../_shared/audit.ts';
import { Errors } from '../_shared/errors.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: securityHeaders });
  if (req.method !== 'POST') return Errors.notFound();

  try {
    const user = await getAuthUser(req);

    const allowed = await checkRateLimit(`export-data:${user.id}`, 5, 3600);
    if (!allowed) return Errors.rateLimited('Export rate limit exceeded');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Fetch all user data in parallel — RLS is bypassed via service role,
    // but we filter by user_id explicitly for safety
    const [accountRes, projectsRes, projectVersionsRes, templatesRes] = await Promise.all([
      supabase
        .from('users')
        .select('id, email, display_name, avatar_url, subscription_tier, ai_generations_used, ar_scans_used, created_at')
        .eq('id', user.id)
        .single(),
      supabase
        .from('projects')
        .select('id, name, building_type, blueprint_data, thumbnail_url, is_published, room_count, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('project_versions')
        .select('id, project_id, version_number, blueprint_data, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('templates')
        .select('id, title, description, price, building_type, style, download_count, is_featured, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
    ]);

    if (accountRes.error) throw accountRes.error;

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0',
      account: accountRes.data,
      projects: projectsRes.data ?? [],
      projectVersions: projectVersionsRes.data ?? [],
      templates: templatesRes.data ?? [],
    };

    await logAudit({
      user_id: user.id,
      action: 'data_exported',
      resource_type: 'user_data',
      metadata: {
        projectCount: exportPayload.projects.length,
        templateCount: exportPayload.templates.length,
      },
    });

    return new Response(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        ...securityHeaders,
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="asoria-export.json"',
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[export-user-data]', err);
    return Errors.internal();
  }
});
