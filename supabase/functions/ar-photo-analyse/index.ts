import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.23.8';
import { getAuthUser } from '../_shared/auth.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { Errors } from '../_shared/errors.ts';
import { logAudit, extractRequestMeta } from '../_shared/audit.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RequestSchema = z.object({
  photoBase64: z.string().min(100),
  wallDirection: z.enum(['front', 'left', 'back', 'right']),
});

interface PhotoAnalysisResult {
  wallWidth: number;
  wallHeight: number;
  ceilingHeight: number;
  windows: Array<{ width: number; height: number; positionX: number }>;
  doors: Array<{ width: number; height: number; positionX: number }>;
  roomType: string;
  notes: string;
}

const FALLBACK_RESULT: PhotoAnalysisResult = {
  wallWidth: 4.0,
  wallHeight: 2.4,
  ceilingHeight: 2.4,
  windows: [],
  doors: [],
  roomType: 'living_room',
  notes: '',
};

const ANALYSIS_PROMPT = (direction: string) =>
  `You are analysing a photograph of the ${direction} wall of an interior room. ` +
  `Estimate room dimensions from visual cues (furniture scale, door height, window proportions). ` +
  `Return ONLY a valid JSON object with these exact fields:\n` +
  `{\n` +
  `  "wallWidth": <number in metres, width of this wall>,\n` +
  `  "wallHeight": <number in metres, height from floor to ceiling>,\n` +
  `  "ceilingHeight": <number in metres, typically 2.2–3.0>,\n` +
  `  "windows": [{"width": <m>, "height": <m>, "positionX": <0–1 fraction from left>}],\n` +
  `  "doors": [{"width": <m>, "height": <m>, "positionX": <0–1 fraction from left>}],\n` +
  `  "roomType": "<one of: bedroom|bathroom|kitchen|living_room|dining_room|hallway|office|storage>",\n` +
  `  "notes": "<brief observation>"\n` +
  `}\n` +
  `If unsure about dimensions, use typical residential defaults: wall 3–5m wide, ceiling 2.4m. ` +
  `Always return valid JSON only — no markdown, no explanation.`;

function safeParseResult(text: string): PhotoAnalysisResult {
  try {
    // Extract JSON from response (Claude may wrap in markdown)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return FALLBACK_RESULT;
    const parsed = JSON.parse(jsonMatch[0]) as Partial<PhotoAnalysisResult>;

    return {
      wallWidth: typeof parsed.wallWidth === 'number' && parsed.wallWidth > 0 ? parsed.wallWidth : FALLBACK_RESULT.wallWidth,
      wallHeight: typeof parsed.wallHeight === 'number' && parsed.wallHeight > 0 ? parsed.wallHeight : FALLBACK_RESULT.wallHeight,
      ceilingHeight: typeof parsed.ceilingHeight === 'number' && parsed.ceilingHeight > 0 ? parsed.ceilingHeight : FALLBACK_RESULT.ceilingHeight,
      windows: Array.isArray(parsed.windows) ? parsed.windows : [],
      doors: Array.isArray(parsed.doors) ? parsed.doors : [],
      roomType: typeof parsed.roomType === 'string' ? parsed.roomType : 'living_room',
      notes: typeof parsed.notes === 'string' ? parsed.notes : '',
    };
  } catch {
    console.warn('[ar-photo-analyse] Failed to parse Claude response, using fallback');
    return FALLBACK_RESULT;
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const user = await getAuthUser(req);

    const allowed = await checkRateLimit(`ar-photo:${user.id}`, 20, 3600);
    if (!allowed) return Errors.rateLimited('Photo analysis rate limit exceeded — try again later');

    const body = await req.json() as unknown;
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return Errors.validation('Invalid request body', parsed.error.issues);
    }

    const { photoBase64, wallDirection } = parsed.data;

    const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_KEY) {
      console.warn('[ar-photo-analyse] ANTHROPIC_API_KEY not set — returning fallback');
      return new Response(JSON.stringify(FALLBACK_RESULT), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: photoBase64,
                },
              },
              {
                type: 'text',
                text: ANALYSIS_PROMPT(wallDirection),
              },
            ],
          },
        ],
      }),
    });

    let result = FALLBACK_RESULT;

    if (claudeResponse.ok) {
      const claudeData = await claudeResponse.json() as {
        content: Array<{ type: string; text: string }>;
      };
      const textBlock = claudeData.content.find((b) => b.type === 'text');
      if (textBlock) {
        result = safeParseResult(textBlock.text);
      }
    } else {
      console.error('[ar-photo-analyse] Claude API error:', claudeResponse.status, await claudeResponse.text());
    }

    await logAudit({
      user_id: user.id,
      action: 'ar_photo_analyse',
      resource_type: 'ar_scan',
      resource_id: null,
      meta: { direction: wallDirection, ...extractRequestMeta(req) },
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[ar-photo-analyse]', err);
    return Errors.internal();
  }
});
