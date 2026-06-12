import { describe, it, expect } from 'vitest';
import { createHistory } from '../../utils/sketch/history';

describe('createHistory', () => {
  it('push/undo/redo round-trip', () => {
    const h = createHistory<number[]>([]);
    h.push([1]);
    h.push([1, 2]);

    expect(h.undo()).toEqual([1]);
    expect(h.undo()).toEqual([]);
    expect(h.undo()).toBeNull(); // bottomed out
    expect(h.redo()).toEqual([1]);
    expect(h.redo()).toEqual([1, 2]);
    expect(h.redo()).toBeNull(); // topped out
  });

  it('a push after undo truncates the redo branch', () => {
    const h = createHistory<string>('a');
    h.push('b');
    h.push('c');
    h.undo(); // back at 'b'
    h.push('d');

    expect(h.canRedo()).toBe(false);
    expect(h.undo()).toBe('b');
    expect(h.redo()).toBe('d');
  });

  it('caps the stack at the limit, dropping the oldest', () => {
    const h = createHistory<number>(0, 5);
    for (let i = 1; i <= 10; i++) h.push(i);
    expect(h.size()).toBe(5);
    // Walk back to the oldest retained state.
    let last: number | null = null;
    let prev: number | null;
    while ((prev = h.undo()) !== null) last = prev;
    expect(last).toBe(6); // 6,7,8,9,10 retained
  });

  it('canUndo/canRedo reflect position', () => {
    const h = createHistory<number>(0);
    expect(h.canUndo()).toBe(false);
    expect(h.canRedo()).toBe(false);
    h.push(1);
    expect(h.canUndo()).toBe(true);
    h.undo();
    expect(h.canUndo()).toBe(false);
    expect(h.canRedo()).toBe(true);
  });
});
