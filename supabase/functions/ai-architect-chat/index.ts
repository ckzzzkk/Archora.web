import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { getAuthUser } from '../_shared/auth.ts';
import { checkQuota } from '../_shared/quota.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';
import { logAudit } from '../_shared/audit.ts';
import { Errors } from '../_shared/errors.ts';
import { getArchitectById, buildArchitectPromptSection } from '../_shared/architects.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// ──────────────────────────────────────────
// Types
// ──────────────────────────────────────────

type Tier = 'starter' | 'creator' | 'pro' | 'architect';
type QuestionCategory = 'qualification' | 'lifestyle' | 'future' | 'sustainability' | 'measurement' | 'budget' | 'architect_philosophy';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface GenerationPayload {
  buildingType?: string;
  plotSize?: number;
  plotUnit?: 'm2' | 'ft2';
  bedrooms?: number;
  bathrooms?: number;
  livingAreas?: number;
  hasGarage?: boolean;
  hasGarden?: boolean;
  hasPool?: boolean;
  poolSize?: 'small' | 'medium' | 'large';
  style?: string;
  referenceImageUrl?: string;
  additionalNotes?: string;
  transcript?: string;
  climateZone?: 'tropical' | 'subtropical' | 'temperate' | 'arid' | 'cold' | 'alpine';
  hemisphere?: 'north' | 'south';
  projectType?: 'new' | 'renovation' | 'extension';
  landOwned?: boolean;
  timeline?: string;
  budgetRange?: string;
  hasTeam?: boolean;
  // Lifestyle
  morningRoutine?: string;
  guestFrequency?: string;
  biggestFrustration?: string;
  outdoorLiving?: string;
  lackingRooms?: string;
  householdSize?: string;
  // Future
  lifeChanges?: string;
  agingInPlace?: string;
  sustainabilityImportance?: string;
  materialPreferences?: string;
  openPlanPreference?: string;
  mustHaveList?: string[];
  // Sustainability
  netZeroInterest?: string;
  renewableEnergy?: string;
  indoorAirQuality?: string;
  sustainableMaterials?: string;
  // Measurement
  plotDimensions?: string;
  topography?: string;
  naturalLight?: string;
  zoningRestrictions?: string;
  setbackRequirement?: string;
  geotechnicalData?: string;
  // Budget
  budgetBreakdown?: string;
  costPerSqm?: string;
  contingencyFunds?: string;
  phasedBuild?: string;
  // Architect philosophy
  architectPhilosophyResponse?: string;
}

interface Question {
  question: string;
  replies: string[];
  payloadHints: Partial<GenerationPayload>;
  architectId?: string;
}

// ──────────────────────────────────────────
// Question Bank
// ──────────────────────────────────────────

const QUALIFICATION_QUESTIONS: Question[] = [
  {
    question: "Is this a new construction project or a renovation?",
    replies: ["New construction", "Renovation", "Extension", "Just exploring"],
    payloadHints: { projectType: 'new' },
  },
  {
    question: "Do you already own the land or property?",
    replies: ["Yes, I own it", "Under contract", "Still looking", "Not yet"],
    payloadHints: {},
  },
  {
    question: "What's your approximate timeline — are you looking to start within 6 months, a year, or just exploring options?",
    replies: ["Within 6 months", "About a year", "Just exploring", "Timeline flexible"],
    payloadHints: {},
  },
  {
    question: "What budget range are you working with for this project?",
    replies: ["Under $150k", "$150k-$300k", "$300k-$500k", "Over $500k"],
    payloadHints: {},
  },
  {
    question: "Are you working with any other designers or contractors yet?",
    replies: ["Yes, I have a team", "Looking for help", "Going solo for now", "Just starting to look"],
    payloadHints: {},
  },
];

