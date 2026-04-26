# Full Responsive System — Phones + Tablets/iPads

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make ASORIA app fully responsive across iPhone, iPad, and Android tablets — from 375pt phone to 1024pt iPad Pro. Device classification, scalable tokens, adaptive tab bar, and responsive layouts.

**Architecture:** A single `useDeviceType()` hook becomes the reactive foundation for all responsive decisions. A `responsive.ts` token file provides device-class-scaled values. CustomTabBar adapts sizing and width per device class. Screen layouts use device context for grid columns and spacing.

**Tech Stack:** React Native, TypeScript, NativeWind, Reanimated 3, Expo SDK 54

---

## File Map

**New files:**
- `src/hooks/useDeviceType.ts` — device classification hook (foundation)
- `src/theme/responsive.ts` — responsive token constants

**Modified files:**
- `tailwind.config.js` — add device-class breakpoint screens
- `src/navigation/CustomTabBar.tsx` — adaptive sizing, width, touch targets
- `src/hooks/useSwipeToDismiss.ts` — static → reactive dimensions
- `src/hooks/useSwipeToBack.ts` — static → reactive dimensions
- `src/screens/SplashScreen.tsx` — static → reactive dimensions
- `src/screens/onboarding/OnboardingScreen.tsx` — static → reactive dimensions
- `src/screens/dashboard/DashboardScreen.tsx` — responsive grid columns
- `src/screens/feed/FeedScreen.tsx` — dynamic FlashList columns
- `src/screens/feed/PurchaseTemplateScreen.tsx` — static → reactive dimensions
- `src/screens/feed/TemplateDetailScreen.tsx` — static → reactive dimensions
- `src/screens/sketch/SketchScreen.tsx` — canvas max-width, responsive panels

---

## Task 1: Create `useDeviceType()` Hook

**Files:**
- Create: `src/hooks/useDeviceType.ts`

- [ ] **Step 1: Write the hook**

```typescript
import { useWindowDimensions } from 'react-native';

export type LayoutType = 'compact' | 'standard' | 'expanded';

export interface DeviceContext {
  width: number;
  height: number;
  shortestSide: number;
  isLandscape: boolean;
  isPhone: boolean;
  isTablet: boolean;
  layout: LayoutType;
  fontScale: number;
  horizontalPadding: number;
  cardGap: number;
  gridColumns: number;
  tabBarHeight: number;
  fabSize: number;
  iconSize: number;
  touchTarget: number;
}

const LAYOUT_CONFIG: Record<LayoutType, Omit<DeviceContext, 'width' | 'height' | 'shortestSide' | 'isLandscape' | 'isPhone' | 'isTablet' | 'layout'>> = {
  compact: {
    fontScale: 1.0,
    horizontalPadding: 16,
    cardGap: 12,
    gridColumns: 2,
    tabBarHeight: 56,
    fabSize: 48,
    iconSize: 18,
    touchTarget: 44,
  },
  standard: {
    fontScale: 1.15,
    horizontalPadding: 32,
    cardGap: 20,
    gridColumns: 3,
    tabBarHeight: 64,
    fabSize: 56,
    iconSize: 22,
    touchTarget: 48,
  },
  expanded: {
    fontScale: 1.25,
    horizontalPadding: 48,
    cardGap: 24,
    gridColumns: 4,
    tabBarHeight: 64,
    fabSize: 60,
    iconSize: 24,
    touchTarget: 48,
  },
};

function getLayout(shortestSide: number): LayoutType {
  if (shortestSide >= 900) return 'expanded';
  if (shortestSide >= 600) return 'standard';
  return 'compact';
}

export function useDeviceType(): DeviceContext {
  const { width, height } = useWindowDimensions();

  const shortestSide = Math.min(width, height);
  const isLandscape = width > height;
  const layout = getLayout(shortestSide);
  const base = LAYOUT_CONFIG[layout];

  return {
    width,
    height,
    shortestSide,
    isLandscape,
    isPhone: layout === 'compact',
    isTablet: layout !== 'compact',
    layout,
    ...base,
  };
}
```

