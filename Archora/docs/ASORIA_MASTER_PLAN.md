# ASORIA — Master Plan

> The complete product vision for the ASORIA AI architecture design platform.
> This document is the authoritative product specification. CLAUDE.md is the authoritative rules file for agents.
> Last updated: 2026-03-25

---

## 1. Vision Statement

ASORIA is a fully generative, AI-powered mobile architecture design platform for iOS and Android. Every design the user sees is generated on demand — there are no pre-made templates. The AI works like a senior architect interviewing a client, asking the right questions to produce professional-quality floor plans, then handing off to a powerful studio for editing and refinement.

**Guiding principle:** Make architectural design as natural as having a conversation.

---

## 2. Brand and Feel

- **Professional but approachable** — not a CAD tool, not a toy
- **Black base aesthetic** — dark canvas like a real drafting board
- **White sketchy hand-drawn accents** — line art, illustrations, decorative elements
- **Oval and rounded shapes throughout** — every interactive element is soft-cornered
- **Architect's sketchbook meets premium app** — the UI feels like someone talented designed it by hand
- Not childish — playful and elegant. Like a senior architect who also loves design.

**The feeling:** When you open ASORIA, it should feel like unrolling a beautiful black drafting paper on your desk. Every interaction is deliberate, tactile, and satisfying.

---

## 3. Design Language

### Colour System

All values are final. Do not override BASE_COLORS anywhere in the app.

| Token | Hex | Usage |
|-------|-----|-------|
| Background | `#1A1A1A` | Root screen backgrounds |
| Surface | `#222222` | Cards, sheets, bottom sheets |
| Elevated | `#2C2C2C` | Modals, floating panels |
| Border | `#333333` | Dividers, input outlines |
| Primary | `#C8C8C8` | Default text on dark, primary icons |
| Primary Glow | `#E8E8E8` | Active states, highlights |
| Text Primary | `#F0EDE8` | Body copy, important labels |
| Text Secondary | `#9A9590` | Hints, secondary labels |
| Text Dim | `#5A5550` | Placeholders, disabled states |
| Success | `#7AB87A` | Confirmations, positive states |
| Warning | `#D4A84B` | Cautions, upgrade prompts |
| Error | `#C0604A` | Errors, destructive actions |

**Accent colour** is user-customisable via the theme system (`src/theme/colors.ts`). Six built-in themes:
- Drafting (grey `#C8C8C8`) · Blueprint (blue `#4A90D9`) · Sketchbook (brown `#C4853A`)
- Studio (red `#C06050`) · Night Shift (purple `#8B6BC8`) · Copper (`#B87040`)

### Typography

Three fonts — each with a clear purpose:

| Font | Usage | Status |
|------|-------|--------|
| `ArchitectsDaughter_400Regular` | Headings, screen titles, hero text | Installed |
| `Inter` (system default) | Body text, paragraphs, descriptions | System font |
| `JetBrainsMono` | Numbers, measurements, dimensions, code | Needs install (`@expo-google-fonts/jetbrains-mono`) |

**Rules:**
- Never use ArchitectsDaughter for body copy — it reads poorly at small sizes
- Always use JetBrainsMono for any numerical measurement (m², ft², room dimensions)
- Inter at 14–16px for all UI labels and readable text

### Shape Language

ASORIA is an **oval-first** design system. Every element should feel soft.

| Element | Border Radius |
|---------|--------------|
| Buttons | 50px (fully oval) |
| Cards | 20–24px |
| Input fields | 50px (oval) |
| Chips and tags | 50px (pill) |
| Avatars | 999px (circle) |
| Modals / bottom sheets | 24px top corners |
| Tab bar container | 999px (pill) |

**Never use sharp corners.** Even utility components like toast notifications should have minimum 12px radius.

### Illustration Style

- White sketchy line art on dark backgrounds
- Thin architectural line drawings as screen backgrounds (structural grid lines, faint room outlines)
- Accent illustrations: compass rose, measuring tape, drafting pencil, floor plan silhouettes
- All illustrations: stroke-only, never filled, weight 1–2px
- Use SVG components — never bitmap PNGs for illustrations

