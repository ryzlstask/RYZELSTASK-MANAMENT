import { cookies } from 'next/headers';
import crypto from 'crypto';

export const AUTH_COOKIE_NAME = 'ryzels_auth_session';

// Required Admin Credentials
export const VALID_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
  name: 'Talha Khan',
  role: 'Task Manager / Head of Operations'
};

const SECRET_KEY = process.env.AUTH_SECRET || 'ryzels_ops_ai_secret_key_2026_super_secure';

/**
 * Generate a tamper-proof session token for the user
 */
export function createSessionToken(username: string): string {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const payload = `${username}:${expiresAt}`;
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('hex');
  return Buffer.from(`${payload}:${signature}`).toString('base64');
}

/**
 * Verify session token validity and expiration
 */
export function verifySessionToken(token: string | undefined | null): { valid: boolean; username?: string } {
  if (!token) return { valid: false };

  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 3) return { valid: false };

    const [username, expiresAtStr, signature] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);

    if (Date.now() > expiresAt) {
      return { valid: false };
    }

    const payload = `${username}:${expiresAtStr}`;
    const expectedSig = crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('hex');

    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return { valid: true, username };
    }
  } catch {
    return { valid: false };
  }

  return { valid: false };
}
