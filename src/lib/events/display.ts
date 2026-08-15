import { localMinutesToUtc } from '@/lib/counselling/time-zone';

export type EventTiming = 'upcoming' | 'past';

export function eventEndInstant(event: {
  startDateTime: Date;
  endDateTime: Date | null;
}): Date {
  return event.endDateTime ?? event.startDateTime;
}

export function classifyEventTiming(
  event: { startDateTime: Date; endDateTime: Date | null },
  now: Date = new Date()
): EventTiming {
  return eventEndInstant(event).getTime() < now.getTime() ? 'past' : 'upcoming';
}

export function localDateTimeToUtc(date: string, time: string, timeZone: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  if (!y || !m || !d || Number.isNaN(hh) || Number.isNaN(mm)) {
    throw new Error('Invalid date or time');
  }
  return localMinutesToUtc(y, m, d, hh * 60 + mm, timeZone);
}

export function utcToLocalDateTimeParts(
  utc: Date,
  timeZone: string
): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(utc);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || '';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
  };
}

export function formatDateBadge(
  utc: Date,
  timeZone: string
): { month: string; day: string; weekday: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  }).formatToParts(utc);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || '';
  return {
    month: get('month').toUpperCase(),
    day: get('day'),
    weekday: get('weekday').toUpperCase(),
  };
}

export function formatEventDate(utc: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(utc);
}

export function formatEventTimeRange(
  startUtc: Date,
  endUtc: Date | null,
  timeZone: string
): string {
  const timeFmt: Intl.DateTimeFormatOptions = {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  const start = new Intl.DateTimeFormat('en-CA', timeFmt).format(startUtc);
  if (!endUtc) return start;
  const end = new Intl.DateTimeFormat('en-CA', timeFmt).format(endUtc);
  return `${start} – ${end}`;
}

export type VerifiedImpactMetrics = {
  attendeesCount: number | null;
  volunteersCount: number | null;
  volunteerHours: number | null;
  activitiesCount: number | null;
  peopleReached: number | null;
};

export type VisibleMetric = {
  key: 'attendees' | 'volunteers' | 'volunteerHours' | 'activities' | 'peopleReached';
  label: string;
  value: number;
};

export function visibleImpactMetrics(metrics: VerifiedImpactMetrics): VisibleMetric[] {
  const items: VisibleMetric[] = [];
  if (metrics.attendeesCount != null) {
    items.push({ key: 'attendees', label: 'Attendees', value: metrics.attendeesCount });
  }
  if (metrics.volunteersCount != null) {
    items.push({ key: 'volunteers', label: 'Volunteers', value: metrics.volunteersCount });
  }
  if (metrics.volunteerHours != null) {
    items.push({ key: 'volunteerHours', label: 'Volunteer hours', value: metrics.volunteerHours });
  }
  if (metrics.activitiesCount != null) {
    items.push({ key: 'activities', label: 'Activities', value: metrics.activitiesCount });
  }
  if (metrics.peopleReached != null) {
    items.push({ key: 'peopleReached', label: 'People reached', value: metrics.peopleReached });
  }
  return items;
}

export type ImpactSummaryTotals = {
  eventsHosted: number;
  attendees: number | null;
  volunteers: number | null;
  volunteerHours: number | null;
  activities: number | null;
  peopleReached: number | null;
};

export function sumImpactSummary(
  pastPublished: Array<VerifiedImpactMetrics>
): ImpactSummaryTotals {
  const sum = (pick: (m: VerifiedImpactMetrics) => number | null): number | null => {
    const values = pastPublished.map(pick).filter((v): v is number => v != null);
    if (!values.length) return null;
    return values.reduce((a, b) => a + b, 0);
  };

  return {
    eventsHosted: pastPublished.length,
    attendees: sum((m) => m.attendeesCount),
    volunteers: sum((m) => m.volunteersCount),
    volunteerHours: sum((m) => m.volunteerHours),
    activities: sum((m) => m.activitiesCount),
    peopleReached: sum((m) => m.peopleReached),
  };
}

export function publicLocationLabel(event: {
  locationType: 'IN_PERSON' | 'ONLINE' | 'HYBRID';
  venueName: string | null;
  city: string | null;
  province: string | null;
  onlinePlatform: string | null;
}): string {
  if (event.locationType === 'ONLINE') {
    return event.onlinePlatform ? `Online · ${event.onlinePlatform}` : 'Online Event';
  }

  const place = [event.venueName, event.city, event.province].filter(Boolean).join(', ');
  if (event.locationType === 'HYBRID') {
    const online = event.onlinePlatform ? ` + online (${event.onlinePlatform})` : ' + online';
    return (place || 'In person') + online;
  }
  return place || 'Location to be announced';
}

export type RegistrationOpenState =
  | { open: true; waitlist: boolean }
  | { open: false; reason: 'cancelled' | 'deadline' | 'capacity' | 'not_internal' | 'unpublished' };

export function registrationAvailability(input: {
  status: string;
  registrationType: string;
  registrationDeadline: Date | null;
  capacity: number | null;
  registeredCount: number;
  now?: Date;
}): RegistrationOpenState {
  if (input.status !== 'PUBLISHED') {
    return { open: false, reason: input.status === 'CANCELLED' ? 'cancelled' : 'unpublished' };
  }
  if (input.registrationType !== 'INTERNAL_REGISTRATION') {
    return { open: false, reason: 'not_internal' };
  }
  const now = input.now ?? new Date();
  if (input.registrationDeadline && input.registrationDeadline.getTime() < now.getTime()) {
    return { open: false, reason: 'deadline' };
  }
  if (input.capacity != null && input.registeredCount >= input.capacity) {
    return { open: false, reason: 'capacity' };
  }
  return { open: true, waitlist: false };
}

export function ctaForEvent(event: {
  status: string;
  registrationType: 'LEARN_MORE' | 'EXTERNAL_REGISTRATION' | 'INTERNAL_REGISTRATION' | 'NO_REGISTRATION';
  registrationUrl: string | null;
  ctaLabel: string | null;
  slug: string;
}): { label: string; href: string; external: boolean } {
  if (event.status === 'CANCELLED') {
    return { label: 'Learn More', href: `/events/${event.slug}`, external: false };
  }
  if (event.registrationType === 'EXTERNAL_REGISTRATION' && event.registrationUrl) {
    return {
      label: event.ctaLabel || 'Register Now',
      href: event.registrationUrl,
      external: true,
    };
  }
  if (event.registrationType === 'INTERNAL_REGISTRATION') {
    return {
      label: event.ctaLabel || 'Register Now',
      href: `/events/${event.slug}#register`,
      external: false,
    };
  }
  return {
    label: event.ctaLabel || 'Learn More',
    href: `/events/${event.slug}`,
    external: false,
  };
}
