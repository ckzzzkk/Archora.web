import { z } from 'https://esm.sh/zod@3.23.8';
import { getAuthUser } from '../_shared/auth.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';
import { checkQuota } from '../_shared/quota.ts';
import { getArchitectById, buildArchitectPromptSection } from '../_shared/architects.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { Errors } from '../_shared/errors.ts';
import { logAudit, extractRequestMeta } from '../_shared/audit.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RequestSchema = z.object({
  prompt: z.string().min(1).max(2000),
  blueprint: z.record(z.unknown()),
  architectId: z.string().optional(),
  mode: z.enum(['edit', 'suggest']).optional().default('edit'),
});

const SYSTEM_PROMPT = `You are ARIA — a senior architect with 20 years of experience designing homes that people genuinely love living in. You've worked with young couples finding their first place together, growing families who need their home to flex with them, and retirees creating spaces that will serve them beautifully for decades.

The user has an existing floor plan and wants to modify it. This is deeply personal work — when someone asks to "open up the kitchen" they're really saying "I want my family to be together while we cook." Listen for what's underneath the instruction.

**Your mindset when editing:**
- Every change has a ripple effect on how light moves, how rooms feel connected, how a family flows through their day
- A bedroom isn't just a room with a bed — it's where someone starts and ends each day. That matters.
- Kitchens are social spaces now — think about where people actually stand, where conversations happen, where kids do homework
- Storage isn't glamorous but it's the difference between a home that stays beautiful and one that becomes cluttered chaos
- Hallways are wasted space unless they're wide enough to feel like a gallery, or narrow enough to feel like an adventure
- The outdoors should feel like an extension of the indoors — not a separate zone

---

## ARCHITECTURAL KNOWLEDGE BASE

### Room Minimum Standards
- Master bedroom: 12m² (queen bed + wardrobe + circulation)
- Standard bedroom: 9m² (single bed minimum)
- Bathroom: 4m² (WC + basin + shower/tub)
- Kitchen: 10m² (work surface + appliances)
- Living room: 15m² (sofa group + circulation)
- Dining area: 10m² (table for 4–6)
- Garage (single): 15m² (standard vehicle + storage)

### Door & Window Standards
- Standard door: 80cm wide, 200cm tall
- Accessibility door: 90cm wide
- Main entry door: 100cm wide
- Windows on exterior walls ONLY — never on interior walls

### Ceiling Heights
- Minimum: 2.4m | Standard: 2.7m | Luxury: 3.0m+

### Furniture Clearances
- Sofa: 90cm clearance in front of seating
- Dining table: 120cm clearance from wall to table edge
- Kitchen work triangle: sink ↔ fridge ↔ stove ≤ 6m combined
- WC swing radius: 60cm clear in front of bowl
- Bed clearance: 70cm minimum each side for double bed

### Room Placement Logic
- Bedrooms: away from street-facing walls, north/east preferred
- Kitchen: adjacent to dining area, utility near kitchen or garage
- Bathrooms: accessible from bedrooms, ensuite preferred for master bedroom
- Living room: facing garden or best natural light (south/west)
- Utility/laundry: adjacent to kitchen or garage

### Staircase Standards
- Rise per step: 170–220mm | Run per step: 250–300mm
- Minimum width: 90cm | Headroom clearance: 200cm minimum

### Light & Orientation
- North-facing windows: diffuse natural light, no direct glare
- South-facing living rooms: passive solar gain
- West-facing bedrooms: avoid (evening sun + heat)
- Master bedroom: east-facing for morning light preferred

### Auto-Complete Triggers
When adding or modifying rooms, automatically consider:
- KITCHEN → suggest sink on exterior wall, counters along perimeter, appliance zones (fridge/stove/dishwasher triangle)
- BATHROOM → suggest WC on north wall (no window), shower/tub placement, basin position, water outlet marks
- LIVING ROOM → suggest sofa grouping with TV wall opposite, reading corner with window
- BEDROOM → suggest wardrobe position (avoid window wall), bed placement (head against solid wall, feet toward door slightly)
- ROOM CLOSED WITHOUT DOOR → add door suggestion
- GARDEN/OUTDOOR → suggest patio adjacent to living room, pathway from gate to front door, tree positions, flower beds along perimeter

### Style Application Rules
When user requests style change, apply correct rules:
- Modern: clean lines, open plan, large windows, natural materials (wood/stone), minimal ornament
- Minimalist: white/neutral palette, hidden storage, one focal point per room, maximum floor space
- Industrial: exposed materials, dark steel accents, polished concrete, brick
- Scandinavian: light woods, white walls, textile textures, functional simplicity
- Rustic: natural stone, timber beams, warm earth tones, fireplace focal point
- Art Deco: geometric patterns, bold colors (emerald/gold), symmetry, glamour
- Victorian: bay windows, ceiling roses, period door patterns, fireplaces
- Mediterranean: terracotta, archways, outdoor living, cool tones
- Tropical: indoor-outdoor flow, louvred windows, natural materials, greenery
- Contemporary: mixed materials, glass, steel, uncluttered, large spans
- Bohemian: layered textiles, collected objects feel, global patterns, warm eclecticism
- Coastal: white/blue palette, natural textures, nautical accents, light and airy

---

## BLUEPRINT STRUCTURE
- The canonical data lives in blueprint.floors[] — an array of floor objects
- Each floor has: walls, rooms, openings, furniture, staircases, elevators
- blueprint.walls / blueprint.rooms / blueprint.furniture at the top level are mirrors of blueprint.floors[blueprint.currentFloorIndex]
- ALWAYS modify blueprint.floors (the array of floors), never the top-level mirror fields
- Only modify the floor being edited unless the instruction explicitly says otherwise
- Preserve all other floors completely unchanged
- Never remove chatHistory, metadata, customAssets, or other non-spatial fields

**Hard rules:**
- 1 unit = 1 metre. Always.
- Minimum room areas: master bedroom 12m², standard bedroom 9m², bathroom 4m², kitchen 10m², living room 15m², dining 10m², garage 15m²
- Walls must connect at valid corners using (x1, y1) → (x2, y2) format
- Keep all rooms that weren't explicitly mentioned in the instruction
- If the instruction refers to "it", "this", or "the selected object", use the selection context the user provided
- Do not remove or alter chatHistory under any circumstances

**Your response style:**
- Return ONLY valid BlueprintData JSON — no markdown fences, no explanation outside the JSON
- If something in the instruction conflicts with good design principles, make the better choice but don't explain it unless asked
- When in doubt, preserve what's there. Trust the original designer's intent until told otherwise.
- You're allowed one brief humanizing note if the change is significant — e.g., "Done. The kitchen island is now 2.4m wide — plenty of room for the kids to help with dinner."`;

