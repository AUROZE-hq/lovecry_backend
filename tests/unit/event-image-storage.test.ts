import { describe, expect, it } from 'vitest';
import { MAX_EVENT_IMAGE_BYTES, validateEventImageFile } from '@/lib/events/image-storage';

function fileFromBytes(bytes: Uint8Array, type: string, name = 'image.bin') {
  return new File([bytes], name, { type });
}

function jpegBytes(size = 32) {
  const bytes = new Uint8Array(size);
  bytes[0] = 0xff;
  bytes[1] = 0xd8;
  bytes[2] = 0xff;
  return bytes;
}

describe('event image storage validation', () => {
  it('accepts a real JPEG payload and maps it to .jpg', async () => {
    const result = await validateEventImageFile(fileFromBytes(jpegBytes(), 'image/jpeg', 'photo.jpeg'));
    expect(result.ext).toBe('.jpg');
  });

  it('rejects empty files', async () => {
    await expect(validateEventImageFile(fileFromBytes(new Uint8Array(), 'image/jpeg'))).rejects.toThrow(
      'Image file is empty.'
    );
  });

  it('rejects files larger than 8 MB', async () => {
    const tooBig = fileFromBytes(jpegBytes(MAX_EVENT_IMAGE_BYTES + 1), 'image/jpeg');
    await expect(validateEventImageFile(tooBig)).rejects.toMatchObject({
      message: 'Image must be 8 MB or smaller.',
    });
  });

  it('rejects SVG, GIF, PDF, and unknown types', async () => {
    await expect(
      validateEventImageFile(fileFromBytes(new TextEncoder().encode('<svg></svg>'), 'image/svg+xml', 'x.svg'))
    ).rejects.toMatchObject({ message: 'Only JPG, PNG, WebP, and AVIF images are allowed.' });
    await expect(
      validateEventImageFile(fileFromBytes(new Uint8Array([0x47, 0x49, 0x46]), 'image/gif', 'x.gif'))
    ).rejects.toMatchObject({ message: 'Only JPG, PNG, WebP, and AVIF images are allowed.' });
    await expect(
      validateEventImageFile(fileFromBytes(new TextEncoder().encode('%PDF-1.4'), 'application/pdf', 'x.pdf'))
    ).rejects.toMatchObject({ message: 'Only JPG, PNG, WebP, and AVIF images are allowed.' });
  });

  it('rejects a non-image file claiming to be JPEG', async () => {
    await expect(
      validateEventImageFile(fileFromBytes(new TextEncoder().encode('not-an-image'), 'image/jpeg', 'x.jpg'))
    ).rejects.toMatchObject({ message: 'File is not a valid image.' });
  });
});
