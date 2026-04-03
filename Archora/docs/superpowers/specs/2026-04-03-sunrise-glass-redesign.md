# ASORIA — Sunrise Glass UI Redesign + AR System Fix

**Date:** 2026-04-03
**Approved approach:** B — Dark base with sunrise glows, glass surfaces, full visual departure
**Scope:** All screens + AR structural fixes

---

## 1. Design Direction

Dark deep-indigo backgrounds. Every surface (cards, nav, sheets, inputs, buttons) is frosted glass with warm amber/gold borders and soft glows. Sunrise accent palette — rose, amber, gold, peach — used for interactive elements, glows, and active states. The sky is implied through colour, not a literal gradient background.

---

## 2. Color & Glass Tokens — `src/theme/sunrise.ts` (new file)

### Sky Base Palette
```typescript
background:  '#0E0B1A'   // pre-dawn deep indigo
surface:     '#16122A'   // dark violet sky
elevated:    '#1F1A38'   // lifted violet
border:      'rgba(180, 130, 220, 0.15)'  // warm violet edge
```

### Sunrise Accent Spectrum
```typescript
rose:    '#E8758A'   // first light
amber:   '#D4844B'   // warm horizon orange
gold:    '#E8B86D'   // peak sunrise (replaces primary #C8C8C8)
peach:   '#F2C4A0'   // soft horizon haze
```

### Glass System
| Token | Background | Border | Use |
|-------|-----------|--------|-----|
| `glass.subtle` | `rgba(255,255,255,0.04)` | `rgba(255,200,150,0.08)` | Cards, rows |
| `glass.medium` | `rgba(255,255,255,0.08)` | `rgba(255,180,120,0.15)` | Elevated cards, chips |
| `glass.prominent` | `rgba(255,255,255,0.12)` | `rgba(255,160,80,0.25)` | Sheets, modals |
| `glass.nav` | `rgba(14,11,26,0.85)` | `rgba(232,181,109,0.20)` | Tab bar, top bars |

### Text (warm shift)
```typescript
primary:   '#F5F0EA'
secondary: '#9A8E8A'
dim:       '#5A5050'
```

### Implementation
- New file: `src/theme/sunrise.ts` exports `SUNRISE` object
- `src/theme/colors.ts` imports and re-exports as default theme override
- `BASE_COLORS` updated to use sunrise palette
- All existing references to `DS.colors.*` automatically pick up new values

---

## 3. Component Changes

### CustomTabBar
- BlurView backdrop (`expo-blur`, intensity 40)
- Glass nav background + gold border
- Active icon: `#E8B86D` + soft radial glow (Reanimated pulse)
- Inactive: `rgba(242,196,160,0.40)`
- FAB: amber→rose gradient, gold shadow `elevation: 16`

### Cards (ProjectCard, TemplateCard, ScanModeCard)
- `glass.subtle` background
- Gold edge `rgba(232,181,109,0.12)`, brightens on press to `0.35`
- Scale press: `0.97` via Reanimated

### OvalInput
- Default border: violet `rgba(180,130,220,0.20)`
- Focused border: gold `rgba(232,181,109,0.50)` + glow shadow

### OvalButton
- Primary: gold→amber gradient `#E8B86D → #D4844B`, indigo text
- Secondary: `glass.subtle` + gold border
- Destructive: `glass.subtle` + rose border

### ScreenHeader
- Transparent background
- Separator: `rgba(232,181,109,0.10)`

### Bottom Sheets (all variants)
- `glass.prominent` + BlurView
- Handle: `rgba(232,181,109,0.30)`
- Top border: `rgba(232,181,109,0.20)`

### Toast
- `rgba(22,18,42,0.95)` + left accent bar `3px #E8B86D`

---

## 4. Screen-by-Screen Changes

### Dashboard
- Background `#0E0B1A`
- Stats cards → `glass.medium`, amber numbers
- Project cards → glass card system
- Streak flame → amber/rose Reanimated glow pulse

### Generation (ARIA interview)
- Step progress pill → gold gradient fill
- ARIA chat bubbles → `glass.prominent`
- User chat bubbles → `glass.subtle`
- Step selection cards → gold border ring on active

### Design Studio (BlueprintWorkspaceScreen)
- Top bar → `glass.nav` treatment, no opaque background
- Toolbar → single glass pill wrapping all tools, gold active indicator
- AI chat bubble → amber glow on new message
- Sheets → glass system

### Feed (Inspo)
- Masonry cards → glass card system
- Active filter chips → gold border
- Search bar → glass input

### Account
- Section rows → `glass.subtle` grouped cards
- Tier badge → gold gradient (paid), violet (starter)
- Danger zone → rose glass

### Auth (Welcome, Login, SignUp)
- Glass card wrapping form fields
- Gold primary CTA
- Warm white logo text

---

## 5. AR Screen — Structural Fixes + Visual Refresh

### Bug Fixes (non-negotiable)
1. **`bottom: 48` / `bottom: 120`** in all AR mode components → `bottom: insets.bottom + 24`
   Files: `ARManualMeasureMode.tsx`, `ARDepthScanMode.tsx`, `ARPhotoMode.tsx`, `ARMeasureMode.tsx`
2. **`top: 160`** in instruction bubbles, mini maps → `top: insets.top + 120`
   Files: `ARInstructionBubble.tsx`, `ARMeasurementOverlay.tsx`, `ARDepthScanMode.tsx`
3. **Verify scan mode entry cards** are wired to `handleSelectScanMode` — read and confirm each `ScanModeCard` onPress

### Visual
- AR overlays (instruction bubbles, mode selector, capture button, back button) → `glass.prominent`
- Capture button: large frosted circle, gold border, amber scale glow on press
- AR entry screen: `ScanModeCard` → glass card system, gold active border
- Mode selector pills → glass nav treatment

---

## 6. Implementation Order

1. `src/theme/sunrise.ts` — new token file
2. `src/theme/colors.ts` — update BASE_COLORS
3. `src/theme/designSystem.ts` — update DS object
4. `CustomTabBar.tsx` — glass nav (highest visual impact)
5. Shared components: `OvalButton`, `OvalInput`, `ScreenHeader`, sheets, `Toast`
6. AR fixes (structural) — `useSafeAreaInsets` in all mode components
7. `ARScanScreen.tsx` + AR mode components — visual refresh
8. `DashboardScreen.tsx`
9. `GenerationScreen.tsx`
10. `BlueprintWorkspaceScreen.tsx`
11. Auth screens
12. `FeedScreen.tsx`, `AccountScreen.tsx`
13. `tsc --noEmit` → zero errors

---

## 7. Constraints
- NativeWind (Tailwind) only — no `StyleSheet.create`
- Reanimated 3 for all animations
- `expo-blur` BlurView for glass backdrop (already in package.json)
- Keep all existing component APIs — visual changes only, no prop changes
- AR bug fixes must not change AR data flow, only positioning values