const LIFESTYLE_QUESTIONS: Question[] = [
  {
    question: "Walk me through a typical day in your home — when do you wake up, how do you use the kitchen?",
    replies: ["Early riser, coffee in bed", "Family breakfast chaos", "Quiet solo mornings", "I grab something and go"],
    payloadHints: {},
  },
  {
    question: "How often do you have guests over? Do you entertain formally or informally?",
    replies: ["Every weekend", "A few times a month", "Rarely", "We host large gatherings"],
    payloadHints: {},
  },
  {
    question: "What's your biggest frustration with your current living space?",
    replies: ["Not enough storage", "Too dark", "Kitchen is cramped", "No outdoor connection", "Everything feels too small"],
    payloadHints: {},
  },
  {
    question: "Do you have outdoor living requirements — patios, outdoor kitchens, garden areas?",
    replies: ["Yes, a large outdoor area", "Small patio or balcony", "Garden is important", "Indoor-outdoor isn't a priority"],
    payloadHints: {},
  },
  {
    question: "What rooms do you feel are most lacking in your current home?",
    replies: ["A proper home office", "A bigger kitchen", "More bedrooms", "A dedicated laundry room", "Better bathrooms"],
    payloadHints: {},
  },
  {
    question: "How many people will regularly use this space?",
    replies: ["Just me", "Couple", "Small family (3-4)", "Large family (5+)", "Extended family often stays"],
    payloadHints: {},
  },
];

const FUTURE_QUESTIONS: Question[] = [
  {
    question: "Are you planning major life changes over the next 5-10 years — children, aging parents, working from home full-time?",
    replies: ["Starting a family soon", "Kids moving out soon", "Parents may move in", "Working from home permanently", "No major changes planned"],
    payloadHints: {},
  },
  {
    question: "Is aging in place or accessibility something you want to plan for now?",
    replies: ["Yes, important for the long term", "Some considerations", "Not a priority right now", "Single-level living preferred"],
    payloadHints: {},
  },
  {
    question: "How important is sustainability to you? Are you interested in solar, geothermal, or other green features?",
    replies: ["Very important — full green build", "Some sustainable features", "Not a priority", "Already planning solar/green"],
    payloadHints: {},
  },
  {
    question: "What building materials are you drawn to — timber, concrete, steel, glass — and are there any you want to avoid?",
    replies: ["Natural materials preferred", "Modern industrial look", "Mix of everything", "Haven't thought about it yet"],
    payloadHints: {},
  },
  {
    question: "How do you feel about open-plan versus more compartmentalized spaces?",
    replies: ["Love open plan", "Mostly open with some privacy", "Prefer distinct rooms", "Depends on the room"],
    payloadHints: {},
  },
  {
    question: "What is your must-have list for this project?",
    replies: ["Energy efficiency", "Home office", "Outdoor living", "Home gym", "Media room", "Large kitchen"],
    payloadHints: {},
  },
];

const SUSTAINABILITY_QUESTIONS: Question[] = [
  {
    question: "Are you interested in net-zero or passive house standards?",
    replies: ["Yes, full net-zero", "Some energy-saving features", "Not a priority", "Already researching"],
    payloadHints: {},
  },
  {
    question: "Do you want to integrate renewable energy — solar panels, rainwater harvesting, geothermal?",
    replies: ["Yes, all of these", "Solar panels at minimum", "Just looking into it", "No renewable energy planned"],
    payloadHints: {},
  },
  {
    question: "How important is indoor air quality and natural ventilation to you?",
    replies: ["Critical — major priority", "Important", "Somewhat important", "Not a concern"],
    payloadHints: {},
  },
  {
    question: "Are you interested in sustainable or locally-sourced materials?",
    replies: ["Yes, very important", "Where possible", "Not a priority", "Depends on cost"],
    payloadHints: {},
  },
];

