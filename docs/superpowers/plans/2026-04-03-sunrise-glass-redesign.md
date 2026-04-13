# Sunrise Glass Redesign + AR Structural Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current dark-grey UI with a deep-indigo sunrise glass system (warm amber/gold accents, frosted glass surfaces, BlurView backdrops) and fix all hardcoded AR positioning values that cause UI overlaps.

**Architecture:** New `src/theme/sunrise.ts` exports color + glass tokens; `colors.ts` and `designSystem.ts` re-export them so all existing `DS.colors.*` references auto-update. AR fixes replace hardcoded `bottom`/`top` pixel values with `useSafeAreaInsets`-derived values in each mode component.

**Tech Stack:** React Native + Expo SDK 55 · NativeWind (Tailwind) · Reanimated 3 · expo-blur (BlurView) · expo-linear-gradient · react-native-safe-area-context

---

## File Map

| Action | File |
|--------|------|
| **Install** | package.json (expo-blur, expo-linear-gradient) |
| **Create** | `src/theme/sunrise.ts` |
| **Modify** | `src/theme/colors.ts` |
| **Modify** | `src/theme/designSystem.ts` |
| **Modify** | `src/navigation/CustomTabBar.tsx` |
| **Modify** | `src/components/common/OvalButton.tsx` |
| **Modify** | `src/components/common/OvalInput.tsx` |
| **Modify** | `src/components/common/ScreenHeader.tsx` |
| **Modify** | `src/components/common/Toast.tsx` |
| **Modify** | `src/components/ar/ARManualMeasureMode.tsx` |
| **Modify** | `src/components/ar/ARDepthScanMode.tsx` |
| **Modify** | `src/components/ar/ARPhotoMode.tsx` |
| **Modify** | `src/components/ar/ARMeasureMode.tsx` |
| **Modify** | `src/components/ar/ARInstructionBubble.tsx` |
| **Modify** | `src/components/ar/ARMeasurementOverlay.tsx` |
| **Modify** | `src/components/ar/ARBackButton.tsx` |
| **Modify** | `src/components/ar/ARModeSelector.tsx` |
| **Modify** | `src/screens/ar/ARScanScreen.tsx` |
| **Modify** | `src/screens/dashboard/DashboardScreen.tsx` |
| **Modify** | `src/screens/auth/WelcomeScreen.tsx` |
| **Modify** | `src/screens/auth/LoginScreen.tsx` |
| **Modify** | `src/screens/auth/SignUpScreen.tsx` |

---

### Task 1: Install expo-blur and expo-linear-gradient

**Files:**
- Modify: `package.json` (handled by npx expo install)

- [ ] **Step 1: Install packages**

```bash
npx expo install expo-blur expo-linear-gradient
```

Expected: both appear in package.json under dependencies with Expo SDK 55-compatible versions.

- [ ] **Step 2: Verify install**

```bash
npx expo install --check
```

Expected: no version mismatch warnings for the two new packages.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "feat: install expo-blur and expo-linear-gradient for glass UI"
```

---

### Task 2: Create sunrise.ts token file

**Files:**
- Create: `src/theme/sunrise.ts`

- [ ] **Step 1: Create the token file**

```typescript
// src/theme/sunrise.ts
// Sunrise Glass design tokens — single source of truth for the warm sunrise palette.
// Import from colors.ts and designSystem.ts, not directly from this file.

