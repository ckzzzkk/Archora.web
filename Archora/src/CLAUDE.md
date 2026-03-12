# src/ — Source Context

Owner agents: all (see root CLAUDE.md for file ownership map)

## Directory Layout
```
src/
  components/
    common/       — shared UI atoms (Button, Input, Card, etc.)
    blueprint/    — 2D canvas + toolbar + prompt input
    3d/           — Three.js/R3F scene components + furniture
    social/       — feed, likes, ratings, comments
    dashboard/    — project cards
  hooks/          — all custom hooks (use*)
  navigation/     — React Navigation stacks + tab bar
  screens/        — one folder per feature area
  services/       — API client modules (*Service.ts)
  stores/         — Zustand stores (*Store.ts)
  theme/          — colors, spacing, typography tokens
  types/          — TypeScript types + module declarations
  utils/          — pure utility functions + procedural generators
  styles/         — global.css (NativeWind base)
```

## Rules
- NativeWind (Tailwind) ONLY — `StyleSheet.create` is BANNED
- Reanimated 3 for ALL animations — no `Animated` from React Native core
- CompassRoseLoader instead of ActivityIndicator, everywhere
- Hooks call services; screens call hooks; stores are updated only via actions
- No direct Supabase calls from components — always go through a service or hook