const MEASUREMENT_QUESTIONS: Question[] = [
  {
    question: "What are the precise dimensions and orientation of your plot? Do you have a survey or site plan available?",
    replies: ["Yes, exact dimensions with survey", "Approximate size only", "I need to measure it", "Not applicable — it's an apartment"],
    payloadHints: {},
  },
  {
    question: "Can you describe the topography of the site — flat, sloping, with existing structures?",
    replies: ["Flat and clear", "Slightly sloped", "Steeply sloped", "Has existing structures to work around"],
    payloadHints: {},
  },
  {
    question: "What is the natural light situation on the site throughout the day? Any significant shadows from neighboring structures or trees?",
    replies: ["Full sun all day", "Some shadows from trees", "Neighbor structures block light", "Variable through the day"],
    payloadHints: {},
  },
  {
    question: "Are there any zoning restrictions, easements, or building codes that might affect the design?",
    replies: ["None that I know of", "Yes, there are restrictions", "I need to check", "Working with an architect on this"],
    payloadHints: {},
  },
  {
    question: "What is the official plot boundary and setback requirement for your municipality?",
    replies: ["I have the exact requirements", "I know the approximate limits", "Not sure, need to find out", "Setbacks are minimal"],
    payloadHints: {},
  },
  {
    question: "Do you have geotechnical survey data — soil conditions, drainage patterns?",
    replies: ["Yes, full survey done", "Brief soil report", "Not yet", "On a rocky hillside"],
    payloadHints: {},
  },
];

const BUDGET_QUESTIONS: Question[] = [
  {
    question: "Can you break down your budget — what are you comfortable spending on hard construction versus soft costs (fees, permits, furnishings)?",
    replies: ["I have a clear breakdown", "Rough estimate only", "Flexible within reason", "Budget is a constraint right now"],
    payloadHints: {},
  },
  {
    question: "What cost per square meter are you targeting for the build?",
    replies: ["Economy — under $1500/m²", "Mid-spec — $1500-2500/m²", "High-spec — $2500-4000/m²", "Luxury — $4000+/m²"],
    payloadHints: {},
  },
  {
    question: "Do you have contingency funds set aside for unexpected costs?",
    replies: ["Yes, 15-20% contingency", "About 10% contingency", "Minimal contingency", "Working on this now"],
    payloadHints: {},
  },
  {
    question: "Are there phase-able components to manage cash flow — can the project be built in stages?",
    replies: ["Yes, phasing is possible", "Prefer to build all at once", "Some parts could be phased", "Need to keep it all together"],
    payloadHints: {},
  },
];

