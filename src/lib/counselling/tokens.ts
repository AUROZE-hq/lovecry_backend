import { createHash, randomBytes, timingSafeEqual } from 'crypto';

export function hashToken(raw: string, secret = process.env.TOKEN_HASH_SECRET || 'lovecry-dev-token'): string {
  return createHash('sha256').update(`${secret}:${raw}`).digest('hex');
}

export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export function tokensMatch(raw: string, hash: string): boolean {
  const a = Buffer.from(hashToken(raw));
  const b = Buffer.from(hash);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function sha256(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

export function nextAppointmentReference(seq: number, year = new Date().getFullYear()): string {
  return `LC-APT-${year}-${String(seq).padStart(6, '0')}`;
}
