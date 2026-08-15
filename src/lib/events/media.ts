/**
 * Event images are stored as URLs selected by admins:
 * - site-relative paths such as `/event (1).jpg` (files already in /public)
 * - https:// URLs to durable hosts the organization already uses
 *
 * There is no Cloudinary, S3, or UploadThing provider in this project.
 * Do not write production uploads to the Next.js server filesystem.
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
