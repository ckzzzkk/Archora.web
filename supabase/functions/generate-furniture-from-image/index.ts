/**
 * generate-furniture-from-image — AI image-to-furniture (Pro+ tier)
 *
 * POST body: { imageUrl: string, projectId?: string }
 *   → Uploads image to Supabase Storage (if not already uploaded)
 *   → Claude Vision API identifies furniture type + dimensions
 *   → Meshy AI generates a GLB 3D model (if MESHY_API_KEY set)
 *   → Inserts record into custom_furniture table
 *   → Returns { customAsset, identification, meshGenerated }
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.23.8';
import { getAuthUser } from '../_shared/auth.ts';
import { checkQuota } from '../_shared/quota.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { Errors, requireEnv } from '../_shared/errors.ts';
import { logAudit } from '../_shared/audit.ts';
import { TIER_AI_MODELS, getModelProvider } from '../_shared/aiLimits.ts';

const ANTHROPIC_BASE = 'https://api.anthropic.com/v1';
const MESHY_BASE = 'https://api.meshy.ai';

const RequestSchema = z.object({
  imageUrl: z.string().url(),
  projectId: z.string().uuid().optional(),
  name: z.string().optional(),
  category: z.string().optional(),
});

// Furniture categories for the Vision prompt
const FURNITURE_CATEGORIES = [
  'living', 'bedroom', 'dining', 'kitchen', 'bathroom',
  'office', 'storage', 'outdoor', 'media',
];

function uuidRegex(): RegExp {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
}

interface AnthropicMessage {
  role: 'user';
  content: ({
    type: 'text';
    text: string;
  } | {
    type: 'image';
    source: { type: 'url'; url: string };
  })[];
}

interface VisionIdentification {
  furnitureType: string;
  name: string;
  width: number;   // metres
  height: number; // metres
  depth: number;   // metres
  category: string;
  styleTags: string[];
  confidence: number;
}

async function identifyFurnitureWithClaude(
  imageUrl: string,
  anthropicKey: string,
  selectedModel: string,
): Promise<VisionIdentification> {
  const systemPrompt = `You are a furniture identification expert. Analyze the image and return a JSON object describing the furniture.
Return ONLY valid JSON with this exact shape — no markdown, no explanation:
{
  "furnitureType": "sofa|chair|table|bed|wardrobe|desk|shelf|cabinet|...",
  "name": "Descriptive name (e.g. 'Three-seater sofa with chaise')",
  "width": number_in_metres,
  "height": number_in_metres,
  "depth": number_in_metres,
  "category": "living|bedroom|dining|kitchen|bathroom|office|storage|outdoor|media",
  "styleTags": ["modern", "wooden", "upholstered", ...],
  "confidence": 0.0_to_1.0
}
Be precise with dimensions — typical sofa width 2.0-2.5m, chair 0.8-1.0m, dining table 1.4-2.0m.
Categories: ${FURNITURE_CATEGORIES.join(', ')}`;

  const message: AnthropicMessage = {
    role: 'user',
    content: [
      { type: 'image', source: { type: 'url', url: imageUrl } },
      { type: 'text', text: systemPrompt },
    ],
  };

  const response = await fetch(`${ANTHROPIC_BASE}/messages`, {
    method: 'POST',
    headers: {
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: selectedModel,
      max_tokens: 1024,
      messages: [message],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('[generate-furniture-from-image] Claude Vision error:', errText);
    throw new Error('Claude Vision API failed');
  }

  const data = await response.json() as {
    content: { type: string; text?: string }[];
    usage?: { input_tokens: number; output_tokens: number };
  };

  const textContent = data.content.find((c) => c.type === 'text');
  if (!textContent?.text) throw new Error('No response text from Claude Vision');

  // Extract JSON from response (Claude may wrap in markdown code blocks)
  let jsonStr = textContent.text.trim();
  const jsonMatch = jsonStr.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
  if (jsonMatch) jsonStr = jsonMatch[1].trim();

  const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
  return {
    furnitureType: String(parsed.furnitureType ?? 'unknown'),
    name: String(parsed.name ?? 'Custom Furniture'),
    width: Number(parsed.width ?? 1.0),
    height: Number(parsed.height ?? 1.0),
    depth: Number(parsed.depth ?? 1.0),
    category: String(parsed.category ?? 'living'),
    styleTags: Array.isArray(parsed.styleTags) ? parsed.styleTags.map(String) : [],
    confidence: Number(parsed.confidence ?? 0.5),
  };
}

interface MeshyTaskResult {
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED';
  progress: number;
  model_urls?: { glb?: string; fbx?: string };
  thumbnail_url?: string;
  error?: { message: string };
}

async function generateMeshyModel(
  imageUrl: string,
  meshyKey: string,
): Promise<{ meshUrl: string | null; thumbnailUrl: string | null }> {
  // Start image-to-3D task
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

  if (!createRes.ok) {
    console.warn('[generate-furniture-from-image] Meshy task creation failed:', await createRes.text());
    return { meshUrl: null, thumbnailUrl: null };
  }

  const { result: taskId } = await createRes.json() as { result: string };

  // Poll up to 20 times, 8s interval, 2s initial delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  for (let attempt = 0; attempt < 20; attempt++) {
    const pollRes = await fetch(`${MESHY_BASE}/v1/image-to-3d/${taskId}`, {
      headers: { Authorization: `Bearer ${meshyKey}` },
    });

    if (!pollRes.ok) break;

    const task = await pollRes.json() as MeshyTaskResult;

    if (task.status === 'SUCCEEDED') {
      return {
        meshUrl: task.model_urls?.glb ?? null,
        thumbnailUrl: task.thumbnail_url ?? null,
      };
    }

    if (task.status === 'FAILED' || task.status === 'EXPIRED') {
      console.warn('[generate-furniture-from-image] Meshy task failed:', task.error?.message);
      return { meshUrl: null, thumbnailUrl: null };
    }

    // Wait 8s before next poll
    await new Promise((resolve) => setTimeout(resolve, 8000));
  }

  console.warn('[generate-furniture-from-image] Meshy polling timed out after 20 attempts');
  return { meshUrl: null, thumbnailUrl: null };
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') return Errors.notFound();

  // ── Auth ─────────────────────────────────────────────────────────────────
  let user: Awaited<ReturnType<typeof getAuthUser>>;
  try {
    user = await getAuthUser(req);
  } catch (err) {
    return err as Response;
  }

  // ── Rate limit & quota ────────────────────────────────────────────────────
  const limited = await checkRateLimit(`furniture_image:${user.id}`, 10, 3600);
  if (limited) return Errors.rateLimited('Image-to-furniture rate limit exceeded (10/hr)');

  const quotaOk = await checkQuota(user.id, 'viga');
  if (!quotaOk) return Errors.quotaExceeded('AI generation quota exceeded');

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Errors.validation('Invalid JSON body');
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) return Errors.validation('Invalid request', parsed.error.issues);

  const { imageUrl, projectId, name, category } = parsed.data;

  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
  if (!anthropicKey) {
    return new Response(
      JSON.stringify({ error: 'AI service not configured', code: 'UPSTREAM_ERROR' }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  // Tier-based model selection
  const supabaseSvc = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'));
  const { data: tierData } = await supabaseSvc.rpc('get_user_tier', { user_id: user.id });
  const tier = (tierData as string) ?? 'starter';
  const modelConfig = TIER_AI_MODELS[tier as keyof typeof TIER_AI_MODELS] ?? TIER_AI_MODELS.starter;
  const selectedModel = modelConfig.generation;
  if (!selectedModel) {
    return new Response(JSON.stringify({ error: 'AI_NOT_AVAILABLE', message: 'AI generation not available on your tier' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // ── Step 1: Identify furniture via Claude Vision ──────────────────────────
  let identification: VisionIdentification;
  try {
    identification = await identifyFurnitureWithClaude(imageUrl, anthropicKey, selectedModel);
  } catch (err) {
    console.error('[generate-furniture-from-image] Vision identification failed:', err);
    return Errors.upstream('Furniture identification failed. Please try a clearer photo.');
  }

  // ── Step 2: Generate 3D mesh via Meshy (optional) ─────────────────────────
  let meshUrl: string | null = null;
  let thumbnailUrl: string | null = null;
  let meshGenerated = false;

  const meshyKey = Deno.env.get('MESHY_API_KEY') ?? '';
  if (meshyKey) {
    try {
      const meshResult = await generateMeshyModel(imageUrl, meshyKey);
      meshUrl = meshResult.meshUrl;
      thumbnailUrl = meshResult.thumbnailUrl;
      meshGenerated = !!meshUrl;
    } catch (err) {
      console.warn('[generate-furniture-from-image] Meshy generation failed (non-fatal):', err);
    }
  }

  // ── Step 3: Persist custom_furniture record ───────────────────────────────
  const supabase = createClient(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  );

  const dimensions = { x: identification.width, y: identification.height, z: identification.depth };

  // Verify project ownership if projectId is provided
  if (projectId) {
    const { data: project } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', projectId)
      .single();
    if (!project || project.user_id !== user.id) {
      return Errors.forbidden('Project not found or access denied');
    }
  }

  const { data: record, error: insertErr } = await supabase
    .from('custom_furniture')
    .insert({
      user_id: user.id,
      project_id: projectId && uuidRegex().test(projectId) ? projectId : null,
      name: name || identification.name,
      category: category || identification.category,
      mesh_url: meshUrl,
      thumbnail_url: thumbnailUrl,
      source_image_url: imageUrl,
      dimensions,
      style_tags: identification.styleTags,
    })
    .select()
    .single();

  if (insertErr) {
    console.error('[generate-furniture-from-image] DB insert failed:', insertErr);
    // Non-fatal — still return the identification result
  }

  // ── Audit log ─────────────────────────────────────────────────────────────
  await logAudit({
    user_id: user.id,
    action: 'furniture_image_generate',
    resource_id: (record as Record<string, unknown> | null)?.id as string | undefined,
    resource_type: 'custom_furniture',
    metadata: {
      furnitureType: identification.furnitureType,
      name: identification.name,
      category: identification.category,
      meshGenerated,
      confidence: identification.confidence,
    },
  });

  // ── Build CustomAsset for blueprintStore ──────────────────────────────────
  const customAsset = {
    id: ((record as Record<string, unknown>)?.id as string) ?? crypto.randomUUID(),
    name: identification.name,
    prompt: identification.furnitureType,
    style: identification.styleTags.join(', ') || identification.category,
    category: identification.category,
    meshUrl: meshUrl ?? '',
    thumbnailUrl: thumbnailUrl ?? '',
    dimensions,
    styleTags: identification.styleTags,
  };

  return new Response(
    JSON.stringify({ customAsset, identification, meshGenerated }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});