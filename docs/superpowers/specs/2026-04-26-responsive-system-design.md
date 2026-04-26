# Full Responsive System — Phones + Tablets/iPads

## Context

ASORIA runs on iOS and Android across a wide range of devices: iPhone SE (375px) to iPad Pro 12.9" (1024px). The current UI is phone-optimized and doesn't adapt to tablets or landscape orientation. All layout decisions use static `Dimensions.get('window')` captured at module load — no reactivity, no classification.

## Design

### 1. Device Classification — `useDeviceType()` hook

A single hook replaces all static `Dimensions.get('window')` calls throughout the app.

```typescript
// src/hooks/useDeviceType.ts
// Returns reactive values that update on rotation and are memoized per device class

{
  width, height,                    // useWindowDimensions() — reactive
  shortestSide,                     // primary metric for tablet detection
  isLandscape: boolean,             // width > height
  isPhone: boolean,                 // shortestSide < 600
  isTablet: boolean,                 // shortestSide >= 600
  layout: 'compact' | 'standard' | 'expanded',
  fontScale: number,               // 1.0 / 1.15 / 1.25
  horizontalPadding: number,       // 16 / 32 / 48
  gridColumns: number,            // 2 / 3 / 4
  tabBarHeight: number,            // 56 / 64 / 64
  touchTarget: number,            // 44 / 48 / 48
}
```

**Thresholds:**
- `compact` — shortest side < 600px → iPhone, small Android
- `standard` — shortest side 600–899px → iPad, regular Android tablets
- `expanded` — shortest side >= 900px → iPad Pro 12.9", large Android tablets

**Reactive behavior:** Hook uses `useWindowDimensions()` so values update immediately on rotation. Device class is memoized — it only changes when crossing a threshold, not on every render.

### 2. Responsive Token System

New file `src/theme/responsive.ts`:

```typescript
export const RESPONSIVE = {
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

export function getResponsiveTokens(layout: LayoutType) {
  return RESPONSIVE[layout];
}
```

Usage:
```typescript
const device = useDeviceType();
const tokens = getResponsiveTokens(device.layout);
const scaledFont = 15 * tokens.fontScale;
```

### 3. Tailwind Breakpoint Configuration

`tailwind.config.js` — add `screens` section with device-class breakpoints:

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
      spacing: {
        'tab-bar-h': '56px',  // phone
        'tab-bar-h-tablet': '64px',
      },
    },
  },
};
```

This enables declarative responsive NativeWind classes:
```tsx
<View className="standard:flex-row expanded:flex-row-reverse" />
```

### 4. CustomTabBar — Adaptive Sizing

Changes to `src/navigation/CustomTabBar.tsx`:

| Property | Phone | Tablet |
|----------|-------|--------|
| Pill padding | 8px horizontal | 12px horizontal |
| Tab touch target | 44×44px | 48×48px |
| Icon size | 18px | 22px |
| FAB size | 48px | 56px |
| Pill max width | 280px | 420px |
| FAB marginTop | -28px | -32px |
| Bottom offset | `Math.max(insets.bottom, 12) + 8` | `Math.max(insets.bottom, 16) + 12` |

Pill width formula on tablet: `min(screenWidth - tokens.horizontalPadding * 2, maxWidth)` — always centered with breathing room.

```typescript
const device = useDeviceType();
const tokens = getResponsiveTokens(device.layout);

// In pill style:
const pillMaxWidth = device.isTablet ? 420 : 280;
```

### 5. Screen Layout Adaptations

**DashboardScreen:**
- Phone: single-column FlashList, card width = `screenWidth - 32`
- Tablet: 2-column grid, cards use `horizontalPadding` tokens

**FeedScreen (Inspo):**
- Phone: `numColumns={2}`
- Standard tablet: `numColumns={3}`
- Expanded tablet: `numColumns={4}`
- Dynamic via `device.gridColumns`

**GenerationScreen:**
- Phone: stacked portrait layout (step indicator above, content below)
- Tablet: side-by-side — step indicator on left (narrow column), content on right (wide column)
- Portrait vs landscape: in landscape tablet, generation preview panel can expand

**SketchScreen:**
- Canvas max-width: 1200px, centered on large tablets
- Side panel: full-width on phone, `width: 320` on tablet, `width: 400` on iPad Pro

**AccountScreen:**
- Phone: single-column card layout
- Tablet: 2-column card grid

### 6. Migration: Static → Reactive Dimensions

Replace all instances of:
```typescript
const SCREEN_W = Dimensions.get('window').width; // static snapshot
```

With:
```typescript
const device = useDeviceType();
const SCREEN_W = device.width; // reactive, updates on rotation
```

Files with static Dimensions:
- `src/hooks/useSwipeToDismiss.ts` — height
- `src/hooks/useSwipeToBack.ts` — width
- `src/screens/onboarding/OnboardingScreen.tsx` — width
- `src/screens/SplashScreen.tsx` — width, height
- `src/screens/feed/PurchaseTemplateScreen.tsx` — width
- `src/screens/feed/TemplateDetailScreen.tsx` — height
- `src/screens/feed/FeedScreen.tsx` — width
- `src/screens/sketch/SketchScreen.tsx` — width, height

## Files to Create
- `src/hooks/useDeviceType.ts` — device classification hook
- `src/theme/responsive.ts` — responsive token constants

## Files to Modify
- `tailwind.config.js` — add breakpoint screens
- `src/navigation/CustomTabBar.tsx` — adaptive sizing
- `src/screens/dashboard/DashboardScreen.tsx` — responsive grid
- `src/screens/feed/FeedScreen.tsx` — dynamic columns
- `src/screens/sketch/SketchScreen.tsx` — canvas max-width
- All files with static `Dimensions.get('window')` — migrate to useDeviceType()

## Success Criteria
- App looks correct on iPhone SE (375pt) through iPad Pro 12.9" (1024pt)
- Rotation is handled reactively — no layout jumps
- Tablet shows more content (more columns, wider cards) without simply scaling up
- Tab bar touch targets meet accessibility guidelines on all devices
- Font sizes scale appropriately — text remains readable on large tablets, not tiny