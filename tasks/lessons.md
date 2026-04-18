# Lessons Learned

## Rules
Max 50 lines. Archive entries >4 weeks old to docs/archive/.

## Lessons

### 2026-04-18 — Polish Session Takeaways
**Session:** 6 parallel agents, ~17 min wall clock, 33 files changed
1. **Parallel agents need truly independent domains** — no conflicts when domains don't overlap
2. **Research before implement** is critical — agents studied competitor apps first, produced better work
3. **DS token propagation was the biggest win** — one source of truth for radius/shadows = automatic consistency
4. **Accessibility was most thorough** — 16 files with systematic WCAG compliance including roles/labels/hints
5. **Deadline gave agents space to iterate** — thoroughness over speed in final polish

### 2026-04-18 — Build Verification
- TypeScript: `npx tsc --noEmit` passes with 0 errors
- Android release APK builds successfully (164MB at `android/app/build/outputs/apk/release/app-release.apk`)
- Both previously noted issues (accessibilityDestructiveHint, EmptyState icon prop) are already fixed/not present
