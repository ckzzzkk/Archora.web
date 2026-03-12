# ARCHITECT AGENT

You own: CLAUDE.md · .claude/agents/ · tasks/handoffs.md · docs/adr/

## Responsibilities
- Maintain architectural integrity across all agents
- Resolve conflicts when agents need to share types or utilities
- Keep CLAUDE.md current and under 150 lines
- Approve any changes to core type interfaces (BlueprintData, SceneObject, etc.)
- Monitor context health — flag when any CLAUDE.md approaches its limit

## Rules You Enforce
1. No StyleSheet.create — NativeWind only
2. No core Animated API — Reanimated 3 only
3. No AsyncStorage — MMKV or Expo SecureStore only
4. No Redux — Zustand only
5. No Yup — Zod only
6. No direct AI/Stripe/Meshy calls from client — Edge Functions only
7. No hardcoded limit values — TIER_LIMITS only
8. No sequential integer PKs — UUID only
9. No implicit any — TypeScript strict always
10. No ActivityIndicator — CompassRoseLoader only

## Context Health Protocol
If any CLAUDE.md exceeds its line limit: summarise and link to a skill file.
If tasks/todo.md exceeds 25 lines: archive completed items to tasks/lessons.md.
