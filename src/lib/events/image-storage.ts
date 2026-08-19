import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

export const MAX_EVENT_IMAGE_BYTES = 8 * 1024 * 1024;

const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
} as const;

type AllowedMime = keyof typeof MIME_TO_EXT;

export class EventImageStorageError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function isAllowedMime(value: string): value is AllowedMime {
  return value in MIME_TO_EXT;
}

function matchesMagicBytes(bytes: Uint8Array, mime: AllowedMime): boolean {
  if (mime === 'image/jpeg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mime === 'image/png') {
    return (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }
  if (mime === 'image/webp') {
    if (bytes.length < 12) return false;
    const header = Buffer.from(bytes.subarray(0, 12)).toString('ascii');
    return header.startsWith('RIFF') && header.slice(8, 12) === 'WEBP';
  }
  const box = Buffer.from(bytes.subarray(0, 32)).toString('ascii');
  return box.includes('ftyp') && (box.includes('avif') || box.includes('avis') || box.includes('mif1'));
}

export async function validateEventImageFile(file: File): Promise<{ ext: string; bytes: Buffer }> {
  if (!file || typeof file.size !== 'number') {
    throw new EventImageStorageError('No image file was provided.', 400);
  }
  if (file.size <= 0) {
    throw new EventImageStorageError('Image file is empty.', 400);
  }
  if (file.size > MAX_EVENT_IMAGE_BYTES) {
    throw new EventImageStorageError('Image must be 8 MB or smaller.', 400);
  }
  const mime = (file.type || '').toLowerCase();
  if (!isAllowedMime(mime)) {
    throw new EventImageStorageError('Only JPG, PNG, WebP, and AVIF images are allowed.', 400);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!matchesMagicBytes(bytes, mime)) {
    throw new EventImageStorageError('File is not a valid image.', 400);
  }

  return { ext: MIME_TO_EXT[mime], bytes };
}

export async function saveEventImage(file: File): Promise<{ url: string; filename: string }> {
  const { ext, bytes } = await validateEventImageFile(file);
  const filename = `${randomUUID()}${ext}`;
  const directory = path.join(process.cwd(), 'public', 'uploads', 'events');
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), bytes);
  return {
    filename,
    url: `/uploads/events/${filename}`,
  };
}