---

## 4. AI Prompt System — Designer Interview

The AI generation flow is a **7-step designer interview**, not a text box. It lives in `GenerationScreen.tsx` and replaces any single-input generation UI.

### Step 1 — What Are We Building?

Large oval-corner cards in a 2×3 grid:

| Card | Icon |
|------|------|
| House | 🏠 |
| Apartment | 🏢 |
| Office | 🏗️ |
| Studio | 🏨 |
| Villa | 🏡 |
| Commercial | 🏪 |

Tap selects with a scale + glow animation. Selection stored in state.

### Step 2 — Tell Me About Your Space

- Number input: "What size is your plot or area?"
- Unit selector toggle: `m²` / `ft²` (oval pill toggle)
- Or quick estimate oval chips:
  - Small (under 100m²)
  - Medium (100–250m²)
  - Large (250–500m²)
  - Estate (500m²+)

### Step 3 — How Many Rooms?

Stepper controls with oval `-` / `+` buttons:
- Bedrooms: default 3
- Bathrooms: default 2
- Living Areas: default 1

Toggle switches (oval):
- Garage
- Garden / Lawn
- Pool → if enabled: pool size selector (small / medium / large)

### Step 4 — What Style Are You Going For?

Horizontal scroll of style cards, each with a small sketchy SVG illustration:
Modern · Minimalist · Industrial · Scandinavian · Art Deco · Victorian
Mediterranean · Tropical · Contemporary · Rustic · Bohemian · Coastal

Tier gating: show all styles, lock non-accessible ones with upgrade prompt.

### Step 5 — Any Inspiration? *(optional)*

- "Upload a photo for reference" — oval button opens image picker
- Photo uploads to Supabase Storage, returns URL for AI context
- "Skip this step" link

### Step 6 — Describe Anything Else

- Large oval text area
- Placeholder: *"A pool in the back, north facing windows, open plan kitchen..."*
- Oval microphone button (right side of input):
  - Tap to record — expo-av starts recording
  - Animated oval waveform shown while listening
  - On stop: sends to `transcribe` Edge Function (OpenAI Whisper)
  - Fallback: device speech recognition if Edge Function unavailable
  - Result auto-fills the text area; user can edit

### Step 7 — Review and Generate

Summary card showing all choices (building type, size, rooms, style, extras).
Large oval "Create My Design" button.

**Progress animation while generating:**
1. "Understanding your space..."
2. "Placing rooms..."
3. "Arranging furniture..."
4. "Adding outdoor elements..."
5. "Finishing touches..."

Each step shown as animated oval pill with fade transition.

### Structured Payload

```typescript
interface GenerationPayload {
  buildingType: 'house' | 'apartment' | 'office' | 'studio' | 'villa' | 'commercial';
  plotSize: number;
  plotUnit: 'm2' | 'ft2';
  bedrooms: number;
  bathrooms: number;
  livingAreas: number;
  hasGarage: boolean;
  hasGarden: boolean;
  hasPool: boolean;
  poolSize?: 'small' | 'medium' | 'large';
  style: string; // designStyle ID
  referenceImageUrl?: string;
  additionalNotes: string;
  transcript?: string; // voice transcription result
}
```

---

## 5. AI Generation — Output Requirements

The `ai-generate` Edge Function must produce complete, professional architectural plans. The system prompt must encode this knowledge.

### Structural Elements (always generated)

- Exterior walls with correct thickness (200–300mm standard)
- Interior walls with proper alignment to exterior grid
- Roof type appropriate to style (pitched, flat, hip, gable)
- Front door, internal doors, garage door (where applicable)
- Windows correctly placed on exterior walls only — never on interior walls
- Stairs if multi-floor
- Foundation outline

### Outdoor Elements (when requested)

- Garden / lawn area with boundary indication
- Pool with surrounding decking if requested
- Driveway and garage approach
- Gate and boundary / perimeter walls
- Pathway from gate to front door
- Patio / decking areas adjacent to living areas
- Tree and planted area indicators (circles with sketch fill)
- Flower bed indicators along perimeter

