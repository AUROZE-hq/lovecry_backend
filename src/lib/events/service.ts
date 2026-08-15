import type {
  Event,
  EventHighlight,
  EventMedia,
  EventRegistration,
  EventLocationType,
  EventRegistrationType,
  EventStatus,
  Prisma,
} from '@prisma/client';
import { isUnreachableDatabase, prisma } from '@/lib/db/prisma';
import { deliverEmail } from '@/lib/email/send';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { logWarn } from '@/lib/security/logger';
import { orgInfo } from '@/lib/org-info';
import {
  classifyEventTiming,
  localDateTimeToUtc,
  registrationAvailability,
  sumImpactSummary,
  type ImpactSummaryTotals,
} from '@/lib/events/display';
import {
  eventWriteSchema,
  publicRegistrationSchema,
  type AdminEventFilter,
  type EventWriteInput,
  type PublicRegistrationInput,
} from '@/lib/events/schemas';
import { slugifyTitle } from '@/lib/events/slug';

export class EventServiceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const eventInclude = {
  media: { orderBy: { sortOrder: 'asc' as const } },
  highlights: { orderBy: { sortOrder: 'asc' as const } },
  _count: {
    select: {
      registrations: { where: { status: 'REGISTERED' as const } },
    },
  },
} satisfies Prisma.EventInclude;

export type EventWithRelations = Event & {
  media: EventMedia[];
  highlights: EventHighlight[];
  _count: { registrations: number };
};

export type PublicEvent = EventWithRelations;

async function writeAudit(input: {
  action: string;
  eventId: string;
  adminId?: string | null;
  detail?: Record<string, unknown>;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      administratorId: input.adminId ?? undefined,
      action: input.action,
      entityType: 'Event',
      entityId: input.eventId,
      newData: input.detail ? (input.detail as Prisma.InputJsonValue) : undefined,
    },
  });
}

function parseWriteInput(raw: unknown): EventWriteInput {
  const parsed = eventWriteSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new EventServiceError(first?.message || 'Invalid event data', 400);
  }
  return parsed.data;
}

function toDateFields(data: EventWriteInput) {
  const startDateTime = localDateTimeToUtc(data.startDate, data.startTime, data.timezone);
  let endDateTime: Date | null = null;
  if (data.endDate && data.endTime) {
    endDateTime = localDateTimeToUtc(data.endDate, data.endTime, data.timezone);
    if (endDateTime.getTime() <= startDateTime.getTime()) {
      throw new EventServiceError('End date/time must be after the start', 400);
    }
  }

  let registrationDeadline: Date | null = null;
  if (data.registrationDeadlineDate && data.registrationDeadlineTime) {
    registrationDeadline = localDateTimeToUtc(
      data.registrationDeadlineDate,
      data.registrationDeadlineTime,
      data.timezone
    );
  }

  return { startDateTime, endDateTime, registrationDeadline };
}

function scalarData(data: EventWriteInput, dates: ReturnType<typeof toDateFields>) {
  return {
    title: data.title,
    slug: data.slug,
    shortDescription: data.shortDescription,
    description: data.description ?? null,
    eventCategory: data.eventCategory ?? null,
    startDateTime: dates.startDateTime,
    endDateTime: dates.endDateTime,
    timezone: data.timezone,
    locationType: data.locationType as EventLocationType,
    venueName: data.venueName ?? null,
    addressLine: data.addressLine ?? null,
    city: data.city ?? null,
    province: data.province ?? null,
    postalCode: data.postalCode ?? null,
    onlinePlatform: data.onlinePlatform ?? null,
    onlineUrl: data.onlineUrl ?? null,
    coverImageUrl: data.coverImageUrl ?? null,
    coverImageAlt: data.coverImageAlt ?? null,
    registrationType: data.registrationType as EventRegistrationType,
    registrationUrl: data.registrationUrl ?? null,
    registrationDeadline: dates.registrationDeadline,
    capacity: data.capacity ?? null,
    ctaLabel: data.ctaLabel ?? null,
    impactSummary: data.impactSummary ?? null,
    attendeesCount: data.attendeesCount ?? null,
    volunteersCount: data.volunteersCount ?? null,
    volunteerHours: data.volunteerHours ?? null,
    activitiesCount: data.activitiesCount ?? null,
    peopleReached: data.peopleReached ?? null,
  };
}