- [ ] **Step 2: Export from hooks index**

Check if `src/hooks/index.ts` exists. If it does, add:
```typescript
export { useDeviceType } from './useDeviceType';
```
If not, no action needed (hooks are imported directly from files).

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useDeviceType.ts
git commit -m "feat(responsive): add useDeviceType hook for device classification"
```

---

## Task 2: Create `responsive.ts` Token File

**Files:**
- Create: `src/theme/responsive.ts`

- [ ] **Step 1: Write the token file**

```typescript
import type { LayoutType } from '../hooks/useDeviceType';

export interface ResponsiveTokens {
  fontScale: number;
  horizontalPadding: number;
  cardGap: number;
  gridColumns: number;
  tabBarHeight: number;
  fabSize: number;
  iconSize: number;
  touchTarget: number;
}

export const RESPONSIVE_TOKENS: Record<LayoutType, ResponsiveTokens> = {
  compact: {
    fontScale: 1.0,
    horizontalPadding: 16,
    cardGap: 12,
    gridColumns: 2,
    tabBarHeight: 56,
    fabSize: 48,
    iconSize: 18,
    touchTarget: 44,
  },
  standard: {
    fontScale: 1.15,
    horizontalPadding: 32,
    cardGap: 20,
    gridColumns: 3,
    tabBarHeight: 64,
    fabSize: 56,
    iconSize: 22,
    touchTarget: 48,
  },
  expanded: {
    fontScale: 1.25,
    horizontalPadding: 48,
    cardGap: 24,
    gridColumns: 4,
    tabBarHeight: 64,
    fabSize: 60,
    iconSize: 24,
    touchTarget: 48,
  },
};

export function getResponsiveTokens(layout: LayoutType): ResponsiveTokens {
  return RESPONSIVE_TOKENS[layout];
}
```

- [ ] **Step 2: Export from theme index**

Check `src/theme/index.ts`. If it exports everything from designSystem, add:
```typescript
export * from './responsive';
```

- [ ] **Step 3: Commit**

```bash
git add src/theme/responsive.ts
git commit -m "feat(responsive): add responsive token system for device-class scaling"
```

---

## Task 3: Add NativeWind Breakpoints to Tailwind Config

**Files:**
- Modify: `tailwind.config.js`

- [ ] **Step 1: Read current tailwind.config.js**

```bash
cat tailwind.config.js
```

- [ ] **Step 2: Add screens section**

Add `screens` to the theme, matching the three device classes:

```javascript
module.exports = {
  presets: [require('nativewind/preset')],
  theme: {
    screens: {
      'compact': { max: '599px' },
      'standard': { min: '600px', max: '899px' },
      'expanded': { min: '900px' },
    },
    extend: {
      // existing extend content preserved
    },
  },
};
```

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.js
git commit -m "feat(responsive): add device-class breakpoint screens to tailwind"
```

---

## Task 4: Make CustomTabBar Adaptive

**Files:**
- Modify: `src/navigation/CustomTabBar.tsx`

- [ ] **Step 1: Read current CustomTabBar.tsx**

```bash
cat src/navigation/CustomTabBar.tsx
```

Focus on these sections:
- TabItem component (lines 74-134) — `width: 44, height: 44` touch target
- FABButton component (lines 136-198) — `width: 48, height: 48`
- CustomTabBar root (lines 200-323) — pill container, bottom offset

- [ ] **Step 2: Add imports and device context**

Add to top imports:
```typescript
import { useDeviceType } from '../hooks/useDeviceType';
import { getResponsiveTokens } from '../theme/responsive';
```

- [ ] **Step 3: Update TabItem touch target**

In the TabItem component's `style` prop (around line 100), change:
```typescript
// Before
style={{
  width: 44,
  height: 44,
  ...
}}

// After — use device context
style={{
  width: device.touchTarget,
  height: device.touchTarget,
  ...
}}
```

