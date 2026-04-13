# ADR 003: Reanimated 3 for all animations

Status: Accepted | Date: 2026-03-11

## Decision
Reanimated 3 for every animation. Core Animated API is banned.

## Rationale
UI-thread animations at 60fps even under heavy JS load.
The scratchy SVG animation and app-wide theme recolour require this.

## Consequences
All animations use useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat.
