# Architect Consultation Chat — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement two AI conversation features: (1) a pre-generation architect consultation chat that gathers professional intake data before floor plan generation, and (2) an enhanced in-editor refinement chat with tier-gated sophistication.

**Architecture:** Stateless `ai-architect-chat` Edge Function for pre-gen consultation with curated question bank per tier × category. Enhanced `ai-edit-blueprint` Edge Function for in-editor tier gating. New `ConsultationChat.tsx` component replaces Steps 5-6 of GenerationScreen.

**Tech Stack:** Deno Edge Functions · React Native (GenerationScreen) · BlueprintStore (Zustand) · TypeScript

---

## File Map

### Edge Functions (Deno)
- **Create:** `supabase/functions/ai-architect-chat/index.ts` — new consultation chat engine
- **Modify:** `supabase/functions/ai-edit-blueprint/index.ts` — add tier-gated enhancement modes

### React Native Client
- **Create:** `src/components/consultation/ConsultationChat.tsx` — main chat UI for Steps 5-6
- **Create:** `src/components/consultation/ConsultationSummary.tsx` — completion summary card
- **Create:** `src/components/consultation/SuggestionBubble.tsx` — Pro+ nudge in AIChatPanel
- **Modify:** `src/screens/generation/GenerationScreen.tsx` — route Steps 5-6 to ConsultationChat
- **Modify:** `src/screens/generation/steps/Step7Review.tsx` — display consultation summary
- **Modify:** `src/components/blueprint/AIChatPanel.tsx` — add Pro+/Architect tier capabilities
- **Modify:** `src/services/aiService.ts` — add `consultWithArchitect()` method
- **Modify:** `src/types/generation.ts` — add `ConsultationSummary` type
- **Modify:** `src/stores/blueprintStore.ts` — add suggestion nudge state

### Database
- **Create:** `supabase/migrations/021_consultation_sessions.sql` — new table for storing consultation state

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/021_consultation_sessions.sql`

```sql
-- consultation_sessions table
-- Stores full conversation history + synthesized summary per generation attempt

CREATE TABLE consultation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generation_session_id UUID, -- link to generation session if applicable
  tier TEXT NOT NULL DEFAULT 'starter', -- starter|creator|pro|architect
  architect_id TEXT, -- null = blended

  -- Conversation state
  conversation_history JSONB NOT NULL DEFAULT '[]',
  current_category TEXT NOT NULL DEFAULT 'qualification',
  questions_asked INTEGER NOT NULL DEFAULT 0,
  is_complete BOOLEAN NOT NULL DEFAULT FALSE,

  -- Synthesized summary (populated on completion)
  consultation_summary JSONB, -- see ConsultationSummary type

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE consultation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own consultation sessions"
  ON consultation_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_consultation_sessions_user_id ON consultation_sessions(user_id);
CREATE INDEX idx_consultation_sessions_generation_session_id ON consultation_sessions(generation_session_id);