const ARCHITECT_PHILOSOPHY_QUESTIONS: Question[] = [
  {
    architectId: 'frank-lloyd-wright',
    question: "How do you want your landscape and interior to feel unified — as one flowing experience?",
    replies: ["Completely connected — seamless flow", "Some connection, but distinct zones", "Separate — clear boundaries preferred"],
    payloadHints: {},
  },
  {
    architectId: 'louis-kahn',
    question: "What role does natural light play in your vision for this home?",
    replies: ["Light as the primary material", "Good daylighting is essential", "Prefer softer, controlled light", "Not a major concern"],
    payloadHints: {},
  },
  {
    architectId: 'zaha-hadid',
    question: "Do you value bold, flowing forms or more restrained, geometric precision?",
    replies: ["Bold, sculptural forms excite me", "Restrained but distinctive", "Something in between", "I want to be surprised"],
    payloadHints: {},
  },
  {
    architectId: 'tadao-ando',
    question: "What does 'silence' mean to you in a home — stillness, privacy, simplicity?",
    replies: ["Complete calm and minimalism", "A sense of privacy and retreat", "Simplicity and clarity", "Just peaceful, not austere"],
    payloadHints: {},
  },
  {
    architectId: 'peter-zumthor',
    question: "What sensory experiences do you want your home to evoke — the smell of timber, sound of rain, warmth of stone?",
    replies: ["Rich sensory environment", "Primarily visual beauty", "Comfort and warmth above all", "Minimal sensory impact"],
    payloadHints: {},
  },
  {
    architectId: 'kengo-kuma',
    question: "Would you describe your ideal home as something that disappears into its landscape or asserts itself boldly?",
    replies: ["Disappears into nature", "Subtle but present", "Balanced between both", "Architecture as a statement"],
    payloadHints: {},
  },
  {
    architectId: 'bjarke-ingels',
    question: "How important is it that your home gives back to the neighborhood — green roofs, public spaces, sustainability as joy?",
    replies: ["Very important — architecture for all", "Some features would be nice", "Privacy is more important", "Not a consideration for me"],
    payloadHints: {},
  },
  {
    architectId: 'norman-foster',
    question: "How do you feel about technology-integrated architecture — smart systems, active facades, energy-generating buildings?",
    replies: ["Love tech-integrated design", "Practical smart home features", "Technology should be invisible", "Less tech, more natural"],
    payloadHints: {},
  },
  {
    architectId: 'le-corbusier',
    question: "Do you believe a house should function as a precise machine for living, or as a warm, organic extension of its inhabitants?",
    replies: ["Machine-like precision appeals", "Warm and organic, but efficient", "Somewhere in between", "Form follows how I actually live"],
    payloadHints: {},
  },
  {
    architectId: 'santiago-calatrava',
    question: "Would you want your home to be a sculptural landmark, or do you prefer architecture that serves quietly?",
    replies: ["A landmark I can be proud of", "Architecture that serves, not shouts", "Bold but contextual", "I'm open to the unexpected"],
    payloadHints: {},
  },
  {
    architectId: 'alain-carle',
    question: "How does your home need to respond to your climate — extreme cold, heat, coastal salt air?",
    replies: ["Year-round cold resilience is key", "Hot climate, cooling priority", "Temperate — balance of both", "Mild climate, not a concern"],
    payloadHints: {},
  },
  {
    architectId: 'rem-koolhaas',
    question: "Do you embrace complexity in your life — multiple uses, layered programs, productive chaos — or do you prefer simplicity?",
    replies: ["I thrive on complexity", "Some complexity, but controlled", "Simple is better for me", "Depends on the room/zone"],
    payloadHints: {},
  },
];

// Tier → categories in order
const TIER_CATEGORIES: Record<Tier, QuestionCategory[]> = {
  starter: ['qualification'],
  creator: ['qualification', 'lifestyle'],
  pro: ['qualification', 'lifestyle', 'future', 'sustainability'],
  architect: ['qualification', 'lifestyle', 'future', 'sustainability', 'measurement', 'budget', 'architect_philosophy'],
};

// ──────────────────────────────────────────
// Completion threshold
// ──────────────────────────────────────────

const COMPLETION_THRESHOLDS: Record<Tier, { min: number; categories: QuestionCategory[] }> = {
  starter: { min: 5, categories: ['qualification'] },
  creator: { min: 9, categories: ['qualification', 'lifestyle'] },
  pro: { min: 14, categories: ['qualification', 'lifestyle', 'future', 'sustainability'] },
  architect: { min: 18, categories: ['qualification', 'lifestyle', 'future', 'sustainability', 'measurement', 'budget', 'architect_philosophy'] },
};

// ──────────────────────────────────────────
// All question banks merged for payload hint lookup
// ──────────────────────────────────────────

const ALL_QUESTIONS: Question[] = [
  ...QUALIFICATION_QUESTIONS,
  ...LIFESTYLE_QUESTIONS,
  ...FUTURE_QUESTIONS,
  ...SUSTAINABILITY_QUESTIONS,
  ...MEASUREMENT_QUESTIONS,
  ...BUDGET_QUESTIONS,
  ...ARCHITECT_PHILOSOPHY_QUESTIONS,
];

// ──────────────────────────────────────────
// Extract consultation insights from conversation history
// (stateless approach — client sends full history each request)
// ──────────────────────────────────────────