export const SUNRISE = {
  // Sky Base
  background: '#0E0B1A',
  surface: '#16122A',
  elevated: '#1F1A38',
  border: 'rgba(180, 130, 220, 0.15)',

  // Sunrise Accent Spectrum
  rose: '#E8758A',
  amber: '#D4844B',
  gold: '#E8B86D',
  peach: '#F2C4A0',

  // Text (warm shift)
  textPrimary: '#F5F0EA',
  textSecondary: '#9A8E8A',
  textDim: '#5A5050',

  // Glass surfaces
  glass: {
    subtleBg: 'rgba(255, 255, 255, 0.04)',
    subtleBorder: 'rgba(255, 200, 150, 0.08)',
    mediumBg: 'rgba(255, 255, 255, 0.08)',
    mediumBorder: 'rgba(255, 180, 120, 0.15)',
    prominentBg: 'rgba(255, 255, 255, 0.12)',
    prominentBorder: 'rgba(255, 160, 80, 0.25)',
    navBg: 'rgba(14, 11, 26, 0.85)',
    navBorder: 'rgba(232, 181, 109, 0.20)',
  },

  // Semantic aliases
  goldBorderDim: 'rgba(232, 181, 109, 0.12)',
  goldBorderPress: 'rgba(232, 181, 109, 0.35)',
  goldBorderFocus: 'rgba(232, 181, 109, 0.50)',
  violetBorder: 'rgba(180, 130, 220, 0.20)',
  toastBg: 'rgba(22, 18, 42, 0.95)',
  sheetHandle: 'rgba(232, 181, 109, 0.30)',
  sheetTopBorder: 'rgba(232, 181, 109, 0.20)',
  separatorLine: 'rgba(232, 181, 109, 0.10)',
  inactiveTint: 'rgba(242, 196, 160, 0.40)',
} as const;
```

- [ ] **Step 2: Verify TypeScript parses the file**

```bash
npx tsc --noEmit src/theme/sunrise.ts 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/theme/sunrise.ts
git commit -m "feat: add sunrise glass color tokens"
```

---

### Task 3: Update colors.ts and designSystem.ts

**Files:**
- Modify: `src/theme/colors.ts`
- Modify: `src/theme/designSystem.ts`

- [ ] **Step 1: Read current colors.ts**

Read `src/theme/colors.ts` before editing.

- [ ] **Step 2: Add SUNRISE import and override BASE_COLORS**

In `src/theme/colors.ts`, add the import at the top and update BASE_COLORS:

```typescript
import { SUNRISE } from './sunrise';

export const BASE_COLORS = {
  background: SUNRISE.background,
  surface: SUNRISE.surface,
  surfaceHigh: SUNRISE.elevated,
  border: SUNRISE.border,
  primary: SUNRISE.gold,
  primaryGhost: SUNRISE.inactiveTint,
  primaryDim: SUNRISE.textSecondary,
  textPrimary: SUNRISE.textPrimary,
  textSecondary: SUNRISE.textSecondary,
  textDim: SUNRISE.textDim,
  accent: SUNRISE.amber,
  rose: SUNRISE.rose,
  peach: SUNRISE.peach,
  success: '#7AB87A',
  warning: SUNRISE.amber,
  error: SUNRISE.rose,
};
```

Keep the existing COLOR_THEMES and `useThemeColors` / `getThemeColors` exports exactly as they are — only BASE_COLORS changes.

- [ ] **Step 3: Read current designSystem.ts**

Read `src/theme/designSystem.ts` before editing.

- [ ] **Step 4: Update DS.colors to reference SUNRISE tokens**

In `src/theme/designSystem.ts`, import SUNRISE and update the colors block only:

```typescript
import { SUNRISE } from './sunrise';

