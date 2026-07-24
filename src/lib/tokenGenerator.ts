/**
 * Secure token generation utilities
 * Tokens are used for API authentication and user sessions
 */

/**
 * Generate a cryptographically secure random token
 * Uses crypto.randomUUID() for better randomness than Math.random()
 * Format: UUID v4 (36 characters including hyphens)
 */
export function generateSecureToken(): string {
  if (typeof window !== 'undefined' && window.crypto) {
    // Browser environment
    return crypto.randomUUID();
  } else if (typeof global !== 'undefined') {
    // Node.js environment - use the crypto module
    const { randomUUID } = require('crypto');
    return randomUUID();
  } else {
    // Fallback: should not happen in practice
    throw new Error('No crypto API available for token generation');
  }
}

/**
 * Generate a token hash for storage in database
 * Never store plain tokens in the database; always store hashes
 * Uses SHA-256 for cryptographic strength
 */
export async function hashToken(token: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    // Browser SubtleCrypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } else if (typeof global !== 'undefined') {
    // Node.js environment
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(token).digest('hex');
  } else {
    throw new Error('No crypto API available for token hashing');
  }
}

/**
 * Token TTL (Time To Live) configuration in milliseconds
 * 24 hours = 86,400,000 ms
 */
export const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Check if a token has expired
 * @param createdAtTimestamp - Firestore Timestamp when token was created
 * @returns true if token is expired, false otherwise
 */
export function isTokenExpired(createdAtTimestamp: any): boolean {
  if (!createdAtTimestamp || !createdAtTimestamp.toMillis) {
    return true;
  }
  const now = Date.now();
  const createdMs = createdAtTimestamp.toMillis();
  return (now - createdMs) > TOKEN_TTL_MS;
}

/**
 * Generate a token with metadata
 * Returns both the plain token (for immediate use) and hash (for storage)
 */
export async function generateTokenPair(): Promise<{
  token: string;
  hash: string;
}> {
  const token = generateSecureToken();
  const hash = await hashToken(token);
  return { token, hash };
}