async function replaceChildren(eventId: string, data: EventWriteInput): Promise<void> {
  await prisma.$transaction([
    prisma.eventHighlight.deleteMany({ where: { eventId } }),
    prisma.eventMedia.deleteMany({ where: { eventId } }),
    prisma.eventHighlight.createMany({
      data: data.highlights
        .map((h) => h.text.trim())
        .filter(Boolean)
        .map((text, index) => ({ eventId, text, sortOrder: index })),
    }),
    prisma.eventMedia.createMany({
      data: data.gallery.map((item, index) => ({
        eventId,
        url: item.url.trim(),
        altText: item.altText?.trim() || null,
        sortOrder: item.sortOrder ?? index,
      })),
    }),
  ]);
}

async function assertSlugAvailable(slug: string, excludeId?: string): Promise<void> {
  const existing = await prisma.event.findUnique({ where: { slug }, select: { id: true } });
  if (existing && existing.id !== excludeId) {
    throw new EventServiceError('That slug is already in use', 409);
  }
}

export async function createEvent(
  raw: unknown,
  adminId?: string
): Promise<EventWithRelations> {
  const data = parseWriteInput(raw);
  await assertSlugAvailable(data.slug);
  const dates = toDateFields(data);

  const created = await prisma.event.create({
    data: {
      ...scalarData(data, dates),
      status: 'DRAFT',
      createdByAdminId: adminId ?? null,
      updatedByAdminId: adminId ?? null,
    },
  });

  await replaceChildren(created.id, data);
  await writeAudit({ action: 'EVENT_CREATED', eventId: created.id, adminId, detail: { slug: data.slug } });
  return getAdminEventById(created.id);
}

export async function updateEvent(
  id: string,
  raw: unknown,
  adminId?: string
): Promise<EventWithRelations> {
  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) throw new EventServiceError('Event not found', 404);

  const data = parseWriteInput(raw);
  await assertSlugAvailable(data.slug, id);
  const dates = toDateFields(data);

  await prisma.event.update({
    where: { id },
    data: {
      ...scalarData(data, dates),
      updatedByAdminId: adminId ?? null,
    },
  });
  await replaceChildren(id, data);
  await writeAudit({ action: 'EVENT_UPDATED', eventId: id, adminId, detail: { slug: data.slug } });
  return getAdminEventById(id);
}

export async function publishEvent(id: string, adminId?: string): Promise<EventWithRelations> {
  const event = await getAdminEventById(id);
  if (event.status === 'ARCHIVED') {
    throw new EventServiceError('Archived events cannot be published', 400);
  }
  await prisma.event.update({
    where: { id },
    data: {
      status: 'PUBLISHED',
      publishedAt: event.publishedAt ?? new Date(),
      updatedByAdminId: adminId ?? null,
    },
  });
  await writeAudit({ action: 'EVENT_PUBLISHED', eventId: id, adminId });
  return getAdminEventById(id);
}

export async function unpublishEvent(id: string, adminId?: string): Promise<EventWithRelations> {
  await getAdminEventById(id);
  await prisma.event.update({
    where: { id },
    data: { status: 'DRAFT', updatedByAdminId: adminId ?? null },
  });
  await writeAudit({ action: 'EVENT_UNPUBLISHED', eventId: id, adminId });
  return getAdminEventById(id);
}

export async function cancelEvent(id: string, adminId?: string): Promise<EventWithRelations> {
  await getAdminEventById(id);
  await prisma.event.update({
    where: { id },
    data: { status: 'CANCELLED', updatedByAdminId: adminId ?? null },
  });
  await writeAudit({ action: 'EVENT_CANCELLED', eventId: id, adminId });
  return getAdminEventById(id);
}

export async function archiveEvent(id: string, adminId?: string): Promise<EventWithRelations> {
  await getAdminEventById(id);
  await prisma.event.update({
    where: { id },
    data: { status: 'ARCHIVED', updatedByAdminId: adminId ?? null },
  });
  await writeAudit({ action: 'EVENT_ARCHIVED', eventId: id, adminId });
  return getAdminEventById(id);
}

export async function deleteEvent(id: string, adminId?: string): Promise<void> {
  const event = await getAdminEventById(id);
  if (event.status !== 'DRAFT') {
    throw new EventServiceError('Only draft events can be deleted. Archive published history instead.', 400);
  }
  if (event._count.registrations > 0) {
    throw new EventServiceError('This draft has registrations and cannot be deleted. Archive it instead.', 400);
  }
  await prisma.event.delete({ where: { id } });
  await writeAudit({ action: 'EVENT_DELETED', eventId: id, adminId, detail: { slug: event.slug } });
}

