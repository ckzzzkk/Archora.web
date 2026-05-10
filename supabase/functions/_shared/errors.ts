export type ErrorCode =
  | 'AUTH_REQUIRED'
  | 'AUTH_INVALID'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'QUOTA_EXCEEDED'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'UPSTREAM_ERROR'
  | 'INVALID_TIER';

export interface AppError {
  error: string;
  code: ErrorCode;
  details?: unknown;
}

export function errorResponse(
  code: ErrorCode,
  message: string,
  status: number,
  details?: unknown,
): Response {
  const body: AppError = { error: message, code, ...(details !== undefined ? { details } : {}) };
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const Errors = {
  unauthorized: (msg = 'Unauthorized') => errorResponse('AUTH_REQUIRED', msg, 401),
  invalidToken: (msg = 'Invalid or expired token') => errorResponse('AUTH_INVALID', msg, 401),
  forbidden: (msg = 'Forbidden') => errorResponse('FORBIDDEN', msg, 403),
  notFound: (msg = 'Resource not found') => errorResponse('NOT_FOUND', msg, 404),
  validation: (msg: string, details?: unknown) => errorResponse('VALIDATION_ERROR', msg, 422, details),
  quotaExceeded: (msg = 'Monthly quota exceeded') => errorResponse('QUOTA_EXCEEDED', msg, 429),
  rateLimited: (msg = 'Too many requests') => errorResponse('RATE_LIMITED', msg, 429),
  internal: (msg = 'Internal server error') => errorResponse('INTERNAL_ERROR', msg, 500),
  upstream: (msg: string) => errorResponse('UPSTREAM_ERROR', msg, 502),
} as const;

/**
 * Returns the value of a required environment variable.
 * Throws a 500 Response if the variable is not set — fail fast rather than
 * allowing a downstream NullPointerException on a misconfigured deployment.
 */
export function requireEnv(key: string): string {
  const value = Deno.env.get(key);
  if (value === undefined) {
    throw Errors.internal(`Required environment variable '${key}' is not configured`);
  }
  return value;
}
