/** Domains allowed for Zeffy iframe embeds (safe for client + server). */
export const ZEFFY_EMBED_ALLOWLIST = [
  'https://www.zeffy.com',
  'https://zeffy.com',
  'https://www.zeffy.ca',
  'https://zeffy.ca',
] as const;

export function isAllowedZeffyEmbedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ZEFFY_EMBED_ALLOWLIST.some((origin) => parsed.origin === new URL(origin).origin);
  } catch {
    return false;
  }
}
