# AI Architect Consultation Chat — Design Spec
**Date:** 2026-04-19
**Status:** Draft

---

## What We're Building

Two AI-powered conversation experiences layered onto the existing generation pipeline:

1. **Pre-generation Architect Consultation Chat** — runs between Steps 4 and 7 of the GenerationScreen (hybrid flow: Steps 0-4 stay structured UI, Steps 5-6 become an AI conversation, Step 7 stays as review)
2. **Enhanced In-Editor Refinement Chat** — upgrades the existing `AIChatPanel` in the blueprint Workspace with tier-gated sophistication

---

## Context

The existing system collects concrete data well (building type, plot size, rooms, style) but misses the "why" — how clients actually live, their daily routines, family dynamics, future plans, the feeling they're going for. Real architects ask these questions; the current 7-step wizard doesn't.

The goal is to make AI-powered architecture consultation accessible, with question depth and sophistication scaling by subscription tier — Starter gets basic qualification, Architect gets full professional intake with architect-calibrated questions.

---

## Architecture

### Two Distinct Systems

```
Pre-Gen Consultation          In-Editor Chat
(Steps 5-6)                  (AIChatPanel)
─────────────────            ─────────────────
Stateless LLM-driven         Stateful, uses existing
conversation session         blueprintStore.chatHistory
No stored state              Persisted in blueprint JSON
One-shot per generation      Ongoing refinement
Handoff to GenerationScreen  Feeds into ai-edit-blueprint
```

### Pre-Gen Consultation (`ai-architect-chat` Edge Function)

**Input:**
```typescript
{
  tier: 'starter' | 'creator' | 'pro' | 'architect';
  architectId: string | null;        // selected architect profile
  conversationHistory: ChatMessage[];
  currentPayload: Partial<GenerationPayload>;  // data from Steps 0-4
}
```

**Output:**
```typescript
{
  message: string;                   // AI response message
  suggestedReplies: string[];         // 2-3 quick-reply options
  updatedPayload: Partial<GenerationPayload>;  // merged when complete
  isComplete: boolean;
  nextCategory: QuestionCategory;
}

type QuestionCategory =
  | 'qualification'    // real project? site? timeline? budget?
  | 'lifestyle'        // daily routines, entertaining, frustrations
  | 'future'           // family changes, aging in place, flexibility
  | 'sustainability'   // green building, materials, energy
  | 'measurement'      // architect tier: plot dims, orientation, zoning
  | 'budget'           // architect tier: hard/soft cost breakdown
  | 'architect_philosophy';  // architect tier: philosophy-calibrated
```

**Question Bank (curated, architect-calibrated):**
Questions are hardcoded in the Edge Function, organized by:
- `tier` × `category` → base question set
- `architectId` → philosophy-calibrated variant prompts

Example architect variants:
- **Wright:** "How do you want the landscape and interior to feel unified?"
- **Hadid:** "Do you value bold flowing forms or more restrained geometry?"
- **Kahn:** "What role does natural light play in your vision for this space?"
- **Foster:** "Are you interested in integrating sustainable systems as a design feature?"

**Tier × Category question matrix:**

| Category | Starter | Creator | Pro | Architect |
|----------|---------|---------|-----|-----------|
| qualification | ✓ | ✓ | ✓ | ✓ |
| lifestyle | — | ✓ | ✓ | ✓ |
| future | — | — | ✓ | ✓ |
| sustainability | — | — | ✓ | ✓ |
| measurement | — | — | — | ✓ |
| budget | — | — | — | ✓ |
| architect_philosophy | — | — | — | ✓ |

**Question depth by tier (approximate exchange count):**
- Starter: 5-6 exchanges
- Creator: 8-10 exchanges
- Pro: 12-15 exchanges
- Architect: 18-20 exchanges (with measurement + budget + philosophy)

**Handoff:** When `isComplete: true`, `updatedPayload` is merged into the full GenerationPayload. The conversation history is stored in `generation_sessions` for audit/review.

### In-Editor Chat (Enhanced `ai-edit-blueprint`)

Extends existing `AIChatPanel` with tier-gated capabilities:

| Tier | Capability |
|------|-----------|
| Starter | Basic edit prompts, 20-message chatHistory |
| Creator | Same as Starter + enhanced suggestions |
| Pro | Multi-room reasoning, suggestion nudges, layout reorganization awareness |
| Architect | Measurement mode, cost estimation, proportionality checks, architect-philosophy guidance |

**Architect-tier enhancements:**
- `measurement_mode`: asks for precise measurements, can do room-area proportionality checks against furniture data
- `cost_estimation`: uses stored furniture dimensions + room areas to generate rough cost indicators
- `architect_philosophy_guidance`: injects selected architect's philosophy into edit prompts

**Suggestion nudge system (Pro+):**
When the AI detects patterns in the blueprint, it can proactively suggest:
- "I noticed you have 4 bedrooms but no dedicated home office — want to explore converting one?"
- "The living room faces north — would you like me to suggest window placements for better morning light?"
- "Your kitchen and dining area have a 4m gap — this could work well as an open-plan family space"

These nudge suggestions appear as expandable items in the chat panel, not forced messages.

---

## UX Flow

### GenerationScreen Steps 0-4 (unchanged)
- Step 0: Architect selection (architectId)
- Step 1: Building type
- Step 2: Plot size + unit
- Step 3: Rooms + amenities
- Step 4: Style

