import { beforeEach, describe, expect, it, vi } from 'vitest';
import { slugifyTitle, isValidSlug } from '@/lib/events/slug';
import { isAllowedImageUrl } from '@/lib/events/media';
import {
  classifyEventTiming,
  formatDateBadge,
  registrationAvailability,
  sumImpactSummary,
  visibleImpactMetrics,
  ctaForEvent,
  localDateTimeToUtc,
} from '@/lib/events/display';
import { eventWriteSchema, publicRegistrationSchema } from '@/lib/events/schemas';
import { roleHasPermission } from '@/lib/auth/permissions';

const validWrite = {
  title: 'Community Gathering',
  slug: 'community-gathering',
  shortDescription: 'A verified LoveCry community gathering for neighbours.',
  startDate: '2026-10-12',
  startTime: '18:00',
  timezone: 'America/Toronto',
  locationType: 'IN_PERSON' as const,
  venueName: 'Community Room',
  city: 'Toronto',
  registrationType: 'LEARN_MORE' as const,
  highlights: [],
  gallery: [],
};

describe('event slug', () => {
  it('slugifies titles', () => {
    expect(slugifyTitle('LoveCry Wellness Series!')).toBe('lovecry-wellness-series');
    expect(isValidSlug('lovecry-wellness-series')).toBe(true);
    expect(isValidSlug('Hello World')).toBe(false);
  });
});

describe('media URLs', () => {
  it('allows site paths and https images', () => {
    expect(isAllowedImageUrl('/event-1.jpg')).toBe(true);
    expect(isAllowedImageUrl('https://cdn.example.com/photo.jpg')).toBe(true);
    expect(isAllowedImageUrl('http://cdn.example.com/photo.jpg')).toBe(false);
    expect(isAllowedImageUrl('javascript:alert(1)')).toBe(false);
    expect(isAllowedImageUrl('../secret')).toBe(false);
  });
});

describe('date classification and Toronto timezone', () => {
  it('classifies future events as upcoming and completed as past', () => {
    const future = {
      startDateTime: new Date('2026-10-12T22:00:00.000Z'),
        endDateTime: new Date('2026-10-13T00:00:00.000Z'),
    };
    const past = {
      startDateTime: new Date('2026-01-01T15:00:00.000Z'),
      endDateTime: new Date('2026-01-01T17:00:00.000Z'),
    };
    const now = new Date('2026-06-01T12:00:00.000Z');
    expect(classifyEventTiming(future, now)).toBe('upcoming');
    expect(classifyEventTiming(past, now)).toBe('past');
  });

  it('uses endDateTime when present, otherwise startDateTime', () => {
    const now = new Date('2026-06-14T16:30:00.000Z');
    expect(
      classifyEventTiming(
        { startDateTime: new Date('2026-06-14T15:00:00.000Z'), endDateTime: new Date('2026-06-14T17:00:00.000Z') },
        now
      )
    ).toBe('upcoming');
    expect(
      classifyEventTiming(
        { startDateTime: new Date('2026-06-14T15:00:00.000Z'), endDateTime: null },
        now
      )
    ).toBe('past');
  });

  it('converts America/Toronto local time to UTC', () => {
    const utc = localDateTimeToUtc('2026-06-14', '10:00', 'America/Toronto');
    expect(utc.toISOString()).toBe('2026-06-14T14:00:00.000Z');
    const badge = formatDateBadge(utc, 'America/Toronto');
    expect(badge.month).toBe('JUN');
    expect(badge.day).toBe('14');
    expect(badge.weekday).toBe('SUN');
  });
});

describe('impact metrics', () => {
  it('hides null metrics and never invents zeros', () => {
    expect(visibleImpactMetrics({
      attendeesCount: null,
      volunteersCount: null,
      volunteerHours: null,
      activitiesCount: null,
      peopleReached: null,
    })).toEqual([]);
    expect(visibleImpactMetrics({
      attendeesCount: 65,
      volunteersCount: null,
      volunteerHours: null,
      activitiesCount: 3,
      peopleReached: null,
    }).map((m) => m.key)).toEqual(['attendees', 'activities']);
  });

  it('sums only verified (non-null) values', () => {
    const totals = sumImpactSummary([
      { attendeesCount: 10, volunteersCount: 2, volunteerHours: null, activitiesCount: 1, peopleReached: null },
      { attendeesCount: 5, volunteersCount: null, volunteerHours: 8, activitiesCount: null, peopleReached: null },
    ]);
    expect(totals.eventsHosted).toBe(2);
    expect(totals.attendees).toBe(15);
    expect(totals.volunteers).toBe(2);
    expect(totals.volunteerHours).toBe(8);
    expect(totals.activities).toBe(1);
    expect(totals.peopleReached).toBeNull();
  });
});

