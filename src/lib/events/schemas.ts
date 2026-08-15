import { z } from 'zod';
import { isAllowedImageUrl, isAllowedPublicUrl } from '@/lib/events/media';
import { isValidSlug } from '@/lib/events/slug';

const emptyToUndef = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const optionalText = z.preprocess(emptyToUndef, z.string().trim().max(500).optional());
const optionalLongText = z.preprocess(emptyToUndef, z.string().trim().max(20_000).optional());

const optionalHttpsOrSiteImage = z.preprocess(emptyToUndef, z.string().trim().max(2000).optional()).refine(
  (value) => value == null || isAllowedImageUrl(value),
  'Cover/gallery images must be a site path starting with / or an https:// URL'
);

const optionalPublicUrl = z.preprocess(emptyToUndef, z.string().trim().max(2000).optional()).refine(
  (value) => value == null || isAllowedPublicUrl(value),
  'Must be a valid http(s) URL'
);

const optionalNonNegInt = z.preprocess((value) => {
  if (value === '' || value == null || value === undefined) return undefined;
  if (typeof value === 'number') return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : value;
}, z.number().int().min(0).max(1_000_000).optional());

const optionalPositiveInt = z.preprocess((value) => {
  if (value === '' || value == null || value === undefined) return undefined;
  if (typeof value === 'number') return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : value;
}, z.number().int().min(1).max(100_000).optional());

export const eventStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED', 'ARCHIVED']);
export const eventLocationTypeSchema = z.enum(['IN_PERSON', 'ONLINE', 'HYBRID']);
export const eventRegistrationTypeSchema = z.enum([
  'LEARN_MORE',
  'EXTERNAL_REGISTRATION',
  'INTERNAL_REGISTRATION',
  'NO_REGISTRATION',
]);

export const eventHighlightInputSchema = z.object({
  text: z.string().trim().min(1).max(500),
  sortOrder: z.number().int().min(0).optional(),
});

export const eventMediaInputSchema = z.object({
  url: z.string().trim().min(1).max(2000).refine(isAllowedImageUrl, 'Invalid image URL'),
  altText: z.string().trim().max(200).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
});

export const eventWriteSchema = z
  .object({
    title: z.string().trim().min(3).max(120),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .refine(isValidSlug, 'Slug may only contain lowercase letters, numbers, and hyphens'),
    shortDescription: z.string().trim().min(10).max(500),
    description: optionalLongText,
    eventCategory: optionalText,
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date is required'),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time is required'),
    endDate: z.preprocess(emptyToUndef, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
    endTime: z.preprocess(emptyToUndef, z.string().regex(/^\d{2}:\d{2}$/).optional()),
    timezone: z.string().trim().min(3).max(80).default('America/Toronto'),
    locationType: eventLocationTypeSchema,
    venueName: optionalText,
    addressLine: optionalText,
    city: optionalText,
    province: optionalText,
    postalCode: optionalText,
    onlinePlatform: optionalText,
    onlineUrl: optionalPublicUrl,
    coverImageUrl: optionalHttpsOrSiteImage,
    coverImageAlt: optionalText,
    registrationType: eventRegistrationTypeSchema,
    registrationUrl: optionalPublicUrl,
    registrationDeadlineDate: z.preprocess(emptyToUndef, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
    registrationDeadlineTime: z.preprocess(emptyToUndef, z.string().regex(/^\d{2}:\d{2}$/).optional()),
    capacity: optionalPositiveInt,
    ctaLabel: optionalText,
    impactSummary: optionalLongText,
    attendeesCount: optionalNonNegInt,
    volunteersCount: optionalNonNegInt,
    volunteerHours: optionalNonNegInt,
    activitiesCount: optionalNonNegInt,
    peopleReached: optionalNonNegInt,
    highlights: z.array(eventHighlightInputSchema).max(20).default([]),
    gallery: z.array(eventMediaInputSchema).max(12).default([]),
  })
  .superRefine((data, ctx) => {
    if ((data.endDate && !data.endTime) || (!data.endDate && data.endTime)) {
      ctx.addIssue({
        code: 'custom',
        message: 'End date and end time must be provided together',
        path: ['endTime'],
      });
    }
    if (data.locationType === 'IN_PERSON' || data.locationType === 'HYBRID') {
      if (!data.venueName && !data.city) {
        ctx.addIssue({
          code: 'custom',
          message: 'Venue name or city is required for in-person and hybrid events',
          path: ['venueName'],
        });
      }
    }
    if (data.registrationType === 'EXTERNAL_REGISTRATION' && !data.registrationUrl) {
      ctx.addIssue({
        code: 'custom',
        message: 'External registration requires a registration URL',
        path: ['registrationUrl'],
      });
    }
  });

export type EventWriteInput = z.infer<typeof eventWriteSchema>;

export const publicRegistrationSchema = z.object({
  eventId: z.string().trim().min(1),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.preprocess(emptyToUndef, z.string().trim().max(40).optional()),
});

export type PublicRegistrationInput = z.infer<typeof publicRegistrationSchema>;

export const adminEventFilterSchema = z.enum([
  'all',
  'draft',
  'published',
  'upcoming',
  'past',
  'cancelled',
  'archived',
]);

export type AdminEventFilter = z.infer<typeof adminEventFilterSchema>;
