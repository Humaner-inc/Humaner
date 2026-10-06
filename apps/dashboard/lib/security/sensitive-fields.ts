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

function decryptionSecrets(): string[] {
  const current = requireAuthSecret();
  const previous = process.env.AUTH_SECRET_PREVIOUS?.trim();
  return previous ? [current, previous] : [current];
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

export function decryptSensitiveField(
  value: string | null | undefined
): string | null {
  if (!value) {
    return null;
  }
  if (!isEncryptedEnvelope(value)) {
    return value;
  }

  let lastError: unknown;
  for (const secret of decryptionSecrets()) {
    try {
      return symmetricDecrypt(value, secret);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error('Unable to decrypt sensitive field.');
}

// true when the row is plaintext or still sealed with AUTH_SECRET_PREVIOUS
export function sensitiveFieldNeedsRewrite(
  value: string | null | undefined
): boolean {
  if (!value) {
    return false;
  }
  if (!isEncryptedEnvelope(value)) {
    return true;
  }
  try {
    symmetricDecrypt(value, requireAuthSecret());
    return false;
  } catch {
    return true;
  }
}
