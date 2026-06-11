import { describe, it, expect } from 'vitest';
import { extractFirstJson, parseFirstJson } from '../../../supabase/functions/_shared/extractJson';

describe('extractFirstJson', () => {
  it('returns plain JSON object unchanged', () => {
    expect(extractFirstJson('{"a":1}')).toBe('{"a":1}');
  });

  it('extracts from markdown fences', () => {
    const text = '```json\n{"rooms":[{"id":"r1"}]}\n```';
    expect(extractFirstJson(text)).toBe('{"rooms":[{"id":"r1"}]}');
  });

  it('ignores trailing prose containing a closing brace (greedy-regex regression)', () => {
    const text = '{"a":1}\n\nNote: the config block {like this} explains the result.';
    expect(extractFirstJson(text)).toBe('{"a":1}');
  });

  it('handles braces inside string values', () => {
    const text = 'prefix {"note":"use {x} and {y}","n":2} suffix';
    expect(extractFirstJson(text)).toBe('{"note":"use {x} and {y}","n":2}');
  });

  it('handles escaped quotes inside strings', () => {
    const text = '{"quote":"she said \\"hi\\" {ok}"} trailing }';
    expect(extractFirstJson(text)).toBe('{"quote":"she said \\"hi\\" {ok}"}');
  });

  it('handles nested objects and arrays', () => {
    const obj = '{"floors":[{"walls":[{"start":{"x":0,"y":0}}]}],"meta":{"k":1}}';
    expect(extractFirstJson(`Here you go:\n${obj}\nDone.`)).toBe(obj);
  });

  it('returns the first object when multiple are present', () => {
    expect(extractFirstJson('{"first":true} and then {"second":true}')).toBe('{"first":true}');
  });

  it('skips brace-noise prose before the real JSON', () => {
    const text = 'set {x} first, then: {"valid":1}';
    expect(extractFirstJson(text)).toBe('{"valid":1}');
  });

  it('returns null for truncated JSON (max_tokens cutoff)', () => {
    expect(extractFirstJson('{"walls":[{"id":"w1","start":{"x":0')).toBeNull();
  });

  it('returns null when there is no JSON at all', () => {
    expect(extractFirstJson('Sorry, I cannot generate that floor plan.')).toBeNull();
  });

  it('returns null for empty input', () => {
    expect(extractFirstJson('')).toBeNull();
  });
});

describe('parseFirstJson', () => {
  it('parses direct JSON (fast path)', () => {
    expect(parseFirstJson<{ a: number }>('{"a":1}')).toEqual({ a: 1 });
  });

  it('parses a top-level array via the fast path', () => {
    expect(parseFirstJson<number[]>('[1,2,3]')).toEqual([1, 2, 3]);
  });

  it('parses embedded JSON with surrounding prose', () => {
    expect(parseFirstJson('result: {"ok":true} — enjoy!')).toEqual({ ok: true });
  });

  it('returns null when nothing parses', () => {
    expect(parseFirstJson('no json here')).toBeNull();
    expect(parseFirstJson('{"truncated": ')).toBeNull();
  });
});
