/**
 * Generate a 6-character alphanumeric game code (base36)
 * Provides ~2 million combinations
 */
export function generateGameCode(): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Validate game code format (strict — does not normalize; use normalizeGameCode first if needed)
 */
export function isValidGameCode(code: string): boolean {
  if (!code) return false;
  return /^[0-9A-Z]{6}$/.test(code);
}

/**
 * Normalize game code to uppercase
 */
export function normalizeGameCode(code: string): string {
  return code.toUpperCase().trim();
}
