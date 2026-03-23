export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('At least one number');
  return { valid: errors.length === 0, errors };
}

/** Strips HTML tags and trims whitespace. */
export function sanitiseText(text: string): string {
  return text.replace(/<[^>]*>/g, '').trim();
}

/** Sanitises and truncates to 500 characters. */
export function validatePrompt(prompt: string): string {
  return sanitiseText(prompt).slice(0, 500);
}

/** Letters, numbers, spaces, hyphens only — max 50 chars. */
export function validateDisplayName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= 50 && /^[a-zA-Z0-9 -]+$/.test(trimmed);
}

export function validatePrice(price: number): boolean {
  return Number.isFinite(price) && price >= 0 && price <= 999.99;
}
