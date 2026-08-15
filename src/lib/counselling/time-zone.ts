import { counsellingEnv } from '@/lib/config/counselling-env';

const TORONTO = counsellingEnv.timeZone;

/** Format UTC instant in America/Toronto for display */
export function formatInTz(
  isoUtc: string | Date,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: 'full',
    timeStyle: 'short',
  },
  timeZone = TORONTO
): string {
  const d = typeof isoUtc === 'string' ? new Date(isoUtc) : isoUtc;
  return new Intl.DateTimeFormat('en-CA', { ...options, timeZone }).format(d);
}

export function formatSlotLabel(isoUtc: string, timeZone = TORONTO): string {
  return formatInTz(isoUtc, { hour: 'numeric', minute: '2-digit', hour12: true }, timeZone);
}

/** Local calendar YMD parts in timeZone for a UTC date */
export function ymdInTz(date: Date, timeZone = TORONTO): { y: number; m: number; d: number; weekday: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value || '';
  const y = Number(get('year'));
  const m = Number(get('month'));
  const d = Number(get('day'));
  const wd = get('weekday');
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { y, m, d, weekday: map[wd] ?? 0 };
}

/**
 * Convert local date + minutes-from-midnight in TZ to UTC Date.
 * Uses iterative offset approximation (good enough for America/Toronto).
 */
export function localMinutesToUtc(
  y: number,
  m: number,
  d: number,
  minutesFromMidnight: number,
  timeZone = TORONTO
): Date {
  const hour = Math.floor(minutesFromMidnight / 60);
  const minute = minutesFromMidnight % 60;
  // Guess as UTC then adjust by observed offset
  let guess = new Date(Date.UTC(y, m - 1, d, hour, minute, 0));
  for (let i = 0; i < 3; i++) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(guess);
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value || 0);
    const asLocal = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'));
    const want = Date.UTC(y, m - 1, d, hour, minute);
    guess = new Date(guess.getTime() + (want - asLocal));
  }
  return guess;
}

export function addDaysYmd(y: number, m: number, d: number, days: number): { y: number; m: number; d: number } {
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

export function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}
