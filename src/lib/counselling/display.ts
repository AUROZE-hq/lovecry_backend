import type { AppointmentMode } from './types';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function toYmdUtc(date: Date): string {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

export function parseYmd(ymd: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (!y || m < 1 || m > 12 || d < 1 || d > 31) return null;
  return { y, m, d };
}

/** Format a civil YYYY-MM-DD date (not a timezone instant). */
export function formatYmdLong(ymd: string): string {
  const parsed = parseYmd(ymd);
  if (!parsed) return ymd;
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d)));
}

export function formatYmdShort(ymd: string): string {
  const parsed = parseYmd(ymd);
  if (!parsed) return ymd;
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d)));
}

export function formatMonthYear(year: number, month: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function formatClockTime(isoUtc: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone,
  }).format(new Date(isoUtc));
}

export function formatCompactClockTime(isoUtc: string, timeZone: string): string {
  return formatClockTime(isoUtc, timeZone).replace(/\s?(AM|PM)/i, '').trim();
}

export function formatDisplayTimeRange(startUtc: string, endUtc: string, timeZone: string): string {
  return `${formatClockTime(startUtc, timeZone)} – ${formatClockTime(endUtc, timeZone)}`;
}

export function formatWeekdayDate(isoUtc: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone,
  }).format(new Date(isoUtc));
}

export function formatWeekdayDateShort(isoUtc: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone,
  }).format(new Date(isoUtc));
}

export function formatDateUpper(isoUtc: string, timeZone: string): string {
  return formatWeekdayDate(isoUtc, timeZone).toUpperCase();
}

export function durationMinutesBetween(startUtc: string, endUtc: string): number {
  const ms = new Date(endUtc).getTime() - new Date(startUtc).getTime();
  return Math.max(1, Math.round(ms / 60_000));
}

export function counsellorNameWithoutCredentials(displayName: string): string {
  return displayName.split(',')[0]?.trim() || displayName;
}

export function counsellorFirstName(displayName: string): string {
  return counsellorNameWithoutCredentials(displayName).split(/\s+/)[0] || displayName;
}

export function counsellorInitials(displayName: string): string {
  const core = counsellorNameWithoutCredentials(displayName);
  const bits = core.split(/\s+/).filter(Boolean);
  if (bits.length >= 2) return `${bits[0]![0]}${bits[1]![0]}`.toUpperCase();
  return core.slice(0, 2).toUpperCase();
}

export function formatCredentialLine(raw: string): string {
  const parts = raw
    .split('|')
    .map((part) => part.trim().replace(/I-II/g, 'I–II'))
    .filter(Boolean);
  if (!parts.some((part) => /counsellor/i.test(part))) parts.push('Counsellor');
  return parts.join(' · ');
}

export function formatServiceLabel(name: string): string {
  return name.replace(/\s+session$/i, '').trim();
}

export function appointmentModeLabel(mode: AppointmentMode | string): string {
  if (mode === 'IN_PERSON') return 'In Person';
  if (mode === 'VIRTUAL') return 'Virtual';
  if (mode === 'PHONE') return 'Phone';
  return mode;
}

export function toGoogleUtcStamp(isoUtc: string): string {
  return new Date(isoUtc).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

export function buildGoogleCalendarUrl(input: {
  title: string;
  startTimeUtc: string;
  endTimeUtc: string;
  details: string;
  location?: string;
}): string {
  const start = toGoogleUtcStamp(input.startTimeUtc);
  const end = toGoogleUtcStamp(input.endTimeUtc);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: input.title,
    details: input.details,
  });
  if (input.location) params.set('location', input.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}&dates=${start}/${end}`;
}

export type CalendarCell = {
  ymd: string;
  day: number;
  inMonth: boolean;
  available: boolean;
};

export function buildCalendarGrid(
  year: number,
  month: number,
  availableYmds: ReadonlySet<string>
): CalendarCell[] {
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysThis = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: CalendarCell[] = [];

  for (let i = 0; i < firstWeekday; i++) {
    const dt = new Date(Date.UTC(year, month - 1, 1 - (firstWeekday - i)));
    const ymd = toYmdUtc(dt);
    cells.push({
      ymd,
      day: dt.getUTCDate(),
      inMonth: false,
      available: availableYmds.has(ymd),
    });
  }

  for (let day = 1; day <= daysThis; day++) {
    const ymd = `${year}-${pad2(month)}-${pad2(day)}`;
    cells.push({
      ymd,
      day,
      inMonth: true,
      available: availableYmds.has(ymd),
    });
  }

  let extra = 1;
  while (cells.length < 42) {
    const dt = new Date(Date.UTC(year, month, extra));
    const ymd = toYmdUtc(dt);
    cells.push({
      ymd,
      day: dt.getUTCDate(),
      inMonth: false,
      available: availableYmds.has(ymd),
    });
    extra += 1;
  }

  return cells;
}
