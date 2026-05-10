/**
 * aiLimits.ts — Consolidated AI usage limit constants
 * Single source of truth for all AI feature limits (client + server)
 */

export type QuotaType = 'ai_generation' | 'ai_edit' | 'render' | 'ar_scan';

export const TIER_AI_LIMITS = {
  starter: { aiGenerations: 10, aiEdits: 10, renders: 2, arScans: 0 },
  creator: { aiGenerations: 40, aiEdits: 40, renders: 10, arScans: 15 },
  pro: { aiGenerations: 100, aiEdits: 100, renders: 30, arScans: 30 },
  architect: { aiGenerations: -1, aiEdits: -1, renders: -1, arScans: -1 },
} as const;

export type Tier = keyof typeof TIER_AI_LIMITS;

export const ARCHITECT_TOKEN_MULTIPLIERS = {
  'frank-lloyd-wright': 1.0,
  'zaha-hadid': 1.5,
  'tadao-ando': 1.0,
  'norman-foster': 1.5,
  'le-corbusier': 1.0,
  'peter-zumthor': 1.5,
  'bjarke-ingels': 1.5,
  'kengo-kuma': 1.5,
  'alain-carle': 1.5,
  'santiago-calatrava': 2.0,
  'louis-kahn': 1.5,
  'rem-koolhaas': 2.0,
} as const;

export const ARCHITECT_TIER_REQUIRED = {
  'frank-lloyd-wright': 'starter',
  'zaha-hadid': 'starter',
  'tadao-ando': 'starter',
  'norman-foster': 'creator',
  'le-corbusier': 'creator',
  'peter-zumthor': 'creator',
  'bjarke-ingels': 'creator',
  'kengo-kuma': 'pro',
  'alain-carle': 'pro',
  'louis-kahn': 'pro',
  'santiago-calatrava': 'pro',
  'rem-koolhaas': 'architect',
} as const;

export const TIER_ARCHITECT_COUNT = {
  starter: 3,
  creator: 7,
  pro: 11,
  architect: 12,
} as const;

/** Returns token cost multiplier (1.0, 1.5, or 2.0) */
export function getArchitectMultiplier(architectId: string): number {
  return ARCHITECT_TOKEN_MULTIPLIERS[architectId as keyof typeof ARCHITECT_TOKEN_MULTIPLIERS] ?? 1.0;
}

/** Returns minimum tier required to use an architect */
export function getArchitectTierRequired(architectId: string): Tier {
  return ARCHITECT_TIER_REQUIRED[architectId as keyof typeof ARCHITECT_TIER_REQUIRED] ?? 'starter';
}

export const TIER_AI_MODELS = {
  starter: { generation: null, chat: null, edits: null, refine: null, fallback: null, softCap: 0 },
  creator: { generation: 'deepseek-chat', chat: 'deepseek-chat', edits: 'deepseek-chat', refine: null, fallback: null, softCap: 25 },
  pro: { generation: 'deepseek-chat', chat: 'claude-haiku-4-5-20251001', edits: 'deepseek-chat', refine: 'deepseek-chat', fallback: 'deepseek-chat', softCap: 50 },
  architect: { generation: 'claude-haiku-4-5-20251001', chat: 'claude-sonnet-4-6', edits: 'claude-haiku-4-5-20251001', refine: 'claude-sonnet-4-6', fallback: 'claude-haiku-4-5-20251001', softCap: 50 },
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
        temperature: 0,
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
        temperature: 0,
      },
      provider: 'anthropic',
    };
  }
}

export interface AIResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
}

export function parseAIResponse(provider: ModelProvider, responseData: unknown): AIResponse {
  if (provider === 'deepseek') {
    const data = responseData as {
      choices: Array<{ message: { content: string } }>;
      usage: { prompt_tokens: number; completion_tokens: number };
    };
    return {
      content: data.choices[0]?.message?.content ?? '',
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
    };
  } else {
    const data = responseData as {
      content: Array<{ type: string; text?: string }>;
      usage?: { input_tokens: number; output_tokens: number };
    };
    return {
      content: data.content?.[0]?.type === 'text' ? (data.content[0].text ?? '') : '',
      inputTokens: data.usage?.input_tokens ?? 0,
      outputTokens: data.usage?.output_tokens ?? 0,
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
