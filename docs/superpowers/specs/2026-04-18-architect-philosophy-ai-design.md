# Architect Philosophy AI — Knowledge Module

**Date:** 2026-04-18
**Status:** Approved
**Scope:** `architectProfiles` knowledge module + Generation Step 0 + tiered access + token cost model + AI usage limits

---

## 1. What We're Building

A shared knowledge module containing deep profiles of 12 world-renowned architects. The AI uses these profiles to shape how it approaches every design — not as style filters, but as genuine architectural thinking. Users can generate with the blended default philosophy or explicitly select an architect's approach to influence their project.

**Key principles:**
- Knowledge depth is NOT tiered — all tiers see full architect profiles
- Access to generation with each architect IS tiered (progressive unlock)
- Token cost varies by architect complexity
- AI monthly usage limits are consolidated and clearly documented

---

## 2. The 12 Architects

| # | Name | Era | Philosophy Tag |
|---|------|-----|----------------|
| 1 | Frank Lloyd Wright | Organic Architecture, 1890s–1959 | Organic |
| 2 | Zaha Hadid | Parametric Neo-futurism, 1980s–2016 | Parametric |
| 3 | Tadao Ando | Zen Minimalism, 1980s–present | Minimalist |
| 4 | Norman Foster | High-Tech / Transparent, 1960s–present | High-Tech |
| 5 | Le Corbusier | Modernism / Corbusian Machine, 1920s–1965 | Modernist |
| 6 | Peter Zumthor | Phenomenological / Atmospheric, 1990s–present | Atmospheric |
| 7 | Bjarke Ingels | Hedonistic Sustainability, 2000s–present | Sustainable |
| 8 | Kengo Kuma | Japanese Soft Modernism, 1990s–present | Japandi |
| 9 | Santiago Calatrava | Structural Expressionism, 1980s–present | Structural |
| 10 | Alain Carle | Quebecois Contextual, 1990s–present | Contextual |
| 11 | Louis Kahn | Monumental Rationalism, 1950s–1974 | Rationalist |
| 12 | Rem Koolhaas | Urban Complexity / Bigness, 1970s–present | Urbanist |

---

## 3. Architect Profile Schema

Each profile contains:

```typescript
interface ArchitectProfile {
  id: string;                          // slug: 'frank-lloyd-wright'
  name: string;                        // 'Frank Lloyd Wright'
  era: string;                          // 'Organic Architecture, 1890s–1959'
  tagline: string;                      // 'Architecture that grows from the land like a tree'
  philosophySummary: string;            // 2-3 sentences on core thinking
  spatialSignature: string;            // What their buildings feel like spatially
  siteApproach: string;                // How they read and respond to a site
  materialPalette: string[];           // What materials they favour and why
  structuralPhilosophy: string;         // How they think about structure
  lightApproach: string;               // How they use natural and artificial light
  idealClient: string;                // Who benefits most from this approach
  appliedRules: ArchitectRule[];       // 5-8 concrete rules that drive their decisions
  strengths: string;                    // What this approach excels at
  potentialWeaknesses: string;          // Where it might not work
  blendGuidance: BlendPair[];          // How to combine with other architects
  complexityTier: 'core' | 'advanced' | 'premium';  // affects token cost
}

interface ArchitectRule {
  rule: string;        // "Fireplace at geometric centre — all rooms orient to it"
  why: string;         // "Creates gravitational pull that makes navigation intuitive"
  applyWhen: string;  // "Always in residential, especially on sloping sites"
}

interface BlendPair {
  withId: string;      // 'scandinavian' | 'mid-century-modern'
  guidance: string;    // "Blend: Wright's horizontality + Scandinavian warmth"
  warning: string;     // "Avoid: Wright's thick walls conflict with MCM steel"
}
```

---

## 4. Token Cost Model

Token cost is based on architectural complexity — how much reasoning the AI needs to apply the profile faithfully.

| Tier | Architects | Token Multiplier | Notes |
|------|-----------|-----------------|-------|
| Core (1×) | Wright, Ando, Le Corbusier | 1× | Rule-based, predictable geometries |
| Advanced (1.5×) | Hadid, Foster, Zumthor, Ingels, Kuma, Kahn, Carle | 1.5× | Curved forms, complex lighting, sustainability logic |
| Premium (2×) | Calatrava, Koolhaas | 2× | Parametric geometry, urban complexity, structural expression |

**Token counting:** If a generation without architect costs ~X tokens, selecting a Core architect costs ~X tokens, Advanced ~1.5X, Premium ~2X. Monthly limits are denominated in "generation equivalents" (base unit = 1 gen without architect).

---

## 5. Tier Access — Progressive Unlock

All tiers see full architect profiles (knowledge not gated). Generation access is tiered:

| Tier | Architects Available | Monthly Generations | Notes |
|------|---------------------|---------------------|-------|
| **Starter** | Wright, Hadid, Ando (3 core) | 10 base gens/mo | Default = blended philosophy |
| **Creator** | + Foster, Le Corbusier, Zumthor, Ingels (7 total) | 40 base gens/mo | |
| **Pro** | + Kuma, Carle, Kahn, Calatrava (11 total) | 100 base gens/mo | |
| **Architect** | All 12 (adds Koolhaas) | Unlimited | All architects unlocked |

**Blended default:** When no architect is selected, the AI blends all 12 profiles proportionally — weighted toward the selected style's compatible architects. Blending is automatic and invisible unless generation notes are enabled.

**Generation notes (Pro+):** After each generation, the AI explains which architect philosophy guided key decisions — e.g., "Hadid's fluid spatial transitions applied to connect living + kitchen."

---

## 6. AI Monthly Usage Limits — Consolidated

Consolidate and clearly document per-tier AI usage limits (this applies to all AI features: generation, edit, render).

| Tier | AI Gens/Mo | AI Edits/Mo | Renders/Mo | Notes |
|------|-----------|-------------|------------|-------|
| **Starter** | 10 | 10 | 2 | Generations include full 7-step + brief edits |
| **Creator** | 40 | 40 | 10 | |
| **Pro** | 100 | 100 | 30 | |
| **Architect** | Unlimited | Unlimited | Unlimited | |

**Tracking:**
- `ai_generations` counter in users table — incremented per generation call
- `ai_edits` counter — incremented per ai-edit call
- `renders` counter — incremented per ai-render call
- Monthly reset via cron or on login check
- Warning at 80% usage, hard block at 100% with upsell message

---

## 7. Generation Flow — Step 0 (Architect Selection)

Insert before style selection in the 7-step generation flow:

```
Step 0: Architect Philosophy
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Every great building starts with an idea. Which architect's thinking
should guide your design?

[3-column card grid — Starter sees 3, Creator 7, Pro 11, Architect 12]

┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ 🏠 Wright      │ │ ⚡ Hadid       │ │ 🧱 Ando        │
│ Organic        │ │ Parametric     │ │ Zen Minimalist  │
│ "Grow from     │ │ "Form follows   │ │ "Silence and   │
│  the land"     │ │  the future"   │ │  light"        │
│                │ │                │ │                │
│ [Select]       │ │ [Select]       │ │ [Select]       │
└─────────────────┘ └─────────────────┘ └─────────────────┘

"Use default blended philosophy" ← text link below cards
```

**Card contents per architect (all tiers see this depth):**
- Name + philosophy tag
- 1-line tagline (philosophySummary)
- 2-line spatial signature
- 3 icon projects

**On selection:** Architect card highlights with accent border + checkmark. User can proceed or change selection. "Use blended default" is the starting state (no architect selected = automatic blending).

**Pro+ only:** Generation notes toggle — "Show architect influence in results" (on by default for Pro+, off for Creator).

---

## 8. Files to Create / Modify

### New files

| File | Purpose |
|------|---------|
| `src/data/architectProfiles.ts` | Shared TS module — all 12 architect profiles, `getArchitectById()`, `getArchitectsForTier()`, `calculateTokenCost()` |
| `supabase/functions/_shared/architects.ts` | Deno mirror — same profiles for Edge Function use |
| `supabase/functions/_shared/aiLimits.ts` | Consolidated AI usage limit constants and helper functions |

### Modify

| File | Change |
|------|--------|
| `supabase/functions/ai-generate/index.ts` | Inject selected architect's profile into system prompt; apply token cost; Step 0 request schema |
| `supabase/functions/ai-edit-blueprint/index.ts` | Add architect influence to prompt context for Studio AI |
| `supabase/functions/_shared/quota.ts` | Use new consolidated aiLimits constants; add generation-type tracking (generation/edit/render) |
| `src/types/blueprint.ts` | Add `architectInfluence?: string` field to BlueprintData metadata |
| `src/screens/generation/GenerationScreen.tsx` | Add Step 0 — architect selection card grid before style selection |
| `src/utils/tierLimits.ts` | Add architect-specific limits; update `TIER_LIMITS` |

---

## 9. Architect Profile Content — Summary

Full profiles written for all 12 architects. Key applied rules per architect:

### Wright (Organic)
- Fireplace at geometric centre — all rooms orient to it
- Horizontal ribbon windows below ceiling line — continuous light
- Deep overhangs (1.2m minimum) — shade + invitation
- No corridor bedrooms
- Built-in furniture as architecture
- Garden wall becomes room wall — boundary dissolves

### Hadid (Parametric)
- Fluid spatial transitions — no 90° corners unless load-bearing
- Floor-to-ceiling glazing on all elevations
- Cantilevered volumes create covered outdoor space below
- Stair as sculptural centrepiece, not utility
- Seamless indoor-outdoor through form
- Roof as fifth facade — visible from above