// Inside the DS object, replace the colors block:
colors: {
  background: SUNRISE.background,
  surface: SUNRISE.surface,
  surfaceHigh: SUNRISE.elevated,
  border: SUNRISE.border,
  primary: SUNRISE.gold,
  primaryGhost: SUNRISE.inactiveTint,
  primaryDim: SUNRISE.textSecondary,
  accent: SUNRISE.amber,
  rose: SUNRISE.rose,
  success: '#7AB87A',
  warning: SUNRISE.amber,
  error: SUNRISE.rose,
},
```

Leave all other DS properties (radius, spacing, font, fontSize, animation, shadow) unchanged.

- [ ] **Step 5: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: zero new errors.

- [ ] **Step 6: Commit**

```bash
git add src/theme/colors.ts src/theme/designSystem.ts
git commit -m "feat: wire sunrise palette into BASE_COLORS and DS.colors"
```

---

### Task 4: Redesign CustomTabBar — glass pill with BlurView and gold active icon

**Files:**
- Modify: `src/navigation/CustomTabBar.tsx`

- [ ] **Step 1: Read the current file**

Read `src/navigation/CustomTabBar.tsx` in full before editing.

- [ ] **Step 2: Add BlurView import**

At the top of `CustomTabBar.tsx`, add:

```typescript
import { BlurView } from 'expo-blur';
```

- [ ] **Step 3: Replace tab bar container with glass pill**

Find the outer container View (the floating pill). Replace its `style` prop:

```typescript
// Before (find the container View with backgroundColor: DS.colors.background)
// After — wrap it: outer View keeps absolute positioning, BlurView adds backdrop:

<View
  style={{
    position: 'absolute',
    bottom: insets.bottom + 12,
    left: 24,
    right: 24,
    height: 64,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: SUNRISE.glass.navBorder,
    shadowColor: SUNRISE.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 16,
  }}
>
  <BlurView
    intensity={40}
    tint="dark"
    style={{
      flex: 1,
      backgroundColor: SUNRISE.glass.navBg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingHorizontal: 8,
    }}
  >
    {/* existing tab buttons go here unchanged */}
  </BlurView>
</View>
```

Add the import at the top:

```typescript
import { SUNRISE } from '../theme/sunrise';
```

- [ ] **Step 4: Update active icon color and inactive tint**

In the tab icon render, replace:
- Active icon stroke/fill: `DS.colors.primary` → `SUNRISE.gold`
- Inactive icon stroke/fill: `DS.colors.primaryGhost` → `SUNRISE.inactiveTint`

Search for the two color references in the icon render logic and update them.

- [ ] **Step 5: Update FAB button**

Find the FAB (center compass rose button). Update its style:

```typescript
// FAB background: gold → amber gradient via LinearGradient
// Replace the FAB View background with:
import { LinearGradient } from 'expo-linear-gradient';

// FAB container (keep existing size/position):
<LinearGradient
  colors={[SUNRISE.gold, SUNRISE.amber]}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={{
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: SUNRISE.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 16,
  }}
>
  {/* compass rose SVG — keep existing, update stroke to SUNRISE.background */}
</LinearGradient>
```

- [ ] **Step 6: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: zero errors.

- [ ] **Step 7: Commit**

```bash
git add src/navigation/CustomTabBar.tsx
git commit -m "feat: glass tab bar with BlurView, gold active icon, gradient FAB"
```

---

### Task 5: Update OvalButton — gradient primary, glass outline

**Files:**
- Modify: `src/components/common/OvalButton.tsx`

- [ ] **Step 1: Read current OvalButton.tsx**

Read `src/components/common/OvalButton.tsx` in full before editing.

- [ ] **Step 2: Add LinearGradient import and SUNRISE import**

```typescript
import { LinearGradient } from 'expo-linear-gradient';
import { SUNRISE } from '../../theme/sunrise';
```

- [ ] **Step 3: Update the `filled` variant**

Find the filled variant's container. Wrap with LinearGradient instead of a plain View:

```typescript
// filled variant — replace opaque background View with gradient:
if (variant === 'filled') {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={pressableStyle}>
      <LinearGradient
        colors={[SUNRISE.gold, SUNRISE.amber]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[baseContainerStyle, { borderRadius: DS.radius.oval }]}
      >
        <Text style={[labelStyle, { color: SUNRISE.background }]}>{label}</Text>
        {icon}
      </LinearGradient>
    </Pressable>
  );
}
```

- [ ] **Step 4: Update `outline` variant**

```typescript
// outline variant — glass background + gold border:
outline: {
  backgroundColor: SUNRISE.glass.subtleBg,
  borderWidth: 1,
  borderColor: SUNRISE.glass.navBorder,  // rgba(232,181,109,0.20)
}
// outline text color: SUNRISE.gold
```

- [ ] **Step 5: Update `danger` variant**

```typescript
// danger variant — glass + rose border:
danger: {
  backgroundColor: SUNRISE.glass.subtleBg,
  borderWidth: 1,
  borderColor: 'rgba(232, 117, 138, 0.30)',
}
// danger text color: SUNRISE.rose
```

- [ ] **Step 6: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: zero errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/common/OvalButton.tsx
git commit -m "feat: OvalButton — gradient primary, glass outline/danger variants"
```