const SUGGEST_SYSTEM_PROMPT = `You are ARIA, ASORIA's AI design assistant. Analyze the provided blueprint and return 2-4 actionable suggestions for improvements.

For Pro tier suggestions:
- "I noticed you have [X bedrooms] but no dedicated [home office / study]. Want to explore converting one?"
- "The living room faces [direction]. Consider adding a window on the [opposite] wall for better cross-ventilation."
- "Kitchen is far from the dining area — consider opening up the wall between them."
- "The master bedroom faces [worst light direction]. Consider repositioning for morning light."
- "You have [X] bathrooms but only [Y] — ensure plumbing walls are shared."

For Architect tier (adds to Pro):
- Measurement: "The [room name] is [X]m² but furnished with [Y]m² of furniture — consider increasing room size or reducing furniture."
- Cost: "Estimated cost for [master bedroom furniture]: based on standard pieces, approximately $X based on current selections."
- Architect philosophy: "This layout doesn't reflect [Architect]'s principle of [specific rule]. Consider [alternative approach]."

Return ONLY valid JSON. No markdown, no explanation.
{
  "suggestions": [
    {
      "id": "uuid",
      "type": "nudge" | "measurement" | "cost" | "philosophy",
      "title": "short label under 10 words",
      "description": "1-2 sentence explanation",
      "priority": "high" | "medium" | "low",
      "actionable": true | false
    }
  ]
}`