function extractConsultationInsights(conversationHistory: ChatMessage[]): {
  consultationInsights: Partial<GenerationPayload>;
  updatedPayload: Partial<GenerationPayload>;
} {
  const consultationInsights: Partial<GenerationPayload> = {};

  for (const msg of conversationHistory) {
    if (msg.role !== 'user') continue;

    const userText = msg.content.trim();
    // Find which question this answer matches by looking for the closest
    // prior assistant message that matches a known question
    for (const q of ALL_QUESTIONS) {
      const matchedReply = q.replies.find(r =>
        userText.toLowerCase() === r.toLowerCase() ||
        userText.toLowerCase().includes(r.toLowerCase()) ||
        r.toLowerCase().includes(userText.toLowerCase())
      );
      if (matchedReply && Object.keys(q.payloadHints).length > 0) {
        // Merge payload hints into consultationInsights
        Object.assign(consultationInsights, q.payloadHints);
        break;
      }
    }
  }

  // consultationInsights are stored as notes since payloadHints keys
  // may not map 1:1 to GenerationPayload — append as structured notes
  const updatedPayload: Partial<GenerationPayload> = {
    ...consultationInsights,
  };

  return { consultationInsights, updatedPayload };
}

// ──────────────────────────────────────────
// Input schema
// ──────────────────────────────────────────

const RequestSchema = z.object({
  tier: z.enum(['starter', 'creator', 'pro', 'architect']),
  architectId: z.string().nullable().optional(),
  conversationHistory: z.array(
    z.object({ role: z.enum(['user', 'assistant']), content: z.string() }),
  ).optional().default([]),
  currentPayload: z.record(z.unknown()).optional().default({}),
  sessionId: z.string().optional(),
});

// ──────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────

function getNextCategory(tier: Tier, questionsAsked: number, currentCategory: QuestionCategory): QuestionCategory {
  const cats = TIER_CATEGORIES[tier];
  const idx = cats.indexOf(currentCategory);
  if (idx < cats.length - 1) return cats[idx + 1];
  return currentCategory;
}

function isComplete(tier: Tier, questionsAsked: number, category: QuestionCategory): boolean {
  const t = COMPLETION_THRESHOLDS[tier];
  const categoryIndex = t.categories.indexOf(category);
  return questionsAsked >= t.min || categoryIndex === t.categories.length - 1;
}

function buildWizardSummary(payload: Partial<GenerationPayload>): string {
  const parts: string[] = [];
  if (payload.buildingType) parts.push(`building type: ${payload.buildingType}`);
  if (payload.plotSize) parts.push(`plot size: ${payload.plotSize} ${payload.plotUnit ?? 'm²'}`);
  if (payload.bedrooms != null) parts.push(`${payload.bedrooms} bedroom${payload.bedrooms !== 1 ? 's' : ''}`);
  if (payload.bathrooms != null) parts.push(`${payload.bathrooms} bathroom${payload.bathrooms !== 1 ? 's' : ''}`);
  if (payload.livingAreas != null) parts.push(`${payload.livingAreas} living area${payload.livingAreas !== 1 ? 's' : ''}`);
  if (payload.hasGarage) parts.push('garage');
  if (payload.hasGarden) parts.push('garden');
  if (payload.hasPool) parts.push(`pool (${payload.poolSize ?? 'medium'})`);
  if (payload.style) parts.push(`style: ${payload.style}`);
  return parts.length > 0 ? `The client has already provided via the structured wizard: ${parts.join(', ')}.` : 'The client has not yet completed the wizard steps.';
}

