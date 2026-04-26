/**
 * Shared error type used across all client services and edge functions.
 * Provides a consistent shape for API errors so callers can handle them
 * uniformly without needing to know which service threw them.
 */
export interface AppError {
  code: string;
  message: string;
  status?: number;
  details?: unknown;
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof Error && 'code' in err && typeof (err as AppError).code === 'string';
}

export function toAppError(err: unknown, fallbackCode = 'UNKNOWN'): AppError {
  if (isAppError(err)) return err;
  if (err instanceof Error) {
    return { code: fallbackCode, message: err.message };
  }
  return { code: fallbackCode, message: String(err) };
}