### Indoor Elements

All requested rooms with proper minimum dimensions:

| Room | Minimum m² |
|------|-----------|
| Master bedroom | 12 |
| Standard bedroom | 9 |
| Bathroom | 4 |
| Kitchen | 10 |
| Living room | 15 |
| Dining area | 10 |
| Garage (single) | 15 |

**Logical room placement rules:**
- Bedrooms away from street-facing walls
- Kitchen adjacent to dining area
- Bathrooms accessible from bedrooms (ensuite where possible)
- Living room facing garden or best natural light direction
- Utility / laundry adjacent to kitchen or garage

**Fitted furniture suggestions per room** — included in output.

### Services (indicated on plan, Creator+ tiers)

- Electrical socket positions
- Water outlet positions (kitchen, bathrooms, laundry)
- Light fitting positions (ceiling centre or track)
- Radiator / HVAC vent positions
- Boiler / utility room identified

### Self-Alignment Rules

The AI must always produce geometrically consistent plans:
- All walls snap to a 100mm grid
- No rooms overlap
- Doors centred on their walls
- Windows on exterior walls only
- All dimensions realistic (no 1m wide bedrooms)
- Nothing floating or disconnected from the main structure
- Stairs have correct rise (170–220mm) and run (250–300mm)

### Detail Level by Tier

| Tier | What's Generated |
|------|-----------------|
| Starter | Basic floor plan — walls, doors, windows only |
| Creator | Floor plan + furniture layout per room |
| Pro | All above + outdoor areas + service indicator positions + multi-floor up to 10 |
| Architect | Full professional plan + all services + dimension annotations + cost estimate markers |

---

## 6. Design Studio (Blueprint Workspace)

The Design Studio is the core editing environment. Accessible from:
- AI generation result → "Open in Studio"
- Sketch tab → "Send to Studio"
- AR scan → "Import to Studio"
- Home tab → tap existing project

### 2D Canvas (default view)

- Skia canvas renders the floor plan
- Walls: thick lines (8–12px stroke)
- Rooms: light texture fills with room name label
- Furniture: overhead symbol view
- Dimensions shown on all walls
- Grid overlay (toggleable, 100mm grid)

**Floating oval toolbar (bottom):**
Select · Wall · Door · Window · Furniture · Measure · Text · Erase

### 3D View (toggle)

React Three Fiber scene:
- Walls extruded to 2.4m (standard ceiling height)
- Roof generated automatically from floor plan geometry
- Furniture as 3D models from procedural library
- Ambient + directional lighting
- Day / Night toggle (changes light colour temperature)
- Walk-through mode (Creator+) — first-person camera

**Gestures:** Pinch to zoom, one-finger drag to orbit, two-finger drag to pan.

### AI Assistant in Studio

- Floating oval AI button (bottom right)
- Opens a slide-up chat overlay
- User types or speaks:
  - *"Add a window to the north wall"*
  - *"Make the kitchen 20% bigger"*
  - *"Add a fireplace to the living room"*
  - *"Suggest furniture for the master bedroom"*
- AI parses intent → sends structured mutation to blueprintStore actions
- Canvas updates in real time, animated
- Voice input same as generation flow (expo-av → transcribe Edge Function)

### Furniture Library

- Oval sheet slides up from bottom
- Categories as oval chips: Living · Bedroom · Kitchen · Bathroom · Office · Outdoor · Structural
- Items shown as oval cards with 3D overhead preview thumbnail
- Tap to place on canvas at room centre
- Drag to position, pinch to resize, two-finger rotate
- AI custom furniture: describe → generate via Meshy (Architect tier only)
- Upload furniture image: AI recreates as procedural model (Pro+)

### Logical Auto-Complete System

When user draws a closed room shape:
- Auto-detects room type from context (size, adjacency, label)
- Auto-suggests appropriate furniture (shown as ghost overlay, tap to accept)
- Auto-places electrical point positions
- Adds door if missing (shows door insertion prompt)

