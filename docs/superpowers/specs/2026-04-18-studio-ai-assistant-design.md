# Studio AI Assistant — Knowledge Enhancement

**Date:** 2026-04-18
**Status:** Approved
**Scope:** Enhance `ai-edit-blueprint` Edge Function with architectural knowledge + targeted UI improvements to `AIChatPanel`

---

## 1. Knowledge Block Injection

### 1.1 Room Minimum Standards

| Room | Minimum m² | Notes |
|------|-----------|-------|
| Master bedroom | 12 | Space for queen bed + wardrobe + circulation |
| Standard bedroom | 9 | Single bed minimum |
| Bathroom | 4 | WC + basin + shower/tub |
| Kitchen | 10 | Work surface + appliances |
| Living room | 15 | Sofa group + circulation |
| Dining area | 10 | Table for 4–6 |
| Garage (single) | 15 | Standard vehicle + storage |

**Walls:** Exterior 200–300mm thickness. Interior walls align to exterior grid.

### 1.2 Door & Window Standards

- Standard door: 80cm wide, 200cm tall
- Accessibility door: 90cm wide
- Main entry door: 100cm wide
- Window placement: exterior walls only, never interior walls

### 1.3 Ceiling Heights

- Minimum: 2.4m
- Standard residential: 2.7m
- Luxury/high-end: 3.0m+

### 1.4 Furniture Clearances

- Sofa: 90cm clearance in front of seating
- Dining table: 120cm clearance from wall to table edge
- Kitchen work triangle: sink ↔ fridge ↔ stove ≤ 6m combined
- WC swing radius: 60cm clear in front of bowl
- Bed clearance: 70cm minimum each side for double bed

### 1.5 Room Placement Logic

- Bedrooms: away from street-facing walls, north/east preferred
- Kitchen: adjacent to dining area, utility near kitchen or garage
- Bathrooms: accessible from bedrooms, ensuite preferred for master
- Living room: facing garden or best natural light direction (south/west)
- Utility/laundry: adjacent to kitchen or garage

### 1.6 Auto-Complete Triggers

When user adds or modifies a room, the AI should automatically consider:
- **Kitchen** → suggest sink on exterior wall, counter positions along perimeter, appliance zones (fridge, stove, dishwasher triangle)
- **Bathroom** → suggest WC on north wall (no window), shower/tub position, basin placement, water outlet positions marked
- **Living room** → suggest sofa grouping with TV wall opposite, reading corner with window
- **Bedroom** → suggest wardrobe position (avoid window wall), bed placement (head against solid wall, feet toward door slightly)
- **Room closed without door** → suggest "add door" placement
- **Garden/outdoor** → suggest patio adjacent to living room, pathway from gate to front door, tree positions, flower beds along perimeter

### 1.7 Staircase Standards

- Rise per step: 170–220mm
- Run per step: 250–300mm
- Minimum width: 90cm
- Headroom clearance: 200cm minimum

### 1.8 Light & Orientation

- North-facing windows: diffuse natural light, no direct sun glare
- South-facing living rooms: passive solar gain in winter
- West-facing bedrooms: avoid (evening sun heat)
- Master bedroom: east-facing for morning light preferred

### 1.9 Style Application Rules

When user requests a style change, apply:
- **Modern**: clean lines, open plan, large windows, natural materials (wood/stone), minimal ornament
- **Minimalist**: white/neutral palette, hidden storage, one focal point per room, maximum floor space
- **Industrial**: exposed materials, dark steel accents, polished concrete, brick
- **Scandinavian**: light woods, white walls, textile textures, functional simplicity
- **Rustic**: natural stone, timber beams, warm earth tones, fireplace focal point
- **Art Deco**: geometric patterns, bold colors (emerald/gold), symmetry, glamour
- **Victorian**: bay windows, ceiling roses, period door patterns, fireplaces
- **Mediterranean**: terracotta, archways, outdoor living, cool tones
- **Tropical**: indoor-outdoor flow, louvred windows, natural materials, greenery
- **Contemporary**: mixed materials, glass, steel, uncluttered, large spans
- **Bohemian**: layered textiles, collected objects feel, global patterns, warm eclecticism
- **Coastal**: white/blue palette, natural textures, nautical accents, light and airy

---

## 2. System Prompt Structure

The enhanced system prompt will have these sections in order:

1. **Role & tone** — current ARIA persona (keep)
2. **Knowledge block** — §1 above (new)
3. **Blueprint structure** — current (keep)
4. **Hard rules** — current (keep, update minimums)
5. **Response style** — current (keep, update to include brief human note on significant changes)
6. **Auto-complete guidance** — §1.6 (new)

---

## 3. UI Improvements — AIChatPanel

### 3.1 Quick Action Chips

Positioned below the text input, 4-5 one-tap shortcuts:
- `Resize Room` — "Make [selected room] 20% larger"
- `Add Floor` — "Add a second floor with [bedrooms] bedrooms"
- `Change Style` — "Apply [style] style to the whole house"
- `Add Window` — "Add a window to [selected wall]"
- `Suggest Furniture` — "Suggest furniture for [selected room]"

Tapping a chip pre-fills the text input with the template.

### 3.2 Voice Input

Same pattern as GenerationScreen:
- Oval mic button (right side of input row)
- Tap to record: expo-av starts audio recording
- Animated oval waveform while listening
- On stop: sends to `transcribe` Edge Function (Whisper)
- Result auto-fills text input
- User can edit before sending

### 3.3 Contextual Example Prompts

Example prompts change based on current blueprint state:
- If no rooms with furniture → "Suggest furniture for the master bedroom"
- If no garden/outdoor → "Plan the outdoor area with garden and patio"
- If single floor → "Add a second floor with 3 bedrooms"
- If multi-floor → "Show me furniture for the upstairs bedrooms"
- Default fallback: generic "Add a window to the north wall"

### 3.4 ConfirmationCard Enhancement

- Show change summary with architectural context (e.g., "bedroom now 14m² — excellent for a king bed + wardrobe")
- Brief note from AI explaining the reasoning behind non-obvious changes

---

## 4. Implementation Files

### Edge Function
- `supabase/functions/ai-edit-blueprint/index.ts` — update SYSTEM_PROMPT with knowledge block

### UI Components
- `src/components/blueprint/AIChatPanel.tsx` — add quick chips, voice input, contextual examples

### Hooks
- `src/hooks/useVoiceInput.ts` — reuse transcription pattern from GenerationScreen (or reuse existing hook if available)

---

## 5. Acceptance Criteria

1. AI responds with room minimum dimensions when user tries to shrink below limit
2. AI auto-suggests kitchen/bathroom furniture placements when those rooms are added
3. Quick action chips pre-fill the text input correctly
4. Voice input records, transcribes, and fills the input
5. Example prompts change based on blueprint state
6. ConfirmationCard shows brief architectural note from AI
7. Style changes apply the correct design rules
8. TypeScript passes with no errors
9. Edge Function deploys successfully