- [ ] **Step 4: Update icon size in TabItem**

Inside the icon renderer rendering, icon size uses the `ICONS` constant at line 24-57. The icons already accept `strokeWidth` parameter. Update the icon color line (around 89) to also pass a scaled size via the device context:

The ICONS map at line 24 already accepts `(color, sw = 2.2)` — the `sw` controls strokeWidth, not icon size. Icon sizes are hardcoded in the SVG `width={18} height={18}`. Scale these: on tablet use `22`, on expanded use `24`.

Update the `ICONS` section or pass a size prop. The cleanest approach is to make ICONS accept a `size` parameter and use `device.iconSize`.

```typescript
const ICONS: Record<string, (color: string, size?: number) => React.ReactElement> = {
  Home: (color, size = 18) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      ...
    </Svg>
  ),
  // ... all icons, SVG width/height uses size parameter
```

- [ ] **Step 5: Update FAB size**

In FABButton (around line 176):
```typescript
// Before
style={{
  width: 48,
  height: 48,
  ...
}}

// After
style={{
  width: device.fabSize,
  height: device.fabSize,
  borderRadius: device.fabSize / 2,
  ...
}}
```

And update the CompassRose size inside the FAB (line 193):
```typescript
<CompassRose size={Math.round(device.fabSize * 0.58)} color={DS.colors.paper} />
```

Also update `marginTop: -28` (line 289) to `marginTop: -(device.fabSize / 2) - 4`.

- [ ] **Step 6: Update pill container width**

In the CustomTabBar root's pill style (around line 241-258):
```typescript
// After — add max width based on device
const pillMaxWidth = device.isTablet ? 420 : 280;

<View
  style={{
    ...
    maxWidth: pillMaxWidth,
    width: '100%',
  }}
>
```

Also update `paddingHorizontal: 8` to `paddingHorizontal: device.isTablet ? 12 : 8`.

- [ ] **Step 7: Update bottom offset**

At the root View's `style` (around line 229-239):
```typescript
bottom: device.isTablet
  ? Math.max(insets.bottom, 16) + 12
  : Math.max(insets.bottom, 12) + 8,
```

- [ ] **Step 8: Add device context hook at top of CustomTabBar**

In the `CustomTabBar` function body (after line 200), add:
```typescript
export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const device = useDeviceType();
  const tokens = getResponsiveTokens(device.layout);
  const { medium } = useHaptics();
  ...
```

- [ ] **Step 9: Commit**

```bash
git add src/navigation/CustomTabBar.tsx
git commit -m "feat(responsive): adapt CustomTabBar sizing and layout to device class"
```

---

## Task 5: Migrate Static Dimensions to useDeviceType (Hooks)

**Files:**
- Modify: `src/hooks/useSwipeToDismiss.ts`
- Modify: `src/hooks/useSwipeToBack.ts`

- [ ] **Step 1: Read useSwipeToDismiss.ts**

```bash
cat src/hooks/useSwipeToDismiss.ts
```

- [ ] **Step 2: Update useSwipeToDismiss.ts**

```typescript
// Before (around line 14):
const { height: SCREEN_H } = Dimensions.get('window');

// After:
const { height: SCREEN_H } = useWindowDimensions();
```

Also update the import:
```typescript
// Before:
import { Dimensions } from 'react-native';
// After:
import { useWindowDimensions } from 'react-native';
```

- [ ] **Step 3: Read useSwipeToBack.ts**

```bash
cat src/hooks/useSwipeToBack.ts
```

- [ ] **Step 4: Update useSwipeToBack.ts**

Same pattern — replace `Dimensions.get('window')` with `useWindowDimensions()`.