function buildSystemPrompt(
  tier: Tier,
  architectId: string | null,
  payload: Partial<GenerationPayload>,
  sessionId: string,
): string {
  const tierDepth: Record<Tier, string> = {
    starter: 'basic qualification only, warm and encouraging, simple vocabulary',
    creator: 'adds lifestyle and daily routine questions',
    pro: 'adds future planning, sustainability, accessibility questions',
    architect: 'full professional intake + measurement + budget + architect-philosophy-calibrated questions',
  };

  let prompt = `You are ARIA, ASORIA's AI architect consultation assistant. You're conducting a professional intake conversation with a client who is about to have their home designed.

Your role: ask thoughtful, specific questions that reveal how the client actually lives, not just what they want superficially. A great architect asks questions a client wouldn't think to answer themselves.

Current client tier: ${tier}
Adjust your question depth and tone:
- Starter: ${tierDepth.starter}
- Creator: ${tierDepth.creator}
- Pro: ${tierDepth.pro}
- Architect: ${tierDepth.architect}

${buildWizardSummary(payload)}

Ask ONE question at a time. After each question, provide 2-4 suggested replies as short oval-pill chips (2-4 words each).
Never ask two questions in one message.
If the client says something interesting or personal, acknowledge it briefly (one sentence) before asking the next question.
When the conversation is complete for this tier, say "Here's what I understood about you:" and synthesize a summary.

Conversation rules:
- Questions should feel like a professional consultation, not a form
- Keep questions short and specific — never ask two things at once
- Acknowledge interesting answers briefly before moving on
- If client gives a partial answer, explore it gently before moving to the next category
- Use [${sessionId}] in your response for tracking`;

  return prompt;
}

