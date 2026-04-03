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

const SYSTEM_PROMPT =
  `You are ARIA, a world-class AI architecture assistant with 20 years of experience. ` +
  `The user has an existing floor plan blueprint and wants to modify it. ` +
  `You will receive the current blueprint as JSON and a modification instruction. ` +
  `Apply the modification and return the updated blueprint as valid JSON that matches ` +
  `the exact same schema as the input — same field names, same nested structure. ` +
  `Architectural rules:\n` +
  `- 1 unit = 1 metre throughout\n` +
  `- Minimum room area: bedroom 9m², bathroom 3m², kitchen 6m², living room 12m²\n` +
  `- Walls must connect at valid corners (x1,y1 → x2,y2 format)\n` +
  `- Keep all rooms that were not mentioned in the instruction\n` +
  `- Do not remove chatHistory, metadata, or other non-spatial fields\n` +
  `Return ONLY valid JSON — no markdown fences, no explanation, no commentary.`;

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
      console.error('[ai-edit-blueprint] ANTHROPIC_API_KEY not set — returning 503');
      return new Response(
        JSON.stringify({ error: 'AI_NOT_CONFIGURED' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
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