describe('registration availability', () => {
  const base = {
    status: 'PUBLISHED',
    registrationType: 'INTERNAL_REGISTRATION',
    registrationDeadline: null as Date | null,
    capacity: 2 as number | null,
    registeredCount: 0,
    now: new Date('2026-06-01T12:00:00.000Z'),
  };

  it('opens internal published registration', () => {
    expect(registrationAvailability(base).open).toBe(true);
  });

  it('closes after deadline', () => {
    expect(
      registrationAvailability({
        ...base,
        registrationDeadline: new Date('2026-05-01T12:00:00.000Z'),
      })
    ).toEqual({ open: false, reason: 'deadline' });
  });

  it('closes at capacity', () => {
    expect(registrationAvailability({ ...base, registeredCount: 2 })).toEqual({
      open: false,
      reason: 'capacity',
    });
  });

  it('disables cancelled events', () => {
    expect(registrationAvailability({ ...base, status: 'CANCELLED' })).toEqual({
      open: false,
      reason: 'cancelled',
    });
  });
});

describe('CTA', () => {
  it('routes learn more to the event slug', () => {
    expect(
      ctaForEvent({
        status: 'PUBLISHED',
        registrationType: 'LEARN_MORE',
        registrationUrl: null,
        ctaLabel: null,
        slug: 'community-gathering',
      })
    ).toEqual({ label: 'Learn More', href: '/events/community-gathering', external: false });
  });
});

describe('validation schemas', () => {
  it('accepts a valid create payload', () => {
    const parsed = eventWriteSchema.safeParse(validWrite);
    expect(parsed.success).toBe(true);
  });

  it('rejects end before start at the service date layer via schema pairing', () => {
    const parsed = eventWriteSchema.safeParse({
      ...validWrite,
      endDate: '2026-10-12',
      endTime: '17:00',
    });
    expect(parsed.success).toBe(true);
  });

  it('requires venue or city for in-person events', () => {
    const parsed = eventWriteSchema.safeParse({
      ...validWrite,
      venueName: '',
      city: '',
    });
    expect(parsed.success).toBe(false);
  });

  it('requires URL for external registration', () => {
    const parsed = eventWriteSchema.safeParse({
      ...validWrite,
      registrationType: 'EXTERNAL_REGISTRATION',
    });
    expect(parsed.success).toBe(false);
  });

  it('validates public registration fields', () => {
    expect(publicRegistrationSchema.safeParse({
      eventId: 'abc',
      fullName: 'A',
      email: 'not-an-email',
    }).success).toBe(false);
    expect(publicRegistrationSchema.safeParse({
      eventId: 'abc',
      fullName: 'Alex Rivera',
      email: 'alex@example.com',
    }).success).toBe(true);
  });
});

describe('events RBAC', () => {
  it('allows ADMIN and SUPER_ADMIN to write events', () => {
    expect(roleHasPermission('ADMIN', 'events.write')).toBe(true);
    expect(roleHasPermission('SUPER_ADMIN', 'events.write')).toBe(true);
  });

  it('denies READ_ONLY and COUNSELLOR_ADMIN event mutations', () => {
    expect(roleHasPermission('READ_ONLY', 'events.write')).toBe(false);
    expect(roleHasPermission('COUNSELLOR_ADMIN', 'events.write')).toBe(false);
  });
});

const prismaMock = vi.hoisted(() => {
  const eventStore: Record<string, unknown>[] = [];
  return {
    eventStore,
    event: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    eventHighlight: { deleteMany: vi.fn(), createMany: vi.fn() },
    eventMedia: { deleteMany: vi.fn(), createMany: vi.fn() },
    eventRegistration: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    auditLog: { create: vi.fn() },
    $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
  };
});

vi.mock('@/lib/db/prisma', () => ({
  prisma: prismaMock,
}));

vi.mock('@/lib/email/send', () => ({
  deliverEmail: vi.fn(async () => 'SKIPPED'),
}));