---

### Task 6: Update OvalInput — glass background + gold focus border

**Files:**
- Modify: `src/components/common/OvalInput.tsx`

- [ ] **Step 1: Read current OvalInput.tsx**

Read `src/components/common/OvalInput.tsx` in full before editing.

- [ ] **Step 2: Add SUNRISE import**

```typescript
import { SUNRISE } from '../../theme/sunrise';
```

- [ ] **Step 3: Update container style**

Replace the container `backgroundColor` and `borderColor`:

```typescript
// Default state:
backgroundColor: SUNRISE.glass.subtleBg,   // was DS.colors.surface
borderColor: SUNRISE.violetBorder,          // was DS.colors.border
borderWidth: 1,

// Focused state (isFocused === true):
borderColor: SUNRISE.goldBorderFocus,       // was DS.colors.accent
// Optional: add subtle shadow on focus:
shadowColor: SUNRISE.gold,
shadowOffset: { width: 0, height: 0 },
shadowOpacity: 0.25,
shadowRadius: 8,
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 5: Commit**

```bash
git add src/components/common/OvalInput.tsx
git commit -m "feat: OvalInput — glass bg, violet default border, gold focus border"
```

---

### Task 7: Update ScreenHeader and Toast

**Files:**
- Modify: `src/components/common/ScreenHeader.tsx`
- Modify: `src/components/common/Toast.tsx`

- [ ] **Step 1: Update ScreenHeader background and separator**

In `ScreenHeader.tsx`:
- Add `import { SUNRISE } from '../../theme/sunrise';`
- Container `backgroundColor`: change `DS.colors.background` → `'transparent'`
- Add a bottom separator:

```typescript
// After the main View, add a separator line:
<View style={{ height: 1, backgroundColor: SUNRISE.separatorLine }} />
```

- Back button circle: `backgroundColor: SUNRISE.glass.subtleBg`, `borderWidth: 1`, `borderColor: SUNRISE.glass.subtleBorder`

- [ ] **Step 2: Update Toast**

In `Toast.tsx`:
- Add `import { SUNRISE } from '../../theme/sunrise';`
- Container `backgroundColor`: change `colors.surfaceHigh` → `SUNRISE.toastBg`
- `borderLeftColor` for `info` type: change `colors.primary` → `SUNRISE.gold`
- Keep existing success/warning/error colors (they now map to sunrise palette via DS.colors)

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 4: Commit**

```bash
git add src/components/common/ScreenHeader.tsx src/components/common/Toast.tsx
git commit -m "feat: ScreenHeader transparent + separator, Toast glass dark bg"
```

---

### Task 8: Fix AR structural bugs — ARManualMeasureMode.tsx

**Files:**
- Modify: `src/components/ar/ARManualMeasureMode.tsx`

- [ ] **Step 1: Read ARManualMeasureMode.tsx**

Read `src/components/ar/ARManualMeasureMode.tsx` in full.

- [ ] **Step 2: Add useSafeAreaInsets if not already imported**

```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Inside the component:
const insets = useSafeAreaInsets();
```

- [ ] **Step 3: Replace hardcoded bottom and top values**

Find and replace:
- `bottom: 48` → `bottom: insets.bottom + 24`
- `bottom: 120` → `bottom: insets.bottom + 96`
- `top: 200` → `top: insets.top + 120`
- `top: 60` → `top: insets.top + 16`

Confirm these are the positioning values found at lines 277, 210, 301.

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep ARManualMeasureMode
```