```typescript
// Before:
const { width: SCREEN_W } = Dimensions.get('window');

// After:
const { width: SCREEN_W } = useWindowDimensions();
```

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useSwipeToDismiss.ts src/hooks/useSwipeToBack.ts
git commit -m "refactor(responsive): use useWindowDimensions instead of static Dimensions.get"
```

---

## Task 6: Migrate Static Dimensions in SplashScreen and OnboardingScreen

**Files:**
- Modify: `src/screens/SplashScreen.tsx`
- Modify: `src/screens/onboarding/OnboardingScreen.tsx`

- [ ] **Step 1: Read SplashScreen.tsx (first 30 lines)**

```bash
head -30 src/screens/SplashScreen.tsx
```

- [ ] **Step 2: Update SplashScreen.tsx**

```typescript
// Before:
const { width: SW, height: SH } = Dimensions.get('window');

// After — inside the component, add hook:
const { width: SW, height: SH } = useWindowDimensions();
```

And update import:
```typescript
// Remove: import { Dimensions } from 'react-native';
// Add: import { useWindowDimensions } from 'react-native';
```

- [ ] **Step 3: Read OnboardingScreen.tsx (first 25 lines)**

```bash
head -25 src/screens/onboarding/OnboardingScreen.tsx
```

- [ ] **Step 4: Update OnboardingScreen.tsx**

```typescript
// Before:
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// After:
const { width: SCREEN_WIDTH } = useWindowDimensions();
```

And update import:
```typescript
// Remove: import { Dimensions } from 'react-native';
// Add: import { useWindowDimensions } from 'react-native';
```

- [ ] **Step 5: Commit**

```bash
git add src/screens/SplashScreen.tsx src/screens/onboarding/OnboardingScreen.tsx
git commit -m "refactor(responsive): migrate SplashScreen and OnboardingScreen to reactive dimensions"
```

---

## Task 7: Make DashboardScreen Responsive

**Files:**
- Modify: `src/screens/dashboard/DashboardScreen.tsx`

- [ ] **Step 1: Read DashboardScreen.tsx — find FlashList and card layout**

Look for:
- FlashList component usage (search for `FlashList`)
- How project cards are rendered
- Where horizontalPadding is used for card widths

- [ ] **Step 2: Add device context to DashboardScreen**

Add to imports:
```typescript
import { useDeviceType } from '../../hooks/useDeviceType';
```

Inside the component, add:
```typescript
const device = useDeviceType();
const tokens = getResponsiveTokens(device.layout);
```

- [ ] **Step 3: Make horizontal padding responsive**

Find `paddingHorizontal` in the root container and replace hardcoded `16` with `tokens.horizontalPadding`.

- [ ] **Step 4: Make card grid columns responsive (if FlashList supports numColumns prop)**

If DashboardScreen uses FlashList for projects (it does, around line 706), add `numColumns={device.gridColumns > 1 ? 2 : 1}` — since the projects list is a 1-column list on phone, the main tablet gain is wider cards not more columns.

For project cards: update card style `width` from hardcoded to `device.width - (tokens.horizontalPadding * 2)`.

- [ ] **Step 5: Commit**

```bash
git add src/screens/dashboard/DashboardScreen.tsx
git commit -m "feat(responsive): make DashboardScreen adaptive to device class"
```

---

## Task 8: Make FeedScreen Responsive (FlashList Columns)

**Files:**
- Modify: `src/screens/feed/FeedScreen.tsx`

- [ ] **Step 1: Read FeedScreen.tsx — find FlashList numColumns**

```bash
grep -n "numColumns\|FlashList" src/screens/feed/FeedScreen.tsx | head -20
```

- [ ] **Step 2: Add device context**

Add to imports:
```typescript
import { useDeviceType } from '../../hooks/useDeviceType';
```

Inside component:
```typescript
const device = useDeviceType();
```

- [ ] **Step 3: Make numColumns dynamic**

Find the FlashList component (around line 545):
```typescript
// Before:
<FlashList
  data={templates}
  numColumns={2}
  estimatedItemSize={230}
  ...
/>

// After:
<FlashList
  data={templates}
  numColumns={device.gridColumns}
  estimatedItemSize={device.layout === 'compact' ? 230 : 260}
  ...