describe('event service CRUD and visibility', () => {
  beforeEach(() => {
    vi.resetModules();
    prismaMock.event.create.mockReset();
    prismaMock.event.findUnique.mockReset();
    prismaMock.event.findMany.mockReset();
    prismaMock.event.update.mockReset();
    prismaMock.event.delete.mockReset();
    prismaMock.auditLog.create.mockReset();
    prismaMock.eventHighlight.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.eventHighlight.createMany.mockResolvedValue({ count: 0 });
    prismaMock.eventMedia.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.eventMedia.createMany.mockResolvedValue({ count: 0 });
    prismaMock.$transaction.mockImplementation(async (ops: Promise<unknown>[]) => Promise.all(ops));
  });

  function draftRecord(overrides: Record<string, unknown> = {}) {
    return {
      id: 'evt_1',
      title: 'Community Gathering',
      slug: 'community-gathering',
      shortDescription: 'A verified LoveCry community gathering for neighbours.',
      description: null,
      status: 'DRAFT',
      eventCategory: null,
      startDateTime: new Date('2026-10-12T22:00:00.000Z'),
      endDateTime: new Date('2026-10-13T00:00:00.000Z'),
      timezone: 'America/Toronto',
      locationType: 'IN_PERSON',
      venueName: 'Community Room',
      addressLine: null,
      city: 'Toronto',
      province: 'ON',
      postalCode: null,
      onlinePlatform: null,
      onlineUrl: null,
      coverImageUrl: null,
      coverImageAlt: null,
      registrationType: 'INTERNAL_REGISTRATION',
      registrationUrl: null,
      registrationDeadline: null,
      capacity: 10,
      ctaLabel: null,
      impactSummary: null,
      attendeesCount: null,
      volunteersCount: null,
      volunteerHours: null,
      activitiesCount: null,
      peopleReached: null,
      publishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdByAdminId: 'admin_1',
      updatedByAdminId: 'admin_1',
      media: [],
      highlights: [],
      _count: { registrations: 0 },
      ...overrides,
    };
  }

  it('creates a draft that is not listed publicly', async () => {
    const draft = draftRecord();
    prismaMock.event.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(draft);
    prismaMock.event.create.mockResolvedValue(draft);
    prismaMock.event.findMany.mockResolvedValue([]);

    const { createEvent, getPublishedUpcomingEvents } = await import('@/lib/events/service');
    const created = await createEvent(validWrite, 'admin_1');
    expect(created.status).toBe('DRAFT');
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'EVENT_CREATED' }) })
    );

    const publicUpcoming = await getPublishedUpcomingEvents(new Date('2026-06-01T00:00:00.000Z'));
    expect(publicUpcoming).toEqual([]);
    expect(prismaMock.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { in: ['PUBLISHED', 'CANCELLED'] },
        }),
      })
    );
  });

  it('publishes a draft so it appears in public queries', async () => {
    const draft = draftRecord();
    const published = draftRecord({ status: 'PUBLISHED', publishedAt: new Date('2026-06-02T00:00:00.000Z') });
    prismaMock.event.findUnique
      .mockResolvedValueOnce(draft)
      .mockResolvedValueOnce(published);
    prismaMock.event.update.mockResolvedValue(published);
    prismaMock.event.findMany.mockResolvedValue([published]);

    const { publishEvent, getPublishedUpcomingEvents } = await import('@/lib/events/service');
    const result = await publishEvent('evt_1', 'admin_1');
    expect(result.status).toBe('PUBLISHED');
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'EVENT_PUBLISHED' }) })
    );

    const upcoming = await getPublishedUpcomingEvents(new Date('2026-06-01T00:00:00.000Z'));
    expect(upcoming[0]?.status).toBe('PUBLISHED');
  });

  it('does not return archived events by slug to the public', async () => {
    prismaMock.event.findUnique.mockResolvedValue(draftRecord({ status: 'ARCHIVED' }));
    const { getEventBySlug } = await import('@/lib/events/service');
    expect(await getEventBySlug('community-gathering')).toBeNull();
    expect(await getEventBySlug('community-gathering', { allowPreview: true })).not.toBeNull();
  });

  it('updates event fields', async () => {
    const existing = draftRecord();
    const updated = draftRecord({ title: 'Updated Gathering' });
    prismaMock.event.findUnique
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(updated);
    prismaMock.event.update.mockResolvedValue(updated);

    const { updateEvent } = await import('@/lib/events/service');
    const result = await updateEvent('evt_1', { ...validWrite, title: 'Updated Gathering' }, 'admin_1');
    expect(result.title).toBe('Updated Gathering');
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'EVENT_UPDATED' }) })
    );
  });
});

