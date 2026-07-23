import crypto from 'crypto';

const GCM_ALGORITHM = 'aes-256-gcm';
const LEGACY_ALGORITHM = 'aes256';
const INPUT_ENCODING = 'utf8';
const OUTPUT_ENCODING = 'hex';
const IV_LENGTH = 16;

// Derive 32-byte key using SHA-256 so AUTH_SECRET length is flexible.

function deriveKey(key: string): Buffer {
  return crypto.createHash('sha256').update(key).digest();
}

// Output format: v2:<ivHex>:<authTagHex>:<cipherHex>

export function symmetricEncrypt(text: string, key: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(GCM_ALGORITHM, deriveKey(key), iv);
  const encrypted = Buffer.concat([
    cipher.update(text, INPUT_ENCODING),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();

  return `v2:${iv.toString(OUTPUT_ENCODING)}:${authTag.toString(OUTPUT_ENCODING)}:${encrypted.toString(OUTPUT_ENCODING)}`;
}

// Decrypt AES-256-GCM (`v2:iv:tag:cipher`) or legacy AES-256-CBC (`iv:cipher`).

export function symmetricDecrypt(text: string, key: string): string {
  if (text.startsWith('v2:')) {
    const [, ivHex, tagHex, cipherHex] = text.split(':');
    if (!ivHex || !tagHex || !cipherHex) {
      throw new Error('Invalid AES-GCM ciphertext envelope.');
    }
    const decipher = crypto.createDecipheriv(
      GCM_ALGORITHM,
      deriveKey(key),
      Buffer.from(ivHex, OUTPUT_ENCODING)
    );
    decipher.setAuthTag(Buffer.from(tagHex, OUTPUT_ENCODING));
    return (
      decipher.update(cipherHex, OUTPUT_ENCODING, INPUT_ENCODING) +
      decipher.final(INPUT_ENCODING)
    );
  }

  // Legacy AES-256-CBC: iv:ciphertext

  const components = text.split(':');
  const iv = Buffer.from(components.shift() || '', OUTPUT_ENCODING);
  const decipher = crypto.createDecipheriv(
    LEGACY_ALGORITHM,
    deriveKey(key),
    iv
  );
  return (
    decipher.update(components.join(':'), OUTPUT_ENCODING, INPUT_ENCODING) +
    decipher.final(INPUT_ENCODING)
  );
}

export function isEncryptedEnvelope(value: string): boolean {
  if (value.startsWith('v2:')) {
    return value.split(':').length === 4;
  }
  const parts = value.split(':');
  return parts.length === 2 && /^[0-9a-f]+$/i.test(parts[0] ?? '');
}