/>
```

- [ ] **Step 4: Make horizontal padding responsive**

Find the container's `paddingHorizontal` and replace hardcoded `16` with `tokens.horizontalPadding`.

- [ ] **Step 5: Commit**

```bash
git add src/screens/feed/FeedScreen.tsx
git commit -m "feat(responsive): make FeedScreen grid columns adapt to device class"
```

---

## Task 9: Make TemplateDetailScreen and PurchaseTemplateScreen Responsive

**Files:**
- Modify: `src/screens/feed/TemplateDetailScreen.tsx`
- Modify: `src/screens/feed/PurchaseTemplateScreen.tsx`

- [ ] **Step 1: Update TemplateDetailScreen.tsx**

Add device context and replace:
```typescript
// Before:
const SCREEN_H = Dimensions.get('window').height;

// After:
const { height: SCREEN_H } = useWindowDimensions();
```

- [ ] **Step 2: Update PurchaseTemplateScreen.tsx**

Add device context and replace:
```typescript
// Before:
const SCREEN_W = Dimensions.get('window').width;

// After:
const { width: SCREEN_W } = useWindowDimensions();
```

- [ ] **Step 3: Commit**

```bash
git add src/screens/feed/TemplateDetailScreen.tsx src/screens/feed/PurchaseTemplateScreen.tsx
git commit -m "refactor(responsive): migrate template screens to reactive dimensions"
```

---

## Task 10: Make SketchScreen Responsive

**Files:**
- Modify: `src/screens/sketch/SketchScreen.tsx`

- [ ] **Step 1: Read SketchScreen.tsx — find canvas sizing**

```bash
grep -n "SCREEN_W\|SCREEN_H\|canvas\|CANVAS" src/screens/sketch/SketchScreen.tsx | head -20
```

- [ ] **Step 2: Add device context**

Add to imports:
```typescript
import { useDeviceType } from '../../hooks/useDeviceType';
```

Inside component:
```typescript
const device = useDeviceType();
const tokens = getResponsiveTokens(device.layout);
```

- [ ] **Step 3: Add canvas max-width**

Find where the canvas container or Skia canvas is rendered. Add `maxWidth: 1200` and center it:

```typescript
// In the canvas container style, add:
maxWidth: 1200,
alignSelf: 'center',
width: '100%',
```

- [ ] **Step 4: Make side panel width responsive**

Find the side panel / preset list container. Update its width:
```typescript
// Before — hardcoded width like 120 or '40%'
// After — tablet gets wider panel
const panelWidth = device.isTablet ? 320 : device.layout === 'expanded' ? 400 : 120;
```

- [ ] **Step 5: Make horizontal padding responsive**

Find `paddingHorizontal` throughout and replace with `tokens.horizontalPadding`.

- [ ] **Step 6: Commit**

```bash
git add src/screens/sketch/SketchScreen.tsx
git commit -m "feat(responsive): make SketchScreen canvas max-width and panels adaptive"
```

---

## Self-Review Checklist

- [ ] `useDeviceType()` returns all required fields: width, height, shortestSide, isLandscape, isPhone, isTablet, layout, fontScale, horizontalPadding, cardGap, gridColumns, tabBarHeight, fabSize, iconSize, touchTarget
- [ ] `responsive.ts` tokens match the hook values exactly (DRY — consider having hook import from responsive.ts if duplication is a concern, but both files can own their constants for now)
- [ ] All static `Dimensions.get('window')` calls replaced with `useWindowDimensions()`
- [ ] CustomTabBar adapts: touchTarget, iconSize, fabSize, pill maxWidth, horizontal padding, bottom offset
- [ ] FeedScreen `numColumns` uses `device.gridColumns`
- [ ] SketchScreen canvas has `maxWidth: 1200`
- [ ] All commits are atomic (one task per commit)

---

**Plan complete.** Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, reviewing between tasks for accuracy and speed.

**2. Inline Execution** — I execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?