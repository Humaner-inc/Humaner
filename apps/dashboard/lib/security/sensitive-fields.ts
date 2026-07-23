import 'server-only';

import {
  isEncryptedEnvelope,
  symmetricDecrypt,
  symmetricEncrypt
} from '@/lib/auth/encryption';

function requireAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is required to encrypt sensitive fields.');
  }
  return secret;
}

// Encrypt a secret for DB storage. No-op for empty/null.

export function encryptSensitiveField(
  value: string | null | undefined
): string | null {
  if (!value) {
    return null;
  }
  return symmetricEncrypt(value, requireAuthSecret());
}

//Decrypt a stored field. Falls back to plaintext for legacy rows that were written before encryption was enabled.

export function decryptSensitiveField(
  value: string | null | undefined
): string | null {
  if (!value) {
    return null;
  }
  if (isEncryptedEnvelope(value)) {
    return symmetricDecrypt(value, requireAuthSecret());
  }
  // Legacy plaintext (webhook secrets / OAuth tokens pre-encryption).
  return value;
}