Expected: no output (no errors).

- [ ] **Step 5: Commit**

```bash
git add src/components/ar/ARManualMeasureMode.tsx
git commit -m "fix: ARManualMeasureMode — replace hardcoded top/bottom with insets"
```

---

### Task 9: Fix AR structural bugs — ARDepthScanMode.tsx

**Files:**
- Modify: `src/components/ar/ARDepthScanMode.tsx`

- [ ] **Step 1: Read ARDepthScanMode.tsx**

Read `src/components/ar/ARDepthScanMode.tsx` in full.

- [ ] **Step 2: Add useSafeAreaInsets**

```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const insets = useSafeAreaInsets();
```

- [ ] **Step 3: Replace hardcoded values**

- `bottom: 48` → `bottom: insets.bottom + 24`
- `top: 200` → `top: insets.top + 120`
- `top: 60` → `top: insets.top + 16`
- `top: 160` → `top: insets.top + 80`

Confirm against lines 224, 188, 244, 339.

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep ARDepthScanMode
```

- [ ] **Step 5: Commit**

```bash
git add src/components/ar/ARDepthScanMode.tsx
git commit -m "fix: ARDepthScanMode — replace hardcoded top/bottom with insets"
```

---

### Task 10: Fix AR structural bugs — ARPhotoMode.tsx and ARMeasureMode.tsx

**Files:**
- Modify: `src/components/ar/ARPhotoMode.tsx`
- Modify: `src/components/ar/ARMeasureMode.tsx`

- [ ] **Step 1: Read both files**

Read `src/components/ar/ARPhotoMode.tsx` and `src/components/ar/ARMeasureMode.tsx` in full.

- [ ] **Step 2: Fix ARPhotoMode.tsx**

Add `useSafeAreaInsets` if missing. Replace:
- `bottom: 48` → `bottom: insets.bottom + 24`
- `bottom: 120` → `bottom: insets.bottom + 96`
- `top: 60` → `top: insets.top + 16`
- `top: 240` → `top: insets.top + 160`

Confirm against lines 241, 256, 203, 208, 233.

- [ ] **Step 3: Fix ARMeasureMode.tsx**

Add `useSafeAreaInsets` if missing. Replace:
- `top: 100` → `top: insets.top + 20`
- `top: 160` → `top: insets.top + 80`
- `bottom: 48` → `bottom: insets.bottom + 24`

Confirm against lines 52, 123, 272, 344, 193, 440.

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep -E "ARPhotoMode|ARMeasureMode"
```

- [ ] **Step 5: Commit**

```bash
git add src/components/ar/ARPhotoMode.tsx src/components/ar/ARMeasureMode.tsx
git commit -m "fix: ARPhotoMode + ARMeasureMode — replace hardcoded top/bottom with insets"
```

---

### Task 11: Fix AR structural bugs — ARInstructionBubble.tsx and ARMeasurementOverlay.tsx

**Files:**
- Modify: `src/components/ar/ARInstructionBubble.tsx`
- Modify: `src/components/ar/ARMeasurementOverlay.tsx`

- [ ] **Step 1: Read both files**

Read `src/components/ar/ARInstructionBubble.tsx` and `src/components/ar/ARMeasurementOverlay.tsx` in full.

- [ ] **Step 2: Fix ARInstructionBubble.tsx**

Add `useSafeAreaInsets` if missing. Replace:
- `bottom: 120` → `bottom: insets.bottom + 96`

The bubble sits above the controls — verify line 56.

- [ ] **Step 3: Fix ARMeasurementOverlay.tsx**