When user places a kitchen label:
- Auto-suggests sink position (exterior wall)
- Auto-suggests counter positions (perimeter)
- Suggests appliance zones (fridge, oven, dishwasher)

When bathroom is detected:
- Auto-suggests sanitaryware positions (WC, basin, shower/bath)
- Marks water outlet positions

When building is complete (all rooms connected, exterior closed):
- Auto-generates roof structure
- Suggests exterior wall finish material
- Offers to complete outdoor areas if not yet drawn

---

## 7. AR System — Full Rebuild

The existing AR implementation is non-functional and must be rebuilt from scratch. Three distinct modes accessible from the AR tab.

### Entry Screen

Before camera opens:
- Clear instruction card with oval outline
- Step illustration (sketchy SVG)
- "Point your camera at the room and walk slowly around the space"
- Camera permission request with clear explanation copy
- Mode selector at top: oval pill tabs — Scan · Place · Measure

### Mode 1 — Room Scan

Available: Creator+

- Camera live view fills screen
- Oval scan button at bottom
- User walks around room for 10–30 seconds
- App captures keyframes
- Sends frames to `ar-reconstruct` Edge Function
- Roboflow detects objects and surfaces in frames
- Returns detected room geometry and object list
- Shows detected objects as labelled oval overlay badges
- "Save Scan to Project" oval button
- "Import to Studio" oval button (see import flow below)

### Mode 2 — Furniture Placement

Available: Creator+

- Camera live view
- Surface detection using expo-sensors + accelerometer for plane estimation
- Furniture catalogue slides up from bottom (same as Studio library)
- Tap furniture to place at detected surface
- Drag to move along surface plane
- Pinch to scale
- Two-finger rotate
- Double-tap to confirm final position
- "Take Screenshot" oval button to save AR composition

### Mode 3 — Measure

Available: Pro+

- Camera live view with targeting crosshair
- Tap first point — drops anchor pin on detected surface
- Tap second point — drops second pin
- App calculates distance using camera focal length + accelerometer data
- Shows measurement in metres and feet
- "Add to Project Notes" saves measurement
- "Save All Measurements" exports as list

### Import to Studio

After any AR scan:
1. "Import to Design Studio" oval button appears
2. Converts scan geometry to simplified BlueprintData
3. Opens Studio with scan as background reference layer (50% opacity)
4. User traces over scan with wall tool to create clean blueprint
5. Scan layer toggleable (show / hide)

### Navigation in AR

- AR is a full-screen experience — no tab bar visible
- Mode selector at top as oval pill chips
- Back / exit button: top left, always visible
- Swipe down gesture dismisses AR and returns to previous tab

---

## 8. Create Tab (Sketch)

Formerly "Sketch" tab — the freehand creation space. Full screen, no tab bar while active.

### Tools (oval selector at top)

- ✏️ **Draw** — freehand on black canvas, white sketchy lines, pressure-sensitive
- 📐 **Wall** — tap two points to place wall segment, snaps to grid, auto-closes rooms
- 📏 **Measure** — tap two points to show dimension label
- 🔤 **Label** — tap to place room label text

### Draw Mode

- White lines on black canvas — like drawing on drafting paper
- Undo / redo oval buttons in top right
- Eraser: long-press on draw tool to switch to erase mode
- Stroke weight selector: 1px / 2px / 4px

### Wall Mode

- Tap first point, drag to second point, release to place wall
- Snaps to 100mm grid (visual grid faint overlay)
- Shows dimension in JetBrainsMono font as you drag
- When walls close a loop: auto-detects room, shows room type chips for labelling

### Room Presets Panel

Slide-up panel (oval handle):
Bedroom · Bathroom · Kitchen · Living Room · Garage · Garden · Pool · Office · Dining

Each as oval card — tap to stamp preset room outline onto canvas. Drag to position, pinch to resize.

### Send to Studio

- Floating oval "Open in Design Studio" button (bottom right)
- Converts sketch strokes + room shapes to BlueprintData JSON
- Navigates to Workspace screen with converted data as starting point

### Navigation