### Steps 5-6 — AI Consultation Chat (replaces existing flat inputs)

A slide-up chat panel takes over the screen:

1. **Phase indicator** — oval pills at top: Qualification → Lifestyle → Future Planning → Complete
2. **AI asks questions** — one question at a time, with 2-3 suggested reply chips
3. **User taps a reply** or types freely — both advance the conversation
4. **Conversation tracks category transitions** — AI knows which category it's in based on payload state
5. **On completion** — summary card shows "Here's what I understood about you"
6. **Continue to Step 7 review** — all structured data + consultation summary visible

### Step 7 Review (enhanced)
Shows:
- Structured data from Steps 0-4
- "AI Consultation Insights" section: key lifestyle findings, family notes, special requirements
- Continue → triggers `ai-generate-optimal`

### In-Editor Chat (Workspace)
- Floating oval bubble (bottom-right) with pulsing indicator when new suggestions are available
- Tap expands to full chat panel
- Pro+ users see a "Suggestions" tab alongside "Chat"
- Architect users see an additional "Measure" mode toggle

---

## Data Model

### New/Modified Fields

**`generation_sessions.conversation_history`** (JSONB)
Stores the full pre-gen consultation chat for audit and potential re-run.

**`generation_sessions.consultation_summary`** (JSONB)
```typescript
{
  tier: Tier;
  architectId: string | null;
  householdSize: number;
  dailyRoutine: string;         // synthesized from lifestyle questions
  entertainingFrequency: string;
  keyFrustrations: string[];
  futurePlans: string[];
  sustainabilityInterest: 'none' | 'some' | 'high';
  accessibilityNeeds: boolean;
  materialPreferences: string[];
  budgetRange: string;         // synthesized
  measurementStatus: 'unverified' | 'approximate' | 'verified';
  architectInsights: string[];  // philosophy-calibrated notes
}
```

**`blueprintStore.chatHistory`** — extended for Pro+ with:
- `suggestionType?: 'nudge' | 'measurement' | 'cost' | 'philosophy'`
- `autoGenerated?: boolean`

---

## Edge Functions

### `ai-architect-chat` (new)

**Path:** `supabase/functions/ai-architect-chat/`

**System prompt structure:**
```
You are [ArchitectName], a visionary architect known for [philosophySummary].
Your philosophy: [philosophyDetailed]
Your approach to client consultation: ask thoughtful, specific questions that reveal how the client actually lives, not just what they want superficially.

Current client tier: [tier] — adjust your question depth accordingly.
- Starter: 5-6 core qualification questions only
- Creator: add lifestyle and daily routine questions
- Pro: add future planning, sustainability, accessibility
- Architect: full professional intake + measurement + budget + philosophy-calibrated

The client has already provided: [summarize Steps 0-4 data]

Ask ONE question at a time. After each question, provide 2-3 suggested replies as short chips.
When you have gathered enough information for the tier, say "Here's what I understood about you" and summarize.

Conversation rules:
- Never ask two questions in one message
- Questions should feel like a professional consultation, not a form
- Calibrate question tone to the architect philosophy (warm + human for Wright, bold + visionary for Hadid, precise + institutional for Kahn)
- If the client says something interesting, acknowledge it briefly before asking the next question
```

**Rate limit:** 30 requests/hour per user (stacks with existing AI limits)

---

## Tier Gating Summary

| Feature | Starter | Creator | Pro | Architect |
|---------|---------|---------|-----|-----------|
| Pre-gen consultation | 5-6 Qs | 8-10 Qs | 12-15 Qs | 18-20 Qs |
| In-editor basic chat | ✓ | ✓ | ✓ | ✓ |
| Suggestion nudges | — | — | ✓ | ✓ |
| Multi-room reasoning | — | — | ✓ | ✓ |
| Measurement mode | — | — | — | ✓ |
| Cost estimation | — | — | — | ✓ |
| Architect philosophy chat | — | — | — | ✓ |

---

## Component Changes

### New Components
- `ConsultationChat.tsx` — the pre-gen chat panel (Steps 5-6)
- `ConsultationSummary.tsx` — the completion summary card
- `SuggestionBubble.tsx` — Pro+ nudge suggestions in AIChatPanel
- `MeasurementMode.tsx` — Architect-tier measurement tools in chat

### Modified Components
- `GenerationScreen.tsx` — route Steps 5-6 through ConsultationChat
- `AIChatPanel.tsx` — add tier-gated suggestion tab + architect enhancements
- `Step7Review.tsx` — display consultation summary alongside structured data

---

## Open Questions

1. Should the consultation chat support voice input (like Step 6 currently does)? Yes — reuse `aiService.transcribeAudio()`
2. Should Starter tier users see a simplified version or a different tone? Starter questions are simpler in vocabulary but same professional warmth
3. How do we handle interrupted consultations? If a user exits mid-consultation, session state is saved — they can resume
4. Should the AI ever ask follow-up questions outside the curated bank? Architect tier can go off-script slightly; lower tiers stay on-script

---

## Next Steps

1. Implement `ai-architect-chat` Edge Function with question bank
2. Build `ConsultationChat.tsx` component
3. Update `GenerationScreen.tsx` routing for Steps 5-6
4. Enhance `AIChatPanel.tsx` with Pro+/Architect tier capabilities
5. Update Step 7 Review with consultation summary display
6. Add suggestion nudge system to blueprintStore