-- Add column to existing generation_sessions table
ALTER TABLE generation_sessions ADD COLUMN consultation_session_id UUID REFERENCES consultation_sessions(id);
```

---

## Task 2: `ai-architect-chat` Edge Function

**Files:**
- Create: `supabase/functions/ai-architect-chat/index.ts`

**Input schema:**
```typescript
{
  tier: 'starter' | 'creator' | 'pro' | 'architect';
  architectId: string | null;
  conversationHistory: ChatMessage[];
  currentPayload: Partial<GenerationPayload>;
  sessionId?: string; // if resuming a session
}
```

**Output schema:**
```typescript
{
  message: string;
  suggestedReplies: string[];
  updatedPayload: Partial<GenerationPayload>;
  isComplete: boolean;
  nextCategory: QuestionCategory;
  sessionId: string; // return for subsequent calls
}
```

**Question bank structure** — questions organized as:
```typescript
const QUESTIONS_BY_TIER_AND_CATEGORY = {
  starter: {
    qualification: [
      {
        question: "Is this a new construction project or a renovation?",
        replies: ["New construction", "Renovation", "Extension", "Just exploring"],
        payloadHints: { projectType: 'new' | 'renovation' | 'extension' }
      },
      {
        question: "Do you already own the land or property?",
        replies: ["Yes, I own it", "Under contract", "Still looking", "Not yet"],
        payloadHints: {}
      },
      // ...
    ],
    // lifestyle, future, sustainability, measurement, budget, architect_philosophy
    // all empty for starter
  },
  creator: {
    qualification: [...], // same as starter
    lifestyle: [
      {
        question: "Walk me through a typical day in your home — when do you wake up, how do you use the kitchen?",
        replies: ["Early riser, coffee in bed", "Family breakfast chaos", "Quiet solo mornings", "I grab something and go"],
        payloadHints: {}
      },
      // ...
    ],
  },
  pro: {
    qualification: [...],
    lifestyle: [...],
    future: [
      {
        question: "Are you planning major life changes over the next 5-10 years — children, aging parents, working from home full-time?",
        replies: ["Starting a family soon", "Kids moving out soon", "Parents may move in", "No major changes planned"],
        payloadHints: {}
      },
      // ...
    ],
    sustainability: [...],
  },
  architect: {
    qualification: [...],
    lifestyle: [...],
    future: [...],
    sustainability: [...],
    measurement: [
      {
        question: "What are the precise dimensions and orientation of your plot? Do you have a survey or site plan available?",
        replies: ["Yes, I have exact dimensions", "I know the approximate size", "I need to measure it", "Not applicable — it's an apartment"],
        payloadHints: {}
      },
      // ...
    ],
    budget: [
      {
        question: "Can you break down your budget — what are you comfortable spending on hard construction versus soft costs (fees, permits, furnishings)?",
        replies: ["I have a clear budget", "Rough range in mind", "Flexible within reason", "Budget is a concern right now"],
        payloadHints: {}
      },
      // ...
    ],
    architect_philosophy: [
      // Per-architect questions, one per architect
      {
        architectId: 'frank-lloyd-wright',
        question: "How do you want your landscape and interior to feel unified — as one flowing experience?",
        replies: ["Completely connected — seamless flow", "Some connection, but distinct zones", "Separate — I want clear boundaries"],
        payloadHints: {}
      },
      {
        architectId: 'louis-kahn',
        question: "What role does natural light play in your vision for this home?",
        replies: ["Light as the primary material", "Good daylighting is important", "I prefer softer, controlled light", "Not a major concern"],
        payloadHints: {}
      },
      // ... (one per architect)
    ],
  },
};
```

**System prompt construction:**
```
You are [ArchitectName if selected], a visionary architect with [era].
Your philosophy: [philosophySummary]
Your approach to client consultation: ask thoughtful, specific questions that reveal how the client actually lives, not just what they want superficially.

Current client tier: [tier]
Adjust your question depth and tone accordingly.
- Starter: basic qualification only, simple vocabulary, warm and encouraging
- Creator: adds lifestyle and daily routine questions
- Pro: adds future planning, sustainability, accessibility
- Architect: full professional intake + measurement + budget + architect-philosophy-calibrated questions

The client has already provided via the structured wizard: [summarize buildingType, plotSize, rooms, style]

Ask ONE question at a time. After each question, provide 2-3 suggested replies as short chips (2-4 words each, oval-pill style).
Keep questions short and specific — never ask two things at once.
Acknowledge interesting answers briefly before moving to the next question.
When [isComplete conditions met], say "Here's what I understood about you" and synthesize the summary.

