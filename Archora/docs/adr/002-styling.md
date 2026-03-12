# ADR 002: NativeWind for all styling

Status: Accepted | Date: 2026-03-11

## Decision
NativeWind (Tailwind for RN) only. StyleSheet.create is banned.

## Rationale
Consistent utility-class approach, theme tokens in tailwind.config.js, dark theme by default.

## Consequences
All components use className props. Dynamic styles use Reanimated inline styles only.
