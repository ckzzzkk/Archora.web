import { z } from 'https://esm.sh/zod@3.23.8';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getAuthUser } from '../_shared/auth.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { Errors } from '../_shared/errors.ts';
import { logAudit, extractRequestMeta } from '../_shared/audit.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RequestSchema = z.object({
  projectId: z.string().uuid(),
  floorIndex: z.number().int().min(0),
  delta: z.record(z.unknown()),
  expectedVersion: z.number().int().min(1),
});

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return Errors.notFound();
  }

  let user: Awaited<ReturnType<typeof getAuthUser>>;
  try {
    user = await getAuthUser(req);
  } catch (err) {
    return err as Response;
  }

  const body = await req.json() as unknown;
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return Errors.validation('Invalid request body', parsed.error.issues);
  }

  const { projectId, floorIndex, delta, expectedVersion } = parsed.data;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // 1. Verify user is a project member with editor/owner role
  const { data: membership, error: membershipError } = await supabase
    .from('co_project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single();

  if (membershipError || !membership) {
    return Errors.forbidden('You are not a member of this project');
  }

  const role = (membership as { role: string }).role;
  if (role !== 'owner' && role !== 'editor') {
    return Errors.forbidden('Editor or owner role required for blueprint edits');
  }

  // 2. Read current blueprint_state for (projectId, floorIndex)
  const { data: current, error: readError } = await supabase
    .from('blueprint_state')
    .select('state, version')
    .eq('project_id', projectId)
    .eq('floor_index', floorIndex)
    .single();

  if (readError && readError.code !== 'PGRST116') {
    // PGRST116 = no rows returned — not an error, just doesn't exist yet
    console.error('[codesign-sync] Failed to read blueprint_state:', readError);
    return Errors.internal('Failed to read blueprint state');
  }

  // 3. Version conflict check
  const currentVersion = (current as { version: number } | null)?.version ?? 0;
  if (currentVersion === 0) {
    // Floor doesn't exist yet — expectedVersion must be 1 (first write)
    if (expectedVersion !== 1) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'VERSION_CONFLICT',
          message: `Floor does not exist. Expected version 1, got ${expectedVersion}.`,
          currentVersion: 0,
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } },
      );
    }
  } else if (expectedVersion !== currentVersion) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'VERSION_CONFLICT',
        message: `Version mismatch. Expected ${expectedVersion}, current is ${currentVersion}.`,
        currentVersion,
      }),
      { status: 409, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const newVersion = currentVersion + 1;

  // 4 & 5. Apply delta and upsert blueprint state
  let newState: Record<string, unknown>;
  if (currentVersion === 0) {
    // First write — delta becomes the initial state
    newState = delta as Record<string, unknown>;
  } else {
    // Merge delta into existing state
    newState = {
      ...(current as { state: Record<string, unknown> }).state,
      ...(delta as Record<string, unknown>),
    };
  }

  const upsertResult = await supabase
    .from('blueprint_state')
    .upsert(
      {
        project_id: projectId,
        floor_index: floorIndex,
        state: newState,
        version: newVersion,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      },
      { onConflict: 'project_id,floor_index' },
    );

  if (upsertResult.error) {
    console.error('[codesign-sync] Failed to upsert blueprint_state:', upsertResult.error);
    return Errors.internal('Failed to update blueprint state');
  }

  // 6. Insert activity entry
  await supabase.from('co_project_activity').insert({
    project_id: projectId,
    user_id: user.id,
    action: 'edited',
    entity_type: 'blueprint_state',
    entity_id: projectId,
    entity_snapshot: { floorIndex, version: newVersion },
  });

  await logAudit({
    user_id: user.id,
    action: 'codesign_sync',
    resource_type: 'project',
    resource_id: projectId,
    metadata: { floorIndex, version: newVersion, ...extractRequestMeta(req) },
  });

  return new Response(
    JSON.stringify({ success: true, newVersion }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});