### Ando (Zen Minimalist)
- Exposed concrete as primary material — board-formed, no decoration
- Apertures as controlled light instruments — narrow slots, courtyards
- Silence as design element — remove everything unnecessary
- Water and light as the only ornament
- Thick walls (200–300mm) with thermal mass
- Transition spaces that slow you down

### Foster (High-Tech)
- Steel and glass as elegance, not coldness
- Facades that respond to orientation — active facade systems
- Open plan with visible structure — mechanical aesthetic
- High ceilings in living areas, service zone below
- Roof as solar collector + daylight reflector
- Smart home integration as standard, not luxury

### Le Corbusier (Modernist)
- Free plan — columns, not load-bearing walls
- Façade as free composition — window placement over aesthetics
- Pilotis — ground floor freed, building floats
- Roof garden as standard — green replaces what building occupies
- Horizontal strip windows — ribbon of light
- Machine for living in — every room has a defined purpose

### Zumthor (Atmospheric)
- Material honesty — no veneers, no pretence
- Layered atmospheres — between inside and outside
- Thermal comfort through mass, not technology
- Silence and slowness built into the spatial sequence
- Light as material — natural light as the primary design tool
- Site as memory — building connects to what's there

### Ingels (Hedonistic Sustainability)
- Sustainability as joy — green roofs you want to use, not just look at
- Hybrid programmes — ski slope as roof, farm as amenity
- Bold moves — BIG buildings are never boring
- Pragmatic sustainability — technology in service of experience
- Social spaces at every scale
- Parametric but human — geometry with warmth

### Kuma (Japanese Soft)
- Materials that age beautifully — wood, stone, paper
- Disappearing architecture — building that doesn't assert itself
- Interior landscape — inside feels like outside
- Screens and layers — space divided by transparent elements
- Craft and precision — joint details matter
- Silence in the plan — no wasted circulation

### Calatrava (Structural)
- Structure IS the architecture — no cover-ups
- White as dominant colour — makes structural forms read
- Movement as design — pivoting, folding, opening
- Site-responsive geometry — form follows the unique topography
- Bridge logic — tension and compression made visible
- Light as sculptural element — structures cast dramatic shadows

### Carle (Contextual)
- Response to Quebecois climate — cold, snow, light
- Regional modernism — not imported vocabulary
- Wood and stone as primary materials
- Compact forms for energy efficiency
- Covered transition spaces — not just inside/outside
- Scale relative to surroundings — neighbourhood matters

### Kahn (Rationalist)
- Presence of light — rooms are lit by what they are
- Monumental materiality — brick, concrete, stone
- Servants and served — clear hierarchy in plans
- Central gathering spaces — all rooms smaller, communal space larger
- Silence in the plan — each room has one clear purpose
- Light as revelation — threshold between dark and light

### Koolhaas (Urban Complexity)
- Bigness — when building becomes city
- Programme as generator — what happens inside drives form
- Urban adjacency — building as urban connector
- Complexity over simplicity — richness over reduction
- Infrastructure as architecture — ducts, stairs, elevators visible
- Collage as method — not one idea but many coexisting

---

## 10. System Prompt Injection

When architect is selected in ai-generate, inject at start of generation prompt:

```
ARCHITECT INFLUENCE: {architectName}
═══════════════════════════════════
{philosophySummary}

SPATIAL SIGNATURE: {spatialSignature}

APPLIED RULES (follow these exactly):
1. {rule1} → {why1}
2. {rule2} → {why2}
... (up to 8 rules)

SITE APPROACH: {siteApproach}
MATERIAL PALETTE: {materialPalette.join(', ')}
BLEND GUIDANCE: {blendGuidance}

When this conflicts with style rules, architect philosophy takes precedence unless the style is explicitly incompatible (see blendGuidance).
```

When no architect selected: auto-blend all 12 weighted by style compatibility, invisible to user.

---

## 11. Acceptance Criteria

1. All 12 architect profiles exist with full depth — philosophy, spatial signature, applied rules, blend guidance
2. `getArchitectById(id)` and `getArchitectsForTier(tier)` functions work correctly
3. Generation Step 0 appears before style selection in GenerationScreen
4. Architect card grid shows correct count per tier (3/7/11/12)
5. Token cost correctly calculated per architect (1×/1.5×/2×)
6. AI monthly limits consolidated in one place (aiLimits.ts)
7. Quota tracking increments correctly per generation type
8. Blueprint metadata includes `architectInfluence` when architect selected
9. Generation notes (Pro+) show which architect guided decisions
10. TypeScript passes with no errors
11. Edge Function deploys without import errors

---

## 12. Out of Scope (for this spec)

- Changing which architects are available per tier (future: user can purchase additional architect access)
- AI that learns from user feedback (feedback loop to improve profiles)
- Custom user-created architect profiles
- Architect influence on 3D renders (only on floor plan generation)