- Tab bar hidden while Create is active
- Swipe right → Home tab
- Swipe left → Inspo tab
- Back / exit button top right

---

## 9. Navigation and Gestures

### Tab Order

```
Home  ·  Create  ·  [ FAB ]  ·  Inspo  ·  AR  ·  Account
```

- **Home** (was Dashboard) — projects, dashboard, engagement
- **Create** (was Sketch) — freehand sketch canvas
- **FAB** — centre compass rose button → opens Generation modal (7-step interview)
- **Inspo** (was Feed) — community templates, masonry layout
- **AR** — camera-based AR modes
- **Account** — profile, subscription, settings

### Tab Bar Design

- Floating oval pill tab bar (not full-width bottom bar)
- Background: `#1A1A1A` with subtle border `#333333`
- Selected tab: white oval pill highlight behind icon
- Icons: thin line style, 24px
- No text labels — icons only
- Long-press icon: tooltip label appears

### Tab Bar Hide Rules

Tab bar is **completely hidden** on:
- AR screen (full-screen camera)
- Create / Sketch screen (full-screen canvas)
- Workspace / Design Studio (full-screen editor)
- Generation flow (full-screen interview steps)

### Swipe Gesture Map

| Gesture | Context | Action |
|---------|---------|--------|
| Swipe left / right | Between main tabs | Navigate tabs |
| Swipe left / right | Inside Studio | Switch 2D ↔ 3D view |
| Swipe down | AR screen | Exit AR |
| Swipe right | Generation step | Go back one step |
| Swipe down | Any modal / bottom sheet | Dismiss |

### Transitions

- All screen transitions: fade, 150ms
- No bounce or spring between screens
- Tab switches: instant with no animation (native feel)
- Modal presentation: slide up from bottom, 300ms ease-out

---

## 10. AI Self-Learning System

### User Preference Learning

After each AI generation, store in DB:
```
user_ai_preferences table:
  - user_id, building_type, style_id, plot_size, plot_unit
  - bedrooms, bathrooms, has_pool, has_garden, has_garage
  - user_rating (1–5, asked after generation), edits_count, time_in_studio_seconds
  - created_at
```

Build user preference profile:
- Most common building type
- Preferred style
- Typical room counts and plot size
- Preferred features

Pre-fill generation interview with last-used values. Show contextual hint:
> *"Last time you designed a Modern house — want to start with those settings?"*

### Community Learning

Aggregate anonymised patterns from community feed:
- Most liked room configurations per building type
- Most saved furniture arrangements per room type
- Most popular styles per region (if location permission granted)

Feed aggregated patterns into `ai-generate` system prompt as context examples.

### Architecture Knowledge Base

The `ai-generate` Edge Function system prompt must embed:

1. **Building code minimums** — room sizes, ceiling heights, door widths, stair regulations
2. **Structural basics** — load-bearing wall placement, beam spans, foundation types
3. **Interior design principles** — traffic flow, furniture clearances, focal points per room
4. **Landscaping basics** — privacy screening, sun path orientation, drainage gradients
5. **Feng shui fundamentals** — entry placement, natural light flow, bedroom positioning
6. **Universal accessibility** — wheelchair turn radii, accessible bathroom layouts, ramp grades
7. **Energy efficiency** — window-to-wall ratios, north/south orientation for passive solar, insulation zones
8. **Natural light optimisation** — window placement per compass direction, overhang calculations

This knowledge is embedded as structured context in the system prompt, not fetched at runtime.

---

## 11. Subscription Tiers

### Starter — Free Forever

| Limit | Value |
|-------|-------|
| Projects | 3 |
| Rooms per project | 4 |
| Furniture per room | 10 |
| AI generations / month | 10 |
| Daily edit time | 45 minutes |
| Undo steps | 10 |
| Design styles | minimalist, modern, rustic |
| AR | None |
| Auto-save | Manual only |
| Community | Read only |
| Multi-floor | No |

### Creator — $14.99/mo · $179.90/yr