export async function getAdminEventById(id: string): Promise<EventWithRelations> {
  const event = await prisma.event.findUnique({ where: { id }, include: eventInclude });
  if (!event) throw new EventServiceError('Event not found', 404);
  return event;
}

export async function getAdminEvents(filter: AdminEventFilter = 'all'): Promise<EventWithRelations[]> {
  const now = new Date();
  const where: Prisma.EventWhereInput =
    filter === 'draft'
      ? { status: 'DRAFT' }
      : filter === 'published'
        ? { status: 'PUBLISHED' }
        : filter === 'cancelled'
          ? { status: 'CANCELLED' }
          : filter === 'archived'
            ? { status: 'ARCHIVED' }
            : filter === 'upcoming'
              ? {
                  status: { in: ['PUBLISHED', 'CANCELLED'] },
                  OR: [
                    { endDateTime: { gte: now } },
                    { AND: [{ endDateTime: null }, { startDateTime: { gte: now } }] },
                  ],
                }
              : filter === 'past'
                ? {
                    status: { in: ['PUBLISHED', 'CANCELLED'] },
                    OR: [
                      { endDateTime: { lt: now } },
                      { AND: [{ endDateTime: null }, { startDateTime: { lt: now } }] },
                    ],
                  }
                : {};

  return prisma.event.findMany({
    where,
    include: eventInclude,
    orderBy: { startDateTime: 'desc' },
  });
}

const publicStatus: EventStatus[] = ['PUBLISHED', 'CANCELLED'];

function publicWhere(): Prisma.EventWhereInput {
  return { status: { in: publicStatus } };
}

async function publicRead<T>(fallback: T, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (err) {
    if (isUnreachableDatabase(err)) {
      logWarn('events_db_unreachable', {
        action: 'read',
        errorCode: 'P1001',
        message: 'MySQL is unreachable. Public events will stay empty until DATABASE_URL points at a running database.',
      });
      return fallback;
    }
    throw err;
  }
}

export async function getPublishedUpcomingEvents(now = new Date()): Promise<PublicEvent[]> {
  return publicRead([], () =>
    prisma.event.findMany({
      where: {
        ...publicWhere(),
        OR: [
          { endDateTime: { gte: now } },
          { AND: [{ endDateTime: null }, { startDateTime: { gte: now } }] },
        ],
      },
      include: eventInclude,
      orderBy: { startDateTime: 'asc' },
      take: 60,
    })
  );
}

export async function getPublishedPastEvents(now = new Date()): Promise<PublicEvent[]> {
  return publicRead([], () =>
    prisma.event.findMany({
      where: {
        ...publicWhere(),
        OR: [
          { endDateTime: { lt: now } },
          { AND: [{ endDateTime: null }, { startDateTime: { lt: now } }] },
        ],
      },
      include: eventInclude,
      orderBy: { startDateTime: 'desc' },
      take: 60,
    })
  );
}

export async function getEventBySlug(
  slug: string,
  options?: { allowPreview?: boolean }
): Promise<PublicEvent | null> {
  return publicRead(null, async () => {
    const event = await prisma.event.findUnique({ where: { slug }, include: eventInclude });
    if (!event) return null;
    if (event.status === 'PUBLISHED' || event.status === 'CANCELLED') return event;
    if (options?.allowPreview) return event;
    return null;
  });
}

export async function getPublicImpactSummary(now = new Date()): Promise<ImpactSummaryTotals> {
  const past = await getPublishedPastEvents(now);
  return sumImpactSummary(past);
}

