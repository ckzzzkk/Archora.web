import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { getAuthUser } from '../_shared/auth.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';
import { Errors } from '../_shared/errors.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const RequestSchema = z.object({
  blueprint: z.record(z.unknown()),
  climateZone: z.enum(['tropical', 'subtropical', 'temperate', 'arid', 'cold', 'alpine']).default('temperate'),
  hemisphere: z.enum(['north', 'south']).default('north'),
});

const SIMULATION_PROMPT = `You are ARIA's structural and environmental simulation engine. You are a senior structural engineer AND environmental performance consultant.

Analyse the provided BlueprintData JSON and produce a detailed simulation report.

Evaluate FOUR categories:

STRUCTURAL (0-100):
- Load path continuity (loadbearing walls continuous floor-to-floor)
- Span lengths (flag any room wider than 4.5m without a noted beam)
- Shear wall provision (solid walls on all 4 quadrants)
- Wet room stacking (bathrooms above bathrooms)
- Roof support (adequate internal walls under ridge)
- Foundation adequacy for climate zone
Score 100 = perfect structural design. Deduct 10 per major issue. Deduct 5 per minor issue.

WEATHER (0-100):
- Orientation (living areas facing sun-optimal direction for climate/hemisphere)
- Roof geometry (appropriate pitch for climate)
- Overhang adequacy (600mm temperate, 1200mm tropical)
- Cross ventilation (windows on opposing walls in habitable rooms)
- Drainage design (hard surfaces away from building)
- Thermal mass (concrete/stone in sun-facing rooms for cold/temperate)
Score 100 = optimal climate performance.

FLOW (0-100):
- Zone separation (private/social/service zones distinct)
- Circulation efficiency (no room accessed through another room)
- Privacy gradient (public at front, private at rear/upper)
- Kitchen work triangle compliance
- Entrance sequence (hall buffer between outside and living)
Score 100 = perfect flow.

CODE_COMPLIANCE (0-100):
- All rooms meet minimum dimensions
- Every habitable room has a window
- Bathroom door does not face kitchen/dining
- Ground floor has WC
- Corridors minimum 900mm
- Stair width minimum 900mm
Score 100 = full compliance.

Return ONLY valid JSON matching this schema exactly:
{
  "overall": 0,
  "structural": 0,
  "weather": 0,
  "flow": 0,
  "codeCompliance": 0,
  "grade": "A|B|C|D|F",
  "summary": "2-3 sentence overview of the design's strengths and main improvement areas",
  "strengths": ["string", "string", "string"],
  "recommendations": [
    {
      "category": "structural|weather|flow|code",
      "severity": "critical|major|minor",
      "issue": "string — what the problem is",
      "fix": "string — specific actionable fix"
    }
  ],
  "weatherProfile": {
    "solarGain": "excellent|good|fair|poor",
    "windResistance": "excellent|good|fair|poor",
    "rainProtection": "excellent|good|fair|poor",
    "thermalMass": "excellent|good|fair|poor"
  },
  "structuralProfile": {
    "loadPath": "excellent|good|fair|poor",
    "spanIntegrity": "excellent|good|fair|poor",
    "foundationFit": "excellent|good|fair|poor",
    "shearWalls": "excellent|good|fair|poor"
  }
}

No markdown, no explanation. JSON only.`;

/** Adds CORS headers to any Response returned by Errors.* helpers. */
function addCors(res: Response): Response {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(corsHeaders)) headers.set(k, v);
  return new Response(res.body, { status: res.status, headers });
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    let user;
    try {
      user = await getAuthUser(req);
    } catch (authErr) {
      if (authErr instanceof Response) {
        return new Response(
          JSON.stringify({ error: 'Please sign in to simulate builds', code: 'AUTH_REQUIRED' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      throw authErr;
    }

    // Rate limit: 20 simulate requests per hour
    const rateLimitOk = await checkRateLimit(`simulate:${user.id}`, 20, 3600);
    if (!rateLimitOk) {
      return addCors(Errors.rateLimited('Rate limit exceeded. Try again later.'));
    }

    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return addCors(Errors.validation('Invalid request', parsed.error.issues));
    }

    const { blueprint, climateZone, hemisphere } = parsed.data;

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      return new Response(JSON.stringify({
        error: 'AI_NOT_CONFIGURED',
        message: 'Simulation engine coming soon — API key not yet configured',
      }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userMessage = `Analyse this blueprint and return the simulation report as JSON.

Climate Zone: ${climateZone}
Hemisphere: ${hemisphere}

Blueprint data:
${JSON.stringify(blueprint, null, 2)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55_000);

    let claudeResponse: Response;
    try {
      claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1500,
          temperature: 0,
          system: SIMULATION_PROMPT,
          messages: [{ role: 'user', content: userMessage }],
        }),
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      const isTimeout = fetchErr instanceof Error && fetchErr.name === 'AbortError';
      console.error('[simulate-build]', isTimeout ? 'Request timed out after 55s' : fetchErr);
      return new Response(
        JSON.stringify({ error: isTimeout ? 'TIMEOUT' : 'NETWORK' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    clearTimeout(timeoutId);

    if (!claudeResponse.ok) {
      const errorBody = await claudeResponse.text();
      console.error('Anthropic API error body:', errorBody);
      throw new Error(`Claude API error: ${claudeResponse.status} — ${errorBody}`);
    }

    const claudeData = await claudeResponse.json() as {
      content: Array<{ type: string; text: string }>;
    };
    const rawText = claudeData.content?.[0]?.text;

    if (!rawText) {
      throw new Error('Empty response from AI');
    }

    let reportData: unknown;
    try {
      reportData = JSON.parse(rawText);
    } catch {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('AI returned invalid JSON');
      try {
        reportData = JSON.parse(jsonMatch[0]);
      } catch {
        throw new Error('AI returned invalid JSON');
      }
    }

    // Stamp generatedAt
    const report = {
      ...(reportData as Record<string, unknown>),
      generatedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify({ report }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof Response) {
      const h = new Headers(error.headers);
      for (const [k, v] of Object.entries(corsHeaders)) h.set(k, v);
      return new Response(error.body, { status: error.status, headers: h });
    }
    let msg = 'Unknown error';
    if (error instanceof Error) {
      msg = error.message;
    } else if (typeof error === 'string') {
      msg = error;
    } else {
      try { msg = JSON.stringify(error); } catch { msg = String(error); }
    }
    console.error('[simulate-build] error:', msg);
    return new Response(
      JSON.stringify({ error: 'Simulation failed', code: 'INTERNAL_ERROR', detail: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