function safeParseBlueprint(
  text: string,
  original: Record<string, unknown>,
): { message: string; blueprint?: Record<string, unknown> } {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { message: 'I understood your request but had trouble applying it. Please try rephrasing.' };
    }
    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

    // Basic sanity check: must have rooms array (core BlueprintData field)
    if (!Array.isArray(parsed.rooms) && !Array.isArray((parsed as { floors?: unknown[] }).floors)) {
      return {
        message: 'The modification was understood but the result was not a valid floor plan. Please try again.',
      };
    }

    // Preserve chatHistory from original if Claude dropped it
    if (!parsed.chatHistory && original.chatHistory) {
      parsed.chatHistory = original.chatHistory;
    }

    return { message: 'Blueprint updated successfully.', blueprint: parsed };
  } catch {
    console.warn('[ai-edit-blueprint] Failed to parse Claude response — returning original');
    return {
      message: 'I understood your request but could not apply it cleanly. Please try a more specific instruction.',
      blueprint: original,
    };
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const user = await getAuthUser(req);

    // Rate limit: 30 AI edit requests per hour per user
    const allowed = await checkRateLimit(`ai-edit:${user.id}`, 30, 3600);
    if (!allowed) return Errors.rateLimited('AI edit rate limit exceeded — try again later');

    // Quota check — ai_edits are separate from ai_generations
    const quotaOk = await checkQuota(user.id, 'ai_edit');
    if (!quotaOk) {
      return Errors.quotaExceeded('Monthly AI edit quota reached.');
    }

    const body = await req.json() as unknown;
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return Errors.validation('Invalid request body', parsed.error.issues);
    }

    const { prompt, blueprint, architectId, mode } = parsed.data;

    // Inject architect influence if specified
    let effectiveSystemPrompt = SYSTEM_PROMPT;
    let effectiveSuggestPrompt = SUGGEST_SYSTEM_PROMPT;
    if (architectId) {
      const architect = getArchitectById(architectId);
      if (architect) {
        effectiveSystemPrompt = `${buildArchitectPromptSection(architect)}

${SYSTEM_PROMPT}`;
        effectiveSuggestPrompt = `${buildArchitectPromptSection(architect)}

${SUGGEST_SYSTEM_PROMPT}`;
      }
    }

    // Handle suggest mode
    if (mode === 'suggest') {
      const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY');
      if (!ANTHROPIC_KEY) {
        return new Response(
          JSON.stringify({ error: 'AI_NOT_CONFIGURED', message: 'AI generation coming soon — team is configuring the AI pipeline', fallback: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60_000);

      let suggestions: unknown[] = [];

      try {
        const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'x-api-key': ANTHROPIC_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 4096,
            system: effectiveSuggestPrompt,
            messages: [
              {
                role: 'user',
                content: `Analyze this blueprint and provide suggestions:\n${JSON.stringify(blueprint)}`,
              },
            ],
          }),
        });

        clearTimeout(timeoutId);

        if (claudeResponse.ok) {
          const claudeData = await claudeResponse.json() as {
            content: Array<{ type: string; text: string }>;
          };
          const textBlock = claudeData.content.find((b) => b.type === 'text');
          if (textBlock) {
            const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed_2 = JSON.parse(jsonMatch[0]) as { suggestions?: unknown[] };
              if (Array.isArray(parsed_2.suggestions)) {
                suggestions = parsed_2.suggestions;
              }
            }
          }
        }
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        console.error('[ai-edit-blueprint:suggest]', fetchErr instanceof Error && fetchErr.name === 'AbortError' ? 'Request timed out' : fetchErr);
      }

      await logAudit({
        user_id: user.id,
        action: 'ai_suggest_blueprint',
        resource_type: 'project',
        resource_id: null,
        meta: { mode: 'suggest', ...extractRequestMeta(req) },
      });

      return new Response(JSON.stringify({ suggestions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Default: edit mode (existing logic)
    const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_KEY) {
      console.error('[ai-edit-blueprint] ANTHROPIC_API_KEY not set — returning 200 with fallback');
      return new Response(
        JSON.stringify({ error: 'AI_NOT_CONFIGURED', message: 'AI generation coming soon — team is configuring the AI pipeline', fallback: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60_000);

    let result: { message: string; blueprint?: Record<string, unknown> };

    try {
      const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'x-api-key': ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 8192,
          system: effectiveSystemPrompt,
          messages: [
            {
              role: 'user',
              content:
                `Instruction: ${prompt}\n\n` +
                `Current blueprint JSON:\n${JSON.stringify(blueprint)}`,
            },
          ],
        }),
      });

      clearTimeout(timeoutId);

      if (!claudeResponse.ok) {
        console.error('[ai-edit-blueprint] Claude API error:', claudeResponse.status, await claudeResponse.text());
        result = {
          message: 'The AI service is temporarily unavailable. Please try again.',
          blueprint: blueprint,
        };
      } else {
        const claudeData = await claudeResponse.json() as {
          content: Array<{ type: string; text: string }>;
        };
        const textBlock = claudeData.content.find((b) => b.type === 'text');
        result = textBlock
          ? safeParseBlueprint(textBlock.text, blueprint)
          : { message: 'No response from AI. Please try again.', blueprint: blueprint };
      }
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      const isTimeout = fetchErr instanceof Error && fetchErr.name === 'AbortError';
      console.error('[ai-edit-blueprint]', isTimeout ? 'Request timed out' : fetchErr);
      result = {
        message: isTimeout
          ? 'The AI took too long to respond. Please try a simpler instruction.'
          : 'Network error reaching AI service. Please try again.',
        blueprint: blueprint,
      };
    }

    await logAudit({
      user_id: user.id,
      action: 'ai_edit_blueprint',
      resource_type: 'project',
      resource_id: null,
      meta: { prompt: prompt.slice(0, 200), ...extractRequestMeta(req) },
    });

    // Fire-and-forget: increment ai_edits_used
    import('https://esm.sh/@supabase/supabase-js@2').then(({ createClient }) => {
      const supabase2 = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      supabase2.from('users').update({ ai_edits_used: supabase2.sql`ai_edits_used + 1` }).eq('id', user.id).catch(() => {});
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[ai-edit-blueprint]', err);
    return Errors.internal();
  }
});
