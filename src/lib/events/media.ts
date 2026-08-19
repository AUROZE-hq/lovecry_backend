/**
 * Event images are stored as URLs:
 * - site-relative paths such as `/uploads/events/{id}.webp` (admin-uploaded files in /public)
 * - existing public files such as `/event (1).jpg`
 * - https:// URLs to durable hosts the organization already uses
 *
 * Admin uploads are handled by `/api/admin/events/upload` and currently written
 * to `/public/uploads/events`. The database stores only the public URL so a later
 * file-server/cloud storage swap does not require a schema change.
 */

export function isAllowedImageUrl(url: string): boolean {
  const value = url.trim();
  if (!value) return false;
  if (value.startsWith('/') && !value.startsWith('//')) {
    return !value.includes('..') && value.length <= 2000;
  }
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && parsed.hostname.length > 0 && value.length <= 2000;
  } catch {
    return false;
  }
}

export function isAllowedPublicUrl(url: string): boolean {
  const value = url.trim();
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') && parsed.hostname.length > 0;
  } catch {
    return false;
  }
}

export type EventMediaInput = {
  url: string;
  altText?: string | null;
  sortOrder?: number;
};
