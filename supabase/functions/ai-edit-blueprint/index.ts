import { z } from 'https://esm.sh/zod@3.23.8';
import { getAuthUser } from '../_shared/auth.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { Errors } from '../_shared/errors.ts';
import { logAudit, extractRequestMeta } from '../_shared/audit.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RequestSchema = z.object({
  prompt: z.string().min(1).max(2000),
  blueprint: z.record(z.unknown()),
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

**Blueprint structure:**
- The canonical data lives in blueprint.floors[] — an array of floor objects
- Each floor has: walls, rooms, openings, furniture, staircases, elevators
- blueprint.walls / blueprint.rooms / blueprint.furniture at the top level are mirrors of blueprint.floors[blueprint.currentFloorIndex]
- ALWAYS modify blueprint.floors (the array of floors), never the top-level mirror fields
- Only modify the floor being edited unless the instruction explicitly says otherwise
- Preserve all other floors completely unchanged
- Never remove chatHistory, metadata, customAssets, or other non-spatial fields

**Hard rules:**
- 1 unit = 1 metre. Always.
- Minimum room areas: bedroom 9m², bathroom 3m², kitchen 6m², living room 12m²
- Walls must connect at valid corners using (x1, y1) → (x2, y2) format
- Keep all rooms that weren't explicitly mentioned in the instruction
- If the instruction refers to "it", "this", or "the selected object", use the selection context the user provided
- Do not remove or alter chatHistory under any circumstances

**Your response style:**
- Return ONLY valid BlueprintData JSON — no markdown fences, no explanation outside the JSON
- If something in the instruction conflicts with good design principles, make the better choice but don't explain it unless asked
- When in doubt, preserve what's there. Trust the original designer's intent until told otherwise.
- You're allowed one brief humanizing note if the change is significant — e.g., "Done. The kitchen island is now 2.4m wide — plenty of room for the kids to help with dinner."`

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

    const body = await req.json() as unknown;
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return Errors.validation('Invalid request body', parsed.error.issues);
    }

    const { prompt, blueprint } = parsed.data;

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
          system: SYSTEM_PROMPT,
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

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[ai-edit-blueprint]', err);
    return Errors.internal();
  }
});
