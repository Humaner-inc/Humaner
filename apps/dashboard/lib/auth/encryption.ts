import crypto from 'crypto';

const ALGORITHM = 'aes256';
const INPUT_ENCODING = 'utf8';
const OUTPUT_ENCODING = 'hex';
const IV_LENGTH = 16;

// Derive a 32-byte key using SHA-256 to ensure it's the correct length
function deriveKey(key: string): Buffer {
  return crypto.createHash('sha256').update(key).digest();
}

export function symmetricEncrypt(text: string, key: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, deriveKey(key), iv);
  let ciphered = cipher.update(text, INPUT_ENCODING, OUTPUT_ENCODING);
  ciphered += cipher.final(OUTPUT_ENCODING);
  const ciphertext = `${iv.toString(OUTPUT_ENCODING)}:${ciphered}`;

  return ciphertext;
}

export function symmetricDecrypt(text: string, key: string): string {
  const components = text.split(':');
  const iv_from_ciphertext = Buffer.from(
    components.shift() || '',
    OUTPUT_ENCODING
  );
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    deriveKey(key),
    iv_from_ciphertext
  );
  let deciphered = decipher.update(
    components.join(':'),
    OUTPUT_ENCODING,
    INPUT_ENCODING
  );
  deciphered += decipher.final(INPUT_ENCODING);

  return deciphered;
}