| Limit | Value |
|-------|-------|
| Projects | 25 |
| Rooms per project | 15 |
| Furniture per room | 50 |
| AI generations / month | 200 |
| Daily edit time | Unlimited |
| Undo steps | 50 |
| Design styles | All 12 |
| AR | Furniture placement · 15 sessions/mo |
| Auto-save | 120s debounce |
| Community | Read + publish |
| Multi-floor | Up to 5 |
| Template revenue | 50% share |
| Walk-through mode | Yes |

### Pro — $24.99/mo · $239.90/yr *(NEW)*

| Limit | Value |
|-------|-------|
| Projects | 50 |
| Rooms per project | 20 |
| Furniture per room | 100 |
| AI generations / month | 500 |
| Daily edit time | Unlimited |
| Undo steps | 100 |
| Design styles | All 12 |
| AR | Furniture placement + Room Scan + Measure |
| Auto-save | 60s debounce |
| Community | Read + publish |
| Multi-floor | Up to 10 |
| Custom texture generation | Yes (Replicate SDXL) |
| AI image upload reference | Yes |
| Template revenue | 60% share |
| Furniture image upload → model | Yes |
| Walk-through mode | Yes |

### Architect — $39.99/mo · $383.90/yr

| Limit | Value |
|-------|-------|
| Projects | Unlimited |
| Rooms | Unlimited |
| Furniture | Unlimited |
| AI generations / month | Unlimited |
| Daily edit time | Unlimited |
| Undo steps | Unlimited |
| Design styles | All 12 |
| AR | All modes, unlimited |
| Auto-save | 30s debounce |
| Community | Read + publish + featured |
| Multi-floor | Unlimited |
| Custom AI furniture | Yes (Meshy) |
| Professional annotations | Yes |
| CAD export | Yes |
| Cost estimator | Yes |
| Team members | 5 |
| Commercial buildings | Yes |
| Template revenue | 70% share |
| White-label exports | Yes |
| VIP support | Yes |

### Stripe Setup

- Existing products: Starter (free), Creator, Architect — keep existing price IDs
- **Pro product: must be created manually in Stripe dashboard**
  - Monthly: $24.99 → add price ID to `.env` as `STRIPE_PRO_MONTHLY_PRICE_ID`
  - Annual: $239.90 → add price ID to `.env` as `STRIPE_PRO_ANNUAL_PRICE_ID`
  - Add both to Supabase Vault under the same key names
- All price ID handling lives in `src/screens/subscription/SubscriptionScreen.tsx` and `supabase/functions/stripe-checkout/`

---

## 12. Implementation Priorities

Work in this order. Each item is a separate implementation task.

| Priority | Task | Scope |
|----------|------|-------|
| P1 | Update `src/utils/tierLimits.ts` — add Pro tier, update Creator/Architect prices and limits | Payments Agent |
| P1 | Update `CLAUDE.md` — done (this document) | Architect Agent |
| P2 | Rebuild `GenerationScreen.tsx` — 7-step designer interview flow | UI Social Agent |
| P3 | Rename tabs: Dashboard→Home, Sketch→Create, Feed→Inspo | UI Social Agent |
| P3 | Redesign `CustomTabBar.tsx` — oval pill floating design | UI Social Agent |
| P4 | Install JetBrainsMono font — `@expo-google-fonts/jetbrains-mono` | UI Social Agent |
| P4 | Studio AI assistant — floating chat overlay in Workspace | AI Pipeline Agent |
| P4 | Logical auto-complete system in Workspace | 3D Blueprint Agent |
| P5 | AR full rebuild — Modes 1, 2, 3 + import to studio | AR Agent |
| P6 | User preference learning DB schema + pre-fill logic | Database Agent |
| P6 | Architecture knowledge base — update ai-generate system prompt | AI Pipeline Agent |
| P7 | Pro Stripe product creation (manual in dashboard) + price ID integration | Payments Agent |
| P7 | Cost estimator for Architect tier | AI Pipeline Agent |
| P7 | CAD export for Architect tier | 3D Blueprint Agent |

---

*End of ASORIA Master Plan — approved 2026-03-25*