Add `useSafeAreaInsets` if missing. Replace any hardcoded `top: 160` with `top: insets.top + 80`.

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep -E "ARInstructionBubble|ARMeasurementOverlay"
```

- [ ] **Step 5: Commit**

```bash
git add src/components/ar/ARInstructionBubble.tsx src/components/ar/ARMeasurementOverlay.tsx
git commit -m "fix: ARInstructionBubble + ARMeasurementOverlay — insets-based positioning"
```

---

### Task 12: AR visual refresh — glass overlays on all AR components

**Files:**
- Modify: `src/components/ar/ARBackButton.tsx`
- Modify: `src/components/ar/ARModeSelector.tsx`
- Modify: `src/screens/ar/ARScanScreen.tsx`

- [ ] **Step 1: Read ARBackButton.tsx and ARModeSelector.tsx**

Read both files in full.

- [ ] **Step 2: Update ARBackButton to glass style**

Add `import { SUNRISE } from '../../theme/sunrise';`

Replace button container style:

```typescript
// Replace DS.colors.surface background:
backgroundColor: SUNRISE.glass.prominentBg,
borderWidth: 1,
borderColor: SUNRISE.glass.prominentBorder,
// Keep existing borderRadius and padding
```

- [ ] **Step 3: Update ARModeSelector to glass pills**

Add `import { SUNRISE } from '../../theme/sunrise';`

Mode selector container (the pill row):
```typescript
backgroundColor: SUNRISE.glass.navBg,
borderWidth: 1,
borderColor: SUNRISE.glass.navBorder,
borderRadius: 999,
```

Active mode pill:
```typescript
backgroundColor: SUNRISE.glass.mediumBg,
borderColor: SUNRISE.gold,
borderWidth: 1,
```

Inactive mode text: `color: SUNRISE.inactiveTint`
Active mode text: `color: SUNRISE.gold`

- [ ] **Step 4: Update ARScanScreen — ScanModeCard glass style**

In `ARScanScreen.tsx`, find the `ScanModeCard` component's Pressable style. Replace:

```typescript
// Available card:
backgroundColor: SUNRISE.glass.subtleBg,
borderColor: SUNRISE.goldBorderDim,

// Unavailable card:
backgroundColor: 'rgba(14, 11, 26, 0.50)',
borderColor: SUNRISE.glass.subtleBorder,
```

Card title text: `color: SUNRISE.gold` (when available), `color: SUNRISE.textSecondary` (when unavailable)

Screen background (the entry screen View): `backgroundColor: SUNRISE.background`

- [ ] **Step 5: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep -E "ARBackButton|ARModeSelector|ARScanScreen"
```

- [ ] **Step 6: Commit**

```bash
git add src/components/ar/ARBackButton.tsx src/components/ar/ARModeSelector.tsx src/screens/ar/ARScanScreen.tsx
git commit -m "feat: AR glass overlay system — glass back button, mode pills, scan mode cards"
```

---

### Task 13: DashboardScreen glass card treatment

**Files:**
- Modify: `src/screens/dashboard/DashboardScreen.tsx`

- [ ] **Step 1: Read DashboardScreen.tsx**

Read `src/screens/dashboard/DashboardScreen.tsx` in full before editing.

- [ ] **Step 2: Add SUNRISE import**

```typescript
import { SUNRISE } from '../../theme/sunrise';
```

- [ ] **Step 3: Update screen background**

Root container `backgroundColor`: `SUNRISE.background`

- [ ] **Step 4: Update stats cards**

Any stats card containers:
```typescript
backgroundColor: SUNRISE.glass.mediumBg,
borderWidth: 1,
borderColor: SUNRISE.glass.mediumBorder,
borderRadius: 20,
```

Stats number text: `color: SUNRISE.amber`

- [ ] **Step 5: Update project cards**

