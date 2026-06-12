/**
 * history.ts — bounded snapshot undo/redo stack for the sketch canvas.
 * Generic and pure; snapshots are stored by reference, so callers must pass
 * immutable states (the sketch's walls array is replaced, never mutated).
 */

export interface History<T> {
  /** Record a new state. Truncates any redo branch. */
  push(state: T): void;
  /** Step back; returns the previous state or null at the oldest. */
  undo(): T | null;
  /** Step forward; returns the next state or null at the newest. */
  redo(): T | null;
  canUndo(): boolean;
  canRedo(): boolean;
  /** Number of retained states (capped at the limit). */
  size(): number;
}

export function createHistory<T>(initial: T, limit = 50): History<T> {
  let stack: T[] = [initial];
  let index = 0;

  return {
    push(state: T): void {
      stack = stack.slice(0, index + 1);
      stack.push(state);
      if (stack.length > limit) stack = stack.slice(stack.length - limit);
      index = stack.length - 1;
    },
    undo(): T | null {
      if (index <= 0) return null;
      index -= 1;
      return stack[index];
    },
    redo(): T | null {
      if (index >= stack.length - 1) return null;
      index += 1;
      return stack[index];
    },
    canUndo(): boolean {
      return index > 0;
    },
    canRedo(): boolean {
      return index < stack.length - 1;
    },
    size(): number {
      return stack.length;
    },
  };
}
