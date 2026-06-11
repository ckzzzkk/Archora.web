// Pure helpers for extracting the first complete JSON object from LLM output.
// Replaces the greedy `text.match(/\{[\s\S]*\}/)` pattern, which captures from
// the first `{` to the LAST `}` in the text — corrupting the payload whenever
// the model appends prose containing a brace after the JSON.
//
// CONSTRAINT: no imports, no Deno globals. This module is imported by the
// vitest suite (src/__tests__/edge/extractJson.test.ts) via relative path, so
// it must typecheck under the app tsconfig and run in Node.

/**
 * Returns the first balanced, valid top-level JSON object in `text`
 * (e.g. inside markdown fences or surrounded by prose), or null if none.
 */
export function extractFirstJson(text: string): string | null {
  for (let start = text.indexOf('{'); start !== -1; start = text.indexOf('{', start + 1)) {
    const candidate = scanBalancedObject(text, start);
    if (candidate !== null) {
      try {
        JSON.parse(candidate);
        return candidate;
      } catch {
        // Balanced braces but not valid JSON (e.g. braces in prose) — keep scanning.
      }
    }
  }
  return null;
}

/** Walks from an opening `{`, respecting string/escape state, to its matching `}`. */
function scanBalancedObject(text: string, start: number): string | null {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null; // unbalanced — input truncated mid-object
}

/**
 * Parses `text` as JSON directly, falling back to the first embedded JSON
 * object. Returns null when no valid JSON can be recovered (callers decide
 * whether that's a throw, a retry, or a fallback result).
 */
export function parseFirstJson<T = unknown>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    const extracted = extractFirstJson(text);
    if (extracted === null) return null;
    return JSON.parse(extracted) as T;
  }
}
