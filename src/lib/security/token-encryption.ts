import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

/**
 * Authenticated encryption (AES-256-GCM) for Google refresh tokens.
 * Uses GOOGLE_TOKEN_ENCRYPTION_KEY (preferred) or ENCRYPTION_KEY.
 */
function resolveKey(): Buffer {
  const raw =
    process.env.GOOGLE_TOKEN_ENCRYPTION_KEY ||
    process.env.ENCRYPTION_KEY ||
    '';
  if (!raw) {
    throw new Error('GOOGLE_TOKEN_ENCRYPTION_KEY (or ENCRYPTION_KEY) is required to store Google tokens.');
  }
  return createHash('sha256').update(raw).digest();
}

export function encryptSecret(plaintext: string): string {
  const key = resolveKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString('base64url')}:${tag.toString('base64url')}:${encrypted.toString('base64url')}`;
}

export function decryptSecret(payload: string): string {
  const key = resolveKey();
  const [version, ivB64, tagB64, dataB64] = payload.split(':');
  if (version !== 'v1' || !ivB64 || !tagB64 || !dataB64) {
    throw new Error('Invalid encrypted secret format.');
  }
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64url')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}
