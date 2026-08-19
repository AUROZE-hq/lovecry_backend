import { z } from 'zod';
import { isAllowedImageUrl } from '@/lib/events/media';
import { isValidSlug } from '@/lib/events/slug';
import { MARKETPLACE_SIZE_OPTIONS } from './types';

const emptyToUndef = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const optionalText = z.preprocess(emptyToUndef, z.string().trim().max(120).optional());
const optionalLongText = z.preprocess(emptyToUndef, z.string().trim().max(20_000).optional());

export function parsePriceToCents(value: unknown): number | null {
  if (value == null || value === '') return null;
  const raw = String(value).trim().replace(/[$,\s]/g, '');
  if (!raw) return null;
  const amount = Number(raw);
  if (!Number.isFinite(amount)) return Number.NaN;
  return Math.round(amount * 100);
}

export function centsToPriceInput(cents: number | null | undefined): string {
  if (cents == null) return '';
  return (cents / 100).toFixed(2);
}

const imageUrlSchema = z
  .string()
  .trim()
  .min(1, 'Image path is required')
  .max(2000)
  .refine(isAllowedImageUrl, 'Image must be a site path starting with / or an https:// URL');

export const marketplaceProductWriteSchema = z.object({
  name: z.string().trim().min(2, 'Product name is required').max(120),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug is required')
    .max(80)
    .refine(isValidSlug, 'Slug may only contain lowercase letters, numbers, and hyphens'),
  subtitle: optionalText,
  description: z.string().trim().min(10, 'Description is required').max(20_000),
  category: optionalText,
  badge: optionalText,
  currency: z.string().trim().min(3).max(8).default('CAD'),
  priceCents: z
    .number()
    .int('Price must be a whole number of cents')
    .min(0, 'Price cannot be negative')
    .max(10_000_000, 'Price is too large')
    .nullable(),
  frontImageUrl: imageUrlSchema,
  frontImageAlt: optionalText,
  backImageUrl: imageUrlSchema,
  backImageAlt: optionalText,
  sizes: z
    .array(z.enum(MARKETPLACE_SIZE_OPTIONS))
    .min(1, 'Select at least one size'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  featured: z.boolean().default(false),
  inStock: z.boolean().default(true),
  messageEyebrow: optionalText,
  messageTitle: optionalText,
  messageSubtitle: optionalText,
  messageBody: optionalLongText,
});

export type MarketplaceProductWriteInput = z.infer<typeof marketplaceProductWriteSchema>;
