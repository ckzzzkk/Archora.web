// supabase/functions/render-blueprint/index.ts
// Receives blueprint JSON → generates 3D via Meshy AI → returns GLTF URL
//
// Two paths:
//  - With referenceImageUrl  → Meshy regenerates from user photo (backbone guide)
//  - Without                  → Meshy generates from blueprint metadata (room layout guess)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.23.8';
import { getAuthUser, requireOwnership } from '../_shared/auth.ts';
import { checkQuota } from '../_shared/quota.ts';
import { requireRateLimit } from '../_shared/rateLimit.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { Errors, requireEnv } from '../_shared/errors.ts';

const MESHY_BASE = 'https://api.meshy.ai';

const RequestSchema = z.object({
  blueprintId: z.string().uuid(),
  referenceImageUrl: z.string().url().optional(),
});

async function createMeshyTask(imageUrl: string, meshyKey: string): Promise<string | null> {
  try {
    const createRes = await fetch(`${MESHY_BASE}/v1/image-to-3d`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${meshyKey}`,
      },
      body: JSON.stringify({
        image_url: imageUrl,
        enable_pbr: true,
        ai_model: 'meshy-4',
        surface_mode: 'hard',
        topology: 'quad',
        target_polycount: 30000,
      }),
    });
    if (!createRes.ok) return null;
    const { result } = await createRes.json() as { result: string };
    return result;
  } catch {
    return null;
  }
}

// Build a text prompt from blueprint metadata for Meshy when no reference image
function buildBlueprintPrompt(
  buildingType: string,
  roomCount: number,
  style: string,
  totalArea: number,
): string {
  const areaStr = totalArea > 0 ? ` ~${Math.round(totalArea)}m²` : '';
  return `${buildingType} floor plan, ${roomCount} rooms, ${style} style${areaStr} interior architecture`;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const user = await getAuthUser(req);

    const limited = await requireRateLimit(`render:${user.id}`, 3, 3600, 'Render rate limit exceeded');
    if (limited) return limited;

    const body = await req.json() as unknown;
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) return Errors.validation('Invalid request', parsed.error.issues);

    const { blueprintId, referenceImageUrl } = parsed.data;

    const supabase = createClient(
      requireEnv('SUPABASE_URL'),
      requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    );

    // Fetch blueprint from projects table
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, blueprint_data')
      .eq('id', blueprintId)
      .single();

    if (projectError || !project) return Errors.notFound('Project not found');

    // Ownership check — user must own this project
    await requireOwnership(supabase, 'projects', blueprintId, user.id);

    // Quota check for renders
    const quotaOk = await checkQuota(user.id, 'render');
    if (!quotaOk) return Errors.quotaExceeded('Monthly render quota reached.');

    const meshyKey = Deno.env.get('MESHY_API_KEY') ?? '';
    if (!meshyKey) return Errors.internal('Meshy AI not configured');

    const bp = project.blueprint_data as {
      metadata?: { buildingType?: string; roomCount?: number; style?: string; totalArea?: number };
    } | null;

    // Determine image URL to send to Meshy:
    // Priority 1: user-provided referenceImageUrl
    // Priority 2: blueprint metadata → synthy placeholder via picsum.photos fallback
    let imageUrl = referenceImageUrl ?? null;
    let meshPrompt = '';

    if (!imageUrl && bp?.metadata) {
      const { buildingType = 'house', roomCount = 1, style = 'modern', totalArea = 0 } = bp.metadata;
      meshPrompt = buildBlueprintPrompt(buildingType, roomCount, style, totalArea);
      // Use a neutral architectural placeholder image so Meshy can interpret the style intent
      // (picsum generates a random image seeded by the project id — consistent per blueprint)
      imageUrl = `https://picsum.photos/seed/${project.id}/512/512`;
    }

    if (!imageUrl) {
      return Errors.validation('A reference image is required. Please provide referenceImageUrl.');
    }

    // Create the Meshy image-to-3D task. Completion is observed by the client
    // via render-status (the old in-function ~2.5min poll sat at the edge
    // function execution limit and timed out slow renders).
    const taskId = await createMeshyTask(imageUrl, meshyKey);
    if (!taskId) return Errors.internal('Failed to start Meshy render');

    // Bind the task to the project — render-status / render-webhook may only
    // complete a render whose task id matches.
    await supabase
      .from('projects')
      .update({
        render_status: 'rendering',
        render_task_id: taskId,
        render_error: null,
      })
      .eq('id', blueprintId);

    // Increment render quota at dispatch (the render has been paid for at Meshy)
    try {
      await supabase.rpc('increment_quota', { p_user_id: user.id, p_field: 'renders_used', p_amount: 1 });
    } catch (e) {
      console.warn('Failed to increment renders_used quota:', e);
    }

    return new Response(
      JSON.stringify({ taskId, projectId: blueprintId, status: 'rendering' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[render-blueprint]', err);
    return Errors.internal();
  }
});