Project card containers (or ProjectCard component if it's a shared component):
```typescript
backgroundColor: SUNRISE.glass.subtleBg,
borderWidth: 1,
borderColor: SUNRISE.goldBorderDim,
borderRadius: 20,
```

On press (via Animated scale): `borderColor: SUNRISE.goldBorderPress`

- [ ] **Step 6: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep DashboardScreen
```

- [ ] **Step 7: Commit**

```bash
git add src/screens/dashboard/DashboardScreen.tsx
git commit -m "feat: Dashboard — glass card treatment, amber stats, indigo background"
```

---

### Task 14: Auth screens glass card treatment

**Files:**
- Modify: `src/screens/auth/WelcomeScreen.tsx`
- Modify: `src/screens/auth/LoginScreen.tsx`
- Modify: `src/screens/auth/SignUpScreen.tsx`

- [ ] **Step 1: Read all three files**

Read `WelcomeScreen.tsx`, `LoginScreen.tsx`, `SignUpScreen.tsx` in full before editing.

- [ ] **Step 2: Add SUNRISE import to all three**

```typescript
import { SUNRISE } from '../../theme/sunrise';
```

- [ ] **Step 3: Update WelcomeScreen**

Root container: `backgroundColor: SUNRISE.background`

Logo/headline text: `color: SUNRISE.textPrimary`

CTA card wrapper (if any): glass prominent treatment:
```typescript
backgroundColor: SUNRISE.glass.prominentBg,
borderWidth: 1,
borderColor: SUNRISE.glass.prominentBorder,
borderRadius: 24,
```

- [ ] **Step 4: Update LoginScreen**

Root container: `backgroundColor: SUNRISE.background`

Form card wrapper:
```typescript
backgroundColor: SUNRISE.glass.prominentBg,
borderWidth: 1,
borderColor: SUNRISE.glass.prominentBorder,
borderRadius: 24,
padding: 24,
```

Link text (forgot password, sign up): `color: SUNRISE.gold`

- [ ] **Step 5: Update SignUpScreen**

Same glass card treatment as LoginScreen. Tier badge if shown:
- Paid tier: `backgroundColor: SUNRISE.gold + '20'`, `color: SUNRISE.gold`
- Free tier: `backgroundColor: SUNRISE.violetBorder`, `color: SUNRISE.textSecondary`

- [ ] **Step 6: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep -E "WelcomeScreen|LoginScreen|SignUpScreen"
```

- [ ] **Step 7: Commit**

```bash
git add src/screens/auth/WelcomeScreen.tsx src/screens/auth/LoginScreen.tsx src/screens/auth/SignUpScreen.tsx
git commit -m "feat: auth screens — glass card form wrapper, indigo background, gold links"
```

---

### Task 15: Full TypeScript compilation check

**Files:**
- No file changes — verification only

- [ ] **Step 1: Run full tsc check**

```bash
npx tsc --noEmit 2>&1
```

Expected: zero errors. If errors appear, read each one, identify the file and line, fix the type issue (typically a missing import or incorrect color value reference), then re-run.

- [ ] **Step 2: Common fix patterns**

If `SUNRISE` is not found: check the import path is `../../theme/sunrise` or `../theme/sunrise` depending on depth.

If `LinearGradient` color prop errors: ensure `colors` prop is typed as `string[]` — use `as const` array or explicit type cast.

If `BlurView` intensity type: `intensity` accepts `number` (0–100), `tint` accepts `'light' | 'dark' | 'default'`.

- [ ] **Step 3: Final commit**

```bash
git add -p  # stage only intentional fixes
git commit -m "fix: tsc errors from sunrise glass redesign"
```

---

## Verification Checklist

- [ ] `npx tsc --noEmit` → zero errors
- [ ] Tab bar: deep indigo glass pill, gold border, gold active icon, gold→amber FAB gradient
- [ ] OvalButton filled: gold→amber gradient, indigo text
- [ ] OvalInput: violet border default, gold border on focus
- [ ] AR entry screen: indigo background, glass scan mode cards visible without overlap
- [ ] AR camera modes: no controls hidden behind nav bar or status bar
- [ ] DashboardScreen: glass cards, amber numbers
- [ ] Auth screens: glass form cards, warm indigo background
- [ ] Toast: dark glass background with gold left bar