async function callClaude(
  systemPrompt: string,
  messages: ChatMessage[],
  architectId: string | null,
): Promise<string> {
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');

  if (!anthropicKey) {
    return JSON.stringify({
      error: 'AI_NOT_CONFIGURED',
      message: 'AI consultation coming soon — team is configuring the AI pipeline',
      fallback: true,
    });
  }

  // Inject architect influence into system prompt if set
  let effectiveSystemPrompt = systemPrompt;
  if (architectId) {
    const architect = getArchitectById(architectId);
    if (architect) {
      const architectSection = buildArchitectPromptSection(architect);
      effectiveSystemPrompt = `${architectSection}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${systemPrompt}`;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 55_000);

  let response: Response;
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        temperature: 0.7,
        system: effectiveSystemPrompt,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      }),
    });
  } catch (err) {
    clearTimeout(timeoutId);
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    throw new Error(isTimeout ? 'AI request timed out' : `Network error: ${String(err)}`);
  }
  clearTimeout(timeoutId);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Claude API error ${response.status}: ${body}`);
  }

  const data = await response.json() as {
    content: Array<{ type: string; text: string }>;
  };
  return data.content?.[0]?.text ?? '';
}

// ──────────────────────────────────────────
// Main server
// ──────────────────────────────────────────

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    let user;
    try {
      user = await getAuthUser(req);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Please sign in to use the architect chat', code: 'AUTH_REQUIRED' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Rate limit: 30 requests/hour
    const rateLimitOk = await checkRateLimit(`ai_architect_chat:${user.id}`, 30, 3600);
    if (!rateLimitOk) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Try again later.', code: 'RATE_LIMITED' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Quota check — uses same ai_generation quota as floor plan generation
    const quotaOk = await checkQuota(user.id, 'ai_generation');
    if (!quotaOk) {
      return new Response(
        JSON.stringify({ error: 'Monthly AI quota reached.', code: 'QUOTA_EXCEEDED' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request', code: 'VALIDATION_ERROR', details: parsed.error.issues }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const {
      tier,
      architectId,
      conversationHistory = [],
      currentPayload = {},
      sessionId: existingSessionId,
    } = parsed.data;

    const payload = currentPayload as Partial<GenerationPayload>;

    // Extract consultation insights from conversation history (Issue 1)
    const { consultationInsights, updatedPayload } = extractConsultationInsights(conversationHistory);

    // Merge extracted insights into the base payload for the response
    const finalPayload: Partial<GenerationPayload> = { ...payload, ...consultationInsights };

    // Generate or persist session ID
    const sessionId = existingSessionId ?? crypto.randomUUID();

    // Count existing AI questions to track progress
    const questionsAsked = conversationHistory.filter(m => m.role === 'assistant').length;

    // Determine starting category from question count
    const cats = TIER_CATEGORIES[tier];
    let currentCategory: QuestionCategory = cats[Math.min(questionsAsked > 0 ? Math.floor(questionsAsked / 3) : 0, cats.length - 1)];

    // If we've completed the current category, move to next
    if (isComplete(tier, questionsAsked, currentCategory)) {
      currentCategory = getNextCategory(tier, questionsAsked, currentCategory);
    }

    // Build system prompt
    const systemPrompt = buildSystemPrompt(tier, architectId ?? null, payload, sessionId);

    // Call Claude
    let rawResponse: string;
    try {
      rawResponse = await callClaude(systemPrompt, conversationHistory, architectId ?? null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[ai-architect-chat] Claude error:', msg);
      return new Response(
        JSON.stringify({ error: 'AI consultation failed', code: 'UPSTREAM_ERROR', detail: msg }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Parse response
    let message = rawResponse;
    try {
      const parsed_1 = JSON.parse(rawResponse);
      if (parsed_1.fallback) {
        // AI not configured — return graceful fallback
        return new Response(JSON.stringify({
          message: parsed_1.message ?? "The AI consultation isn't quite ready yet. Check back soon!",
          suggestedReplies: ["I'll come back later", "Continue with what I have", "Tell me more about architects"],
          updatedPayload: finalPayload,
          consultationInsights,
          isComplete: false,
          nextCategory: currentCategory,
          sessionId,
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    } catch {
      // Not JSON — it's a natural language response
    }

    // Check for completion signal
    const isConversationComplete = isComplete(tier, questionsAsked + 1, currentCategory);

    // Extract suggested replies by looking for quoted short phrases or em-dash lists
    // The response already contains suggested replies from the model — just pass it through
    const suggestedReplies = extractSuggestedReplies(rawResponse);

    // Log audit — consultation_chat (not ai_generate, which is for floor-plan generation)
// Session persistence is client-side (Approach C — stateless LLM-driven conversation
// session). The sessionId is used for tracking/continuity only, not DB writes here.
    await logAudit({
      user_id: user.id,
      action: 'consultation_chat',
      resource_type: 'consultation',
      metadata: { tier, architectId, sessionId, questionsAsked },
    });

    return new Response(JSON.stringify({
      message,
      suggestedReplies,
      updatedPayload: finalPayload,
      consultationInsights,
      isComplete: isConversationComplete,
      nextCategory: currentCategory,
      sessionId,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[ai-architect-chat] Unexpected error:', err);
    if (err instanceof Response) {
      const h = new Headers(err.headers);
      for (const [k, v] of Object.entries(corsHeaders)) h.set(k, v);
      return new Response(err.body, { status: err.status, headers: h });
    }
    return new Response(
      JSON.stringify({ error: 'Internal server error', code: 'INTERNAL_ERROR' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

function extractSuggestedReplies(text: string): string[] {
  // Look for bullet patterns: "1. Option" or "- Option" or "• Option"
  const bulletRegex = /(?:^|\n)\s*[-•*]\s*(.+?)(?:\n|$)/gm;
  const numberedRegex = /(?:^|\n)\s*\d+\.\s*(.+?)(?:\n|$)/gm;
  const quotesRegex = /"([^"]+)"/g;

  const replies: string[] = [];
  const seen = new Set<string>();

  const add = (s: string) => {
    const trimmed = s.trim();
    if (trimmed.length > 0 && trimmed.length < 50 && !seen.has(trimmed)) {
      seen.add(trimmed);
      replies.push(trimmed);
    }
  };

  let m;
  while ((m = bulletRegex.exec(text)) !== null) add(m[1]);
  while ((m = numberedRegex.exec(text)) !== null) add(m[1]);
  while ((m = quotesRegex.exec(text)) !== null) add(m[1]);

  // Fallback if nothing found
  if (replies.length === 0) {
    return ["That's helpful", "Let me think about it", "Tell me more", "Next question please"];
  }

  return replies.slice(0, 4);
}
