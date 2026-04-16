/**
 * Prompt Sanitization Utilities
 *
 * These functions sanitize user input and blueprint context before
 * passing to AI services to prevent prompt injection attacks.
 */

// Maximum lengths for various fields
const MAX_ID_LENGTH = 100;
const MAX_NAME_LENGTH = 200;
const MAX_COORDINATE_LENGTH = 20;
const MAX_CONTEXT_LENGTH = 500;

// Regex patterns for safe identifiers (UUIDs, alphanumeric with limited special chars)
const SAFE_ID_PATTERN = /^[a-f0-9-]{36}$/i; // UUID pattern
const SAFE_NAME_PATTERN = /^[a-zA-Z0-9 _-]+$/;
const SAFE_COORDINATE_PATTERN = /^-?\d+(\.\d+)?$/;

/**
 * Sanitizes a blueprint context string to prevent prompt injection.
 * Removes potential instruction injection from user-accessible fields.
 */
export function sanitizeBlueprintContext(context: string): string {
  if (!context) return '';

  // Remove any potential instruction injection patterns
  const sanitized = context
    // Remove markdown/formatting that could inject instructions
    .replace(/```[\s\S]*?```/g, '') // code blocks
    .replace(/`[^`]+`/g, '') // inline code
    .replace(/^\s*(ignore|forget|disregard)[\s:]/gim, '') // "ignore previous instructions"
    .replace(/^\s*(you are now|pretend you are|act as)[\s:]/gim, '')
    .replace(/^\s*(system|prompt|injection)[\s:]/gim, '')
    // Remove JSON object notation that could be exploited
    .replace(/\{[^{}]*"\$\{/g, '')
    .replace(/\$\{[^}]+\}/g, '')
    // Remove unicode escapes that could hide instructions
    .replace(/\\u[0-9a-f]{4}/gi, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();

  return sanitized.slice(0, MAX_CONTEXT_LENGTH);
}

/**
 * Validates and sanitizes a wall ID for inclusion in AI context.
 */
export function sanitizeId(id: string): string | null {
  if (!id || typeof id !== 'string') return null;

  const trimmed = id.trim().slice(0, MAX_ID_LENGTH);

  // Accept UUIDs or simple alphanumeric IDs
  if (SAFE_ID_PATTERN.test(trimmed) || /^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Validates and sanitizes a room/furniture name.
 */
export function sanitizeName(name: string): string | null {
  if (!name || typeof name !== 'string') return null;

  const trimmed = name.trim().slice(0, MAX_NAME_LENGTH);

  if (SAFE_NAME_PATTERN.test(trimmed) && trimmed.length > 0) {
    return trimmed;
  }

  // If it contains dangerous characters, return null
  if (/[<>\"\'&]/.test(trimmed)) {
    return null;
  }

  return null;
}

/**
 * Validates a coordinate value to prevent injection of non-numeric data.
 */
export function sanitizeCoordinate(value: number | string, allowNegative = true): number | null {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    if (Math.abs(value) > 10000) return null; // Reasonable coordinate bounds
    return value;
  }

  if (typeof value !== 'string') return null;

  const trimmed = value.trim().slice(0, MAX_COORDINATE_LENGTH);

  if (!SAFE_COORDINATE_PATTERN.test(trimmed)) return null;

  const num = parseFloat(trimmed);
  if (!Number.isFinite(num)) return null;
  if (Math.abs(num) > 10000) return null;

  return num;
}

/**
 * Builds a safe selected-object context string for AI prompts.
 * Only includes validated IDs and safe descriptions.
 */
export function buildSelectedContext(params: {
  selectedId?: string | null;
  walls?: Array<{ id: string; texture?: string }>;
  rooms?: Array<{ id: string; name: string; area: number }>;
  furniture?: Array<{ id: string; name: string; category: string; position: { x: number; y: number; z: number } }>;
}): string {
  const { selectedId, walls = [], rooms = [], furniture = [] } = params;

  if (!selectedId) return '';

  const wall = walls.find((w) => sanitizeId(w.id) === selectedId);
  if (wall) {
    const texture = wall.texture ? sanitizeName(wall.texture) : 'plain';
    if (texture) {
      return `[Selected: wall texture=${texture}]`;
    }
  }

  const room = rooms.find((r) => sanitizeId(r.id) === selectedId);
  if (room) {
    const name = sanitizeName(room.name);
    const area = sanitizeCoordinate(room.area, false);
    if (name && area !== null) {
      return `[Selected: room "${name}" area=${area.toFixed(1)}m²]`;
    }
  }

  const piece = furniture.find((f) => sanitizeId(f.id) === selectedId);
  if (piece) {
    const name = sanitizeName(piece.name);
    const category = sanitizeName(piece.category);
    const x = sanitizeCoordinate(piece.position.x);
    const y = sanitizeCoordinate(piece.position.y);
    const z = sanitizeCoordinate(piece.position.z);

    if (name && category && x !== null && y !== null && z !== null) {
      return `[Selected: ${name} (${category}) at position (${x.toFixed(1)}, ${z.toFixed(1)})]`;
    }
  }

  return '';
}

/**
 * Sanitizes user prompt text before sending to AI.
 */
export function sanitizePrompt(prompt: string): string {
  if (!prompt || typeof prompt !== 'string') return '';

  const sanitized = prompt
    .trim()
    // Remove null bytes and other control characters
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Remove any HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove potential XSS vectors
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    // Normalize quotes
    .replace(/[""'']/g, '"')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();

  // Enforce maximum length (AI typically has limits anyway)
  return sanitized.slice(0, 2000);
}