Example reply format:
[AI message]
suggestedReplies: ["Reply 1", "Reply 2", "Reply 3"]
```

**isComplete conditions by tier:**
- Starter: ≥5 questions asked + projectType answered + budget touched on
- Creator: ≥9 questions asked + lifestyle section complete
- Pro: ≥14 questions asked + future + sustainability answered
- Architect: ≥18 questions asked + measurement + budget + philosophy answered

**Payload merge on completion:** The `updatedPayload` merges synthesized findings into `GenerationPayload` fields:
- `additionalNotes` — append synthesized lifestyle notes
- New field `consultationInsights` (stored separately) — structured summary

**Rate limit:** 30 req/hour (stacks with existing AI rate limit)

**Quota check:** Uses `ai_generation` quota (same as floor plan generation)

---

## Task 3: `ConsultationSummary` Type

**Files:**
- Modify: `src/types/generation.ts` — add ConsultationSummary type

```typescript
export interface ConsultationSummary {
  tier: 'starter' | 'creator' | 'pro' | 'architect';
  architectId: string | null;
  projectType: 'new' | 'renovation' | 'extension' | 'exploring';
  siteStatus: 'owned' | 'under_contract' | 'looking' | 'apartment';
  timeline: 'urgent' | '6_months' | '1_year' | 'exploring';
  budgetRange: 'under_150k' | '150k_300k' | '300k_500k' | '500k_plus' | 'flexible' | 'unsure';
  householdSize: number;
  householdDescription: string; // "couple, both work from home, 2 young children"
  dailyRoutine: string; // synthesized from lifestyle questions
  entertainingFrequency: 'daily' | 'weekly' | 'monthly' | 'rarely';
  keyFrustrations: string[];
  futurePlans: string[];
  sustainabilityInterest: 'none' | 'some' | 'high';
  accessibilityNeeds: boolean;
  materialPreferences: string[];
  measurementStatus: 'unverified' | 'approximate' | 'verified';
  architectInsights: string[]; // philosophy-calibrated notes
}
```

---

## Task 4: `aiService.consultWithArchitect()` Client Method

**Files:**
- Modify: `src/services/aiService.ts`

```typescript
// Add to aiService:
async consultWithArchitect(
  params: {
    tier: Tier;
    architectId: string | null;
    conversationHistory: ChatMessage[];
    currentPayload: Partial<GenerationPayload>;
    sessionId?: string;
  },
  onMessage: (msg: ConsultationStreamEvent) => void,
): Promise<ConsultationResponse> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-architect-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify(params),
  });
  return response.json();
}
```

---

## Task 5: `ConsultationChat.tsx` Component

**Files:**
- Create: `src/components/consultation/ConsultationChat.tsx`

**Props:**
```typescript
interface ConsultationChatProps {
  tier: Tier;
  architectId: string | null;
  structuredPayload: Partial<GenerationPayload>; // from Steps 0-4
  onComplete: (summary: ConsultationSummary, fullPayload: GenerationPayload) => void;
  onBack: () => void;
}
```

**Internal state:**
```typescript
interface ConsultationState {
  messages: ChatMessage[];
  currentCategory: QuestionCategory;
  questionsAsked: number;
  sessionId: string | null;
  isComplete: boolean;
}
```

**UI elements:**
- **Header:** "Architect Consultation" (ArchitectsDaughter font), tier badge, oval pill progress steps (Qualification → Lifestyle → Future Planning → Complete)
- **Chat area:** ScrollView with messages — AI on left (dark bubble with subtle glow), user on right (elevated bubble)
- **Suggested replies:** Row of oval chips below each AI message; tapping advances conversation
- **Voice input button:** Oval button with mic icon (reuses `aiService.transcribeAudio()`)
- **Typing indicator:** Animated dots while waiting for AI response
- **Completion card:** `ConsultationSummary` renders as a styled card; "Continue to Review" button

**Phase transitions** (when category advances, show subtle divider in chat):
- `qualification` → `lifestyle`: divider "Now let's talk about how you actually live..."
- `lifestyle` → `future`: divider "A few questions about the future..."
- `future` → `sustainability`: divider (Pro+) "How do you feel about sustainability?"
- `sustainability` → `measurement`: divider (Architect) "Let's get precise..."
- `measurement` → `budget`: divider (Architect) "And finally, the practical side..."

**Design tokens:** Use existing `DS` design system from `src/theme/designSystem.ts`

---

## Task 6: `GenerationScreen.tsx` Routing for Steps 5-6

**Files:**
- Modify: `src/screens/generation/GenerationScreen.tsx`

**Changes:**
- Import `ConsultationChat` component
- Step 5 and Step 6 rendering blocks (lines 642-659) are replaced with:

```typescript
{(step === 5 || step === 6) && (
  <ConsultationChat
    tier={user?.subscriptionTier ?? 'starter'}
    architectId={selectedArchitectId}
    structuredPayload={{
      buildingType: buildingType ?? undefined,
      plotSize: parseFloat(plotSize) || 0,
      plotUnit: plotUnit,
      ...rooms,
      style: style ?? undefined,
    }}
    onComplete={(summary, fullPayload) => {
      // Merge consultation findings into local state
      if (summary.additionalNotes) {
        setNotes(summary.additionalNotes);
      }
      setConsultationSummary(summary);
      goNext(); // advance to Step 7
    }}
    onBack={goBack}
  />
)}
```

- Add state: `consultationSummary: ConsultationSummary | null`
- `Step7Review` receives `consultationSummary` prop

---

## Task 7: `Step7Review.tsx` with Consultation Summary

**Files:**
- Modify: `src/screens/generation/steps/Step7Review.tsx`

**Changes:**
- Accept new prop: `consultationSummary?: ConsultationSummary`
- In the review payload display, add a section:

```typescript
{consultationSummary && (
  <View style={styles.consultationSection}>
    <ArchText variant="heading" style={styles.sectionLabel}>
      AI Consultation Insights
    </ArchText>
    <View style={styles.insightCard}>
      <InsightRow label="Household" value={consultationSummary.householdDescription} />
      <InsightRow label="Daily routine" value={consultationSummary.dailyRoutine} />
      <InsightRow label="Entertaining" value={consultationSummary.entertainingFrequency} />
      {consultationSummary.keyFrustrations.length > 0 && (
        <InsightRow label="Key needs" value={consultationSummary.keyFrustrations.join(', ')} />
      )}
      {consultationSummary.futurePlans.length > 0 && (
        <InsightRow label="Future plans" value={consultationSummary.futurePlans.join(', ')} />
      )}
      {consultationSummary.sustainabilityInterest !== 'none' && (
        <InsightRow label="Sustainability" value={consultationSummary.sustainabilityInterest} />
      )}
    </View>
  </View>
)}
```

---

## Task 8: Enhanced `AIChatPanel.tsx` — Tier-Gated Capabilities

**Files:**
- Modify: `src/components/blueprint/AIChatPanel.tsx`

**Tier capabilities:**

| Capability | Starter | Creator | Pro | Architect |
|-----------|---------|---------|-----|-----------|
| Basic edit prompts | ✓ | ✓ | ✓ | ✓ |
| Suggestion nudges | — | — | ✓ | ✓ |
| Multi-room reasoning | — | — | ✓ | ✓ |
| Measurement mode | — | — | — | ✓ |
| Cost estimation | — | — | — | ✓ |
| Architect philosophy guidance | — | — | — | ✓ |

**Pro+ additions:**
- Add `Suggestions` tab next to `Chat` tab
- Suggestions appear as collapsible `SuggestionBubble` items:
  - `"I noticed you have 4 bedrooms but no dedicated home office..."`
  - `"The living room faces north — morning light advice..."`
- `suggestionType`: `'nudge' | 'measurement' | 'cost' | 'philosophy'`

**Architect additions:**
- `MeasurementMode` toggle in chat header
- When enabled, chat asks for precise measurements and can do room-area proportionality checks
- `Cost estimation` mode — uses stored furniture dimensions to generate rough cost indicators
- Architect philosophy label shown in chat header when architect is selected

**Proactive nudge generation** (Pro+):
- When blueprint loads or after significant edits, call `ai-edit-blueprint` with a special `mode: 'suggest'`
- This returns an array of `SuggestionItem` objects rather than a text message
- Display them as `SuggestionBubble` components at the top of the chat panel

---

## Task 9: `ai-edit-blueprint` Enhancement

**Files:**
- Modify: `supabase/functions/ai-edit-blueprint/index.ts`

**New request field:**
```typescript
{
  prompt?: string;
  blueprint: BlueprintData;
  mode?: 'edit' | 'suggest'; // default 'edit'
}
```

**`mode: 'suggest'` behavior:**
- System prompt is different — asks AI to analyze the blueprint and return suggestions rather than edits
- Returns `{ suggestions: SuggestionItem[] }` where:

```typescript
interface SuggestionItem {
  id: string;
  type: 'nudge' | 'measurement' | 'cost' | 'philosophy';
  title: string;        // short label
  description: string;  // 1-2 sentence explanation
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;  // if true, includes an accept/reject action
}
```

**Pro tier suggestions** (`mode: 'suggest'`):
- Circulation issues: "The kitchen is far from the dining area — consider opening up the wall"
- Missing spaces: "You have 4 bedrooms but no dedicated home office"
- Light optimization: "Living room faces north — consider adding a window on the east wall"

**Architect tier suggestions** (adds to Pro):
- Measurement mode: room-area proportionality checks against furniture data
- Cost estimation: "Estimated furniture cost for master bedroom: $X based on current selections"
- Architect-philosophy alignment: "This layout doesn't reflect [Architect]'s principle of [X] — consider [Y]"

**Rate limit:** Same as existing `ai-edit-blueprint` (10 req/hour)

---

## Task 10: BlueprintStore Suggestion State

**Files:**
- Modify: `src/stores/blueprintStore.ts`

**Add to state:**
```typescript
interface BlueprintStore {
  // ... existing fields
  suggestions: SuggestionItem[];
  unreadSuggestionCount: number;
}
```

**Add actions:**
```typescript
actions: {
  // ... existing actions
  setSuggestions(suggestions: SuggestionItem[]): void;
  markSuggestionRead(suggestionId: string): void;
  clearSuggestions(): void;
}
```

---

## Self-Review Checklist

- [ ] All file paths are exact and match the codebase structure
- [ ] Question categories map correctly to tier × category matrix in spec
- [ ] `ConsultationChat.tsx` follows existing app theme (colors, border-radius, fonts)
- [ ] `GenerationScreen.tsx` routing change preserves all existing step behavior
- [ ] `ai-architect-chat` follows same Edge Function patterns as `ai-generate` (auth, rate limit, quota check)
- [ ] `ai-edit-blueprint` enhancement is additive — existing `mode: 'edit'` behavior unchanged
- [ ] `SuggestionItem` type is consistent across Edge Function and client
- [ ] `ConsultationSummary` fields map exactly to what the question bank collects
- [ ] No `StyleSheet.create` in new components (NativeWind only)
- [ ] `CompassRoseLoader` used instead of any spinner

---

## Commit Sequence

1. **Task 1:** Migration + ConsultationSummary type (DB foundation)
2. **Task 2:** `ai-architect-chat` Edge Function
3. **Task 3:** `ConsultationSummary` type + `aiService` method
4. **Task 4:** `ConsultationChat.tsx`
5. **Task 5:** `GenerationScreen.tsx` routing + `Step7Review.tsx`
6. **Task 6:** `ai-edit-blueprint` enhancement
7. **Task 7:** `AIChatPanel.tsx` + `SuggestionBubble.tsx` + `blueprintStore` suggestions
8. **Task 8:** End-to-end integration test

---

## Dependencies

- `ai-architect-chat` is independent of other tasks after DB migration
- `ConsultationChat.tsx` depends on `ai-architect-chat` being live
- `GenerationScreen.tsx` routing depends on `ConsultationChat.tsx`
- `ai-edit-blueprint` enhancement is independent
- `AIChatPanel.tsx` enhancement depends on `ai-edit-blueprint` enhancement
- `blueprintStore` suggestions state is consumed by `AIChatPanel.tsx`
