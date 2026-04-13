# ADR 001: Zustand for state management

Status: Accepted | Date: 2026-03-11

## Decision
Zustand for all state. No Redux, MobX, or Context for shared state.

## Rationale
Boilerplate-free, no provider wrapping, excellent RN performance.
blueprintStore as single source of truth is clean and testable.

## Consequences
All mutations go through store actions. Direct mutation prohibited.
