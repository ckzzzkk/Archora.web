/**
 * aiLimits.ts — Consolidated AI usage limit constants
 * Single source of truth for all AI feature limits (client + server)
 */

export type ModelProvider = 'anthropic' | 'deepseek';

// Tier limits + architect maps live in tierConstants.ts (pure, no Deno refs)
// so the vitest consistency suite can import them; re-exported here so edge
// function call sites are unchanged.
export {
  TIER_AI_LIMITS,
  ARCHITECT_TOKEN_MULTIPLIERS,
  ARCHITECT_TIER_REQUIRED,
  TIER_ARCHITECT_COUNT,
  getArchitectMultiplier,
  getArchitectTierRequired,
} from './tierConstants.ts';
export type { Tier, QuotaType } from './tierConstants.ts';

export const TIER_AI_MODELS = {
  // Generation is the most geometrically demanding task — all paid tiers use the
  // strongest model (claude-sonnet-4-6). Cheaper models stay on lighter tasks (chat/edits).
  starter:  { generation: null,                      chat: null,                      edits: null,                      refine: null,                      fallback: null,                      photoAnalysis: null,                      softCap: 0 },
  creator:  { generation: 'claude-sonnet-4-6',       chat: 'deepseek-chat',           edits: 'deepseek-chat',           refine: null,                      fallback: null,                      photoAnalysis: 'claude-haiku-4-5-20251001', softCap: 25 },
  pro:      { generation: 'claude-sonnet-4-6',       chat: 'claude-haiku-4-5-20251001', edits: 'deepseek-chat',         refine: 'deepseek-chat',           fallback: 'deepseek-chat',           photoAnalysis: 'claude-haiku-4-5-20251001', softCap: 50 },
  architect:{ generation: 'claude-sonnet-4-6',       chat: 'claude-sonnet-4-6',       edits: 'claude-haiku-4-5-20251001', refine: 'claude-sonnet-4-6',     fallback: 'claude-haiku-4-5-20251001', photoAnalysis: 'claude-sonnet-4-6',      softCap: 50 },
} as const;

export type TIER_MODEL_KEY = keyof typeof TIER_AI_MODELS;

export type AICallType = 'generation' | 'chat' | 'edits' | 'refine';

export function getModelProvider(model: string): ModelProvider {
  if (model.startsWith('claude-')) return 'anthropic';
  if (model.startsWith('deepseek-')) return 'deepseek';
  return 'anthropic';
}

export interface AIRequestConfig {
  url: string;
  headers: Record<string, string>;
  body: unknown;
  provider: ModelProvider;
}

export function buildAIRequest(
  model: string,
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  maxTokens: number,
  temperature = 0,
): AIRequestConfig {
  const provider = getModelProvider(model);
  if (provider === 'deepseek') {
    return {
      url: 'https://api.deepseek.com/v1/chat/completions',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('DEEPSEEK_API_KEY') ?? ''}`,
        'Content-Type': 'application/json',
      },
      body: {
        model,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        max_tokens: maxTokens,
        temperature,
      },
      provider: 'deepseek',
    };
  } else {
    return {
      url: 'https://api.anthropic.com/v1/messages',
      headers: {
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') ?? '',
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: {
        model,
        system: systemPrompt,
        messages,
        max_tokens: maxTokens,
        temperature,
      },
      provider: 'anthropic',
    };
  }
}

export interface AIResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  /**
   * 'max_tokens' means the model hit the output budget and the content is
   * TRUNCATED — JSON in it will not parse. Callers should retry with a larger
   * budget or return a structured error rather than a generic parse failure.
   */
  stopReason: 'end' | 'max_tokens' | 'other';
}

export function parseAIResponse(provider: ModelProvider, responseData: unknown): AIResponse {
  if (provider === 'deepseek') {
    const data = responseData as {
      choices: Array<{ message: { content: string }; finish_reason?: string }>;
      usage: { prompt_tokens: number; completion_tokens: number };
    };
    const finish = data.choices[0]?.finish_reason;
    return {
      content: data.choices[0]?.message?.content ?? '',
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
      stopReason: finish === 'length' ? 'max_tokens' : finish === 'stop' ? 'end' : 'other',
    };
  } else {
    const data = responseData as {
      content: Array<{ type: string; text?: string }>;
      usage?: { input_tokens: number; output_tokens: number };
      stop_reason?: string;
    };
    return {
      content: data.content?.[0]?.type === 'text' ? (data.content[0].text ?? '') : '',
      inputTokens: data.usage?.input_tokens ?? 0,
      outputTokens: data.usage?.output_tokens ?? 0,
      stopReason: data.stop_reason === 'max_tokens' ? 'max_tokens' : data.stop_reason === 'end_turn' ? 'end' : 'other',
    };
  }
}

export function getUserTierFromSupabase(supabaseClient: ReturnType<typeof import('https://esm.sh/@supabase/supabase-js@2')['createClient']>, userId: string): Promise<string> {
  return supabaseClient.rpc('get_user_tier', { user_id: userId }).then(({ data, error }) => {
    if (error || !data) return 'starter';
    return data as string;
  });
}

/** Returns the model to use for a chat call, applying silent degradation at soft cap */
export function resolveChatModel(
  tier: string,
  todayMessageCount: number,
): { model: string | null; provider: ModelProvider } {
  const config = TIER_AI_MODELS[tier as keyof typeof TIER_AI_MODELS] ?? TIER_AI_MODELS.starter;
  if (!config.chat) return { model: null, provider: 'anthropic' };

  const effectiveModel = todayMessageCount >= config.softCap && config.fallback
    ? config.fallback
    : config.chat;

  return {
    model: effectiveModel,
    provider: getModelProvider(effectiveModel),
  };
}