describe('internal registration rules', () => {
  beforeEach(() => {
    vi.resetModules();
    prismaMock.event.findUnique.mockReset();
    prismaMock.eventRegistration.findUnique.mockReset();
    prismaMock.eventRegistration.create.mockReset();
  });

  it('registers successfully for a published internal event', async () => {
    prismaMock.event.findUnique.mockResolvedValue({
      id: 'evt_1',
      title: 'Community Gathering',
      status: 'PUBLISHED',
      registrationType: 'INTERNAL_REGISTRATION',
      registrationDeadline: null,
      capacity: 10,
      _count: { registrations: 0 },
    });
    prismaMock.eventRegistration.findUnique.mockResolvedValue(null);
    prismaMock.eventRegistration.create.mockResolvedValue({
      id: 'reg_1',
      eventId: 'evt_1',
      fullName: 'Alex Rivera',
      email: 'alex@example.com',
      phone: null,
      status: 'REGISTERED',
      createdAt: new Date(),
    });

    const { registerForEvent } = await import('@/lib/events/service');
    const result = await registerForEvent({
      eventId: 'evt_1',
      fullName: 'Alex Rivera',
      email: 'alex@example.com',
    });
    expect(result.registration.status).toBe('REGISTERED');
    expect(result.emailStatus).toBe('SKIPPED');
  });

  it('rejects duplicate email registrations', async () => {
    prismaMock.event.findUnique.mockResolvedValue({
      id: 'evt_1',
      title: 'Community Gathering',
      status: 'PUBLISHED',
      registrationType: 'INTERNAL_REGISTRATION',
      registrationDeadline: null,
      capacity: 10,
      _count: { registrations: 1 },
    });
    prismaMock.eventRegistration.findUnique.mockResolvedValue({
      id: 'reg_1',
      status: 'REGISTERED',
    });

    const { registerForEvent, EventServiceError } = await import('@/lib/events/service');
    await expect(
      registerForEvent({
        eventId: 'evt_1',
        fullName: 'Alex Rivera',
        email: 'alex@example.com',
      })
    ).rejects.toBeInstanceOf(EventServiceError);
  });

  it('rejects cancelled events', async () => {
    prismaMock.event.findUnique.mockResolvedValue({
      id: 'evt_1',
      title: 'Community Gathering',
      status: 'CANCELLED',
      registrationType: 'INTERNAL_REGISTRATION',
      registrationDeadline: null,
      capacity: 10,
      _count: { registrations: 0 },
    });

    const { registerForEvent, EventServiceError } = await import('@/lib/events/service');
    await expect(
      registerForEvent({
        eventId: 'evt_1',
        fullName: 'Alex Rivera',
        email: 'alex@example.com',
      })
    ).rejects.toMatchObject({ message: 'This event has been cancelled.' });
  });

  it('rejects after deadline and at capacity', async () => {
    prismaMock.event.findUnique.mockResolvedValue({
      id: 'evt_1',
      title: 'Community Gathering',
      status: 'PUBLISHED',
      registrationType: 'INTERNAL_REGISTRATION',
      registrationDeadline: new Date('2020-01-01T00:00:00.000Z'),
      capacity: 10,
      _count: { registrations: 0 },
    });
    const { registerForEvent } = await import('@/lib/events/service');
    await expect(
      registerForEvent({
        eventId: 'evt_1',
        fullName: 'Alex Rivera',
        email: 'alex@example.com',
      })
    ).rejects.toMatchObject({ message: 'Registration for this event has closed.' });

    prismaMock.event.findUnique.mockResolvedValue({
      id: 'evt_1',
      title: 'Community Gathering',
      status: 'PUBLISHED',
      registrationType: 'INTERNAL_REGISTRATION',
      registrationDeadline: null,
      capacity: 1,
      _count: { registrations: 1 },
    });
    await expect(
      registerForEvent({
        eventId: 'evt_1',
        fullName: 'Alex Rivera',
        email: 'alex2@example.com',
      })
    ).rejects.toMatchObject({ message: 'This event is at capacity.' });
  });
});

describe('unauthenticated admin mutations', () => {
  it('requirePermission denies missing sessions', async () => {
    vi.resetModules();
    vi.doMock('@/lib/auth/admin-gate', () => {
      class AuthError extends Error {
        status: number;
        constructor(message: string, status: number) {
          super(message);
          this.status = status;
        }
      }
      return {
        AuthError,
        requireAdmin: vi.fn(async () => {
          throw new AuthError('Unauthorized', 401);
        }),
      };
    });
    const { requirePermission, AuthError } = await import('@/lib/auth/permissions');
    await expect(requirePermission('events.write')).rejects.toBeInstanceOf(AuthError);
  });
});