export async function suggestUniqueSlug(title: string, excludeId?: string): Promise<string> {
  const base = slugifyTitle(title);
  let candidate = base;
  let n = 2;
  while (true) {
    const existing = await prisma.event.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${base}-${n}`.slice(0, 80);
    n += 1;
  }
}

export async function listEventRegistrations(eventId: string): Promise<EventRegistration[]> {
  await getAdminEventById(eventId);
  return prisma.eventRegistration.findMany({
    where: { eventId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function cancelRegistration(
  eventId: string,
  registrationId: string,
  adminId?: string
): Promise<void> {
  const row = await prisma.eventRegistration.findFirst({
    where: { id: registrationId, eventId },
  });
  if (!row) throw new EventServiceError('Registration not found', 404);
  await prisma.eventRegistration.update({
    where: { id: registrationId },
    data: { status: 'CANCELLED' },
  });
  await writeAudit({
    action: 'EVENT_REGISTRATION_CANCELLED',
    eventId,
    adminId,
    detail: { registrationId },
  });
}

export async function exportRegistrationsCsv(eventId: string): Promise<string> {
  const rows = await listEventRegistrations(eventId);
  const header = ['Name', 'Email', 'Phone', 'Registered At', 'Status'];
  const lines = rows.map((row) =>
    [row.fullName, row.email, row.phone ?? '', row.createdAt.toISOString(), row.status]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(',')
  );
  return [header.join(','), ...lines].join('\n');
}

export type RegistrationResult = {
  registration: EventRegistration;
  emailStatus: 'SENT' | 'FAILED' | 'SKIPPED';
  waitlisted: boolean;
};

export async function registerForEvent(
  raw: unknown,
  options?: { rateLimitKey?: string }
): Promise<RegistrationResult> {
  const parsed = publicRegistrationSchema.safeParse(raw);
  if (!parsed.success) {
    throw new EventServiceError(parsed.error.issues[0]?.message || 'Invalid registration', 400);
  }
  const input: PublicRegistrationInput = parsed.data;
  const email = input.email.toLowerCase();

  const rate = checkRateLimit({
    key: options?.rateLimitKey || `event-reg:${email}`,
    limit: 8,
    windowMs: 10 * 60_000,
  });
  if (!rate.ok) {
    throw new EventServiceError('Too many registration attempts. Please try again shortly.', 429);
  }

  const event = await prisma.event.findUnique({
    where: { id: input.eventId },
    include: eventInclude,
  });
  if (!event) throw new EventServiceError('Event not found', 404);

  const availability = registrationAvailability({
    status: event.status,
    registrationType: event.registrationType,
    registrationDeadline: event.registrationDeadline,
    capacity: event.capacity,
    registeredCount: event._count.registrations,
  });

  if (!availability.open) {
    const messages: Record<string, string> = {
      cancelled: 'This event has been cancelled.',
      deadline: 'Registration for this event has closed.',
      capacity: 'This event is at capacity.',
      not_internal: 'This event does not use online registration.',
      unpublished: 'This event is not open for registration.',
    };
    throw new EventServiceError(messages[availability.reason] || 'Registration is closed.', 400);
  }

  const existing = await prisma.eventRegistration.findUnique({
    where: { eventId_email: { eventId: event.id, email } },
  });
  if (existing?.status === 'REGISTERED' || existing?.status === 'WAITLISTED') {
    throw new EventServiceError('This email is already registered for this event.', 409);
  }

  const registration =
    existing && existing.status === 'CANCELLED'
      ? await prisma.eventRegistration.update({
          where: { id: existing.id },
          data: {
            fullName: input.fullName,
            phone: input.phone ?? null,
            status: 'REGISTERED',
          },
        })
      : await prisma.eventRegistration.create({
          data: {
            eventId: event.id,
            fullName: input.fullName,
            email,
            phone: input.phone ?? null,
            status: 'REGISTERED',
          },
        });

  const emailStatus = await deliverEmail({
    to: email,
    subject: `You're registered: ${event.title}`,
    text: `Hi ${input.fullName},\n\nYou are registered for ${event.title}.\n\n${orgInfo.shortName}\n${orgInfo.websiteHref}\n`,
    html: `<p>Hi ${escapeHtml(input.fullName)},</p><p>You are registered for <strong>${escapeHtml(event.title)}</strong>.</p><p>${escapeHtml(orgInfo.shortName)}</p>`,
  });

  return { registration, emailStatus, waitlisted: false };
}

export async function getRegistrationsForEmail(email: string): Promise<
  Array<EventRegistration & { event: { id: string; title: string; slug: string; startDateTime: Date } }>
> {
  return publicRead([], () =>
    prisma.eventRegistration.findMany({
      where: { email: email.toLowerCase(), status: { in: ['REGISTERED', 'WAITLISTED'] } },
      include: {
        event: { select: { id: true, title: true, slug: true, startDateTime: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  );
}

export async function cancelOwnRegistration(email: string, registrationId: string): Promise<void> {
  const row = await prisma.eventRegistration.findFirst({
    where: { id: registrationId, email: email.toLowerCase() },
  });
  if (!row) throw new EventServiceError('Registration not found', 404);
  await prisma.eventRegistration.update({
    where: { id: registrationId },
    data: { status: 'CANCELLED' },
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export { classifyEventTiming };
