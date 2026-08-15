import { getBusyIntervals } from '@/lib/google/calendar';
import {
  getCounsellor,
  getSettings,
  listAppointments,
  listHolds,
  listOverrides,
  listWindows,
} from './store';
import { addDaysYmd, formatSlotLabel, localMinutesToUtc, rangesOverlap, ymdInTz } from './time-zone';
import type {
  AvailabilityOverride,
  AvailabilityWindow,
  BookingSettingsRecord,
  HoldRecord,
  AppointmentRecord,
  TimeSlot,
} from './types';

const ACTIVE_STATUSES = new Set(['PENDING', 'CONFIRMED', 'CONSENT_OVERDUE']);

function expandWithBuffers(start: Date, end: Date, before: number, after: number) {
  return {
    start: new Date(start.getTime() - before * 60_000),
    end: new Date(end.getTime() + after * 60_000),
  };
}

type RangeContext = {
  settings: BookingSettingsRecord;
  counsellorId: string;
  windows: AvailabilityWindow[];
  overrides: AvailabilityOverride[];
  appointments: AppointmentRecord[];
  holds: HoldRecord[];
  googleBusy: Array<{ start: Date; end: Date }>;
  now: number;
  minStart: number;
  maxEnd: number;
};

async function loadRangeContext(rangeStart: Date, rangeEnd: Date): Promise<RangeContext> {
  const settings = await getSettings();
  const counsellor = await getCounsellor();
  const [windows, overrides, appointments, holds, googleBusy] = await Promise.all([
    listWindows(),
    listOverrides(),
    listAppointments(),
    listHolds(),
    getBusyIntervals(rangeStart, rangeEnd),
  ]);

  const now = Date.now();
  return {
    settings,
    counsellorId: counsellor.id,
    windows,
    overrides,
    appointments: appointments.filter(
      (a) => a.counsellorId === counsellor.id && ACTIVE_STATUSES.has(a.status)
    ),
    holds: holds.filter((h) => h.counsellorId === counsellor.id && !h.convertedAt),
    googleBusy,
    now,
    minStart: now + settings.minimumNoticeHours * 3600_000,
    maxEnd: now + settings.maximumWindowDays * 24 * 3600_000,
  };
}

function generateSlotsForDateWithContext(ymd: string, ctx: RangeContext): TimeSlot[] {
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return [];

  const { settings } = ctx;
  const probe = localMinutesToUtc(y, m, d, 12 * 60, settings.timeZone);
  const { weekday } = ymdInTz(probe, settings.timeZone);

  const windows = ctx.windows.filter((w) => w.weekday === weekday && w.active !== false);
  if (!windows.length) return [];

  const dayStart = localMinutesToUtc(y, m, d, 0, settings.timeZone);
  const dayEnd = localMinutesToUtc(y, m, d + 1, 0, settings.timeZone);

  const overrides = ctx.overrides.filter((o) => {
    const os = new Date(o.startTimeUtc);
    const oe = new Date(o.endTimeUtc);
    return rangesOverlap(dayStart, dayEnd, os, oe);
  });

  const fullBlock = overrides.some((o) => {
    if (o.type === 'OPEN') return false;
    const os = new Date(o.startTimeUtc).getTime();
    const oe = new Date(o.endTimeUtc).getTime();
    return os <= dayStart.getTime() && oe >= dayEnd.getTime() - 1;
  });
  if (fullBlock) return [];

  const duration = settings.durationMinutes;
  const bufferBefore = settings.bufferBeforeMinutes;
  const bufferAfter = settings.bufferAfterMinutes;
  const step = duration + bufferAfter;

  const busy = [
    ...ctx.appointments.map((a) => ({
      start: new Date(a.startTimeUtc),
      end: new Date(a.endTimeUtc),
    })),
    ...ctx.holds.map((h) => ({
      start: new Date(h.startTimeUtc),
      end: new Date(h.endTimeUtc),
    })),
    ...ctx.googleBusy,
    ...overrides
      .filter((o) => o.type !== 'OPEN')
      .map((o) => ({ start: new Date(o.startTimeUtc), end: new Date(o.endTimeUtc) })),
  ];

  const confirmedToday = ctx.appointments.filter((a) => {
    const s = new Date(a.startTimeUtc);
    return s >= dayStart && s < dayEnd;
  }).length;
  if (confirmedToday >= settings.maxAppointmentsPerDay) return [];

  const slots: TimeSlot[] = [];
  for (const win of windows) {
    for (let mins = win.startMinutes; mins + duration <= win.endMinutes; mins += step) {
      const start = localMinutesToUtc(y, m, d, mins, settings.timeZone);
      const end = new Date(start.getTime() + duration * 60_000);
      if (start.getTime() < ctx.minStart) continue;
      if (end.getTime() > ctx.maxEnd) continue;

      const buffered = expandWithBuffers(start, end, bufferBefore, bufferAfter);
      const conflict = busy.some((b) => rangesOverlap(buffered.start, buffered.end, b.start, b.end));
      if (conflict) continue;

      slots.push({
        startTimeUtc: start.toISOString(),
        endTimeUtc: end.toISOString(),
        label: formatSlotLabel(start.toISOString(), settings.timeZone),
      });
    }
  }
  return slots;
}

export async function generateSlotsForDate(ymd: string): Promise<TimeSlot[]> {
  const settings = await getSettings();
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return [];
  const dayStart = localMinutesToUtc(y, m, d, 0, settings.timeZone);
  const dayEnd = localMinutesToUtc(y, m, d + 1, 0, settings.timeZone);
  const ctx = await loadRangeContext(dayStart, dayEnd);
  return generateSlotsForDateWithContext(ymd, ctx);
}

/** One Google freebusy query for the full booking window. */
export async function listAvailableDates(): Promise<string[]> {
  const settings = await getSettings();
  const now = new Date();
  const startParts = ymdInTz(now, settings.timeZone);
  const first = addDaysYmd(startParts.y, startParts.m, startParts.d, 0);
  const last = addDaysYmd(startParts.y, startParts.m, startParts.d, settings.maximumWindowDays);

  const rangeStart = localMinutesToUtc(first.y, first.m, first.d, 0, settings.timeZone);
  const rangeEnd = localMinutesToUtc(last.y, last.m, last.d + 1, 0, settings.timeZone);
  const ctx = await loadRangeContext(rangeStart, rangeEnd);

  const dates: string[] = [];
  for (let i = 0; i <= settings.maximumWindowDays; i++) {
    const { y, m, d } = addDaysYmd(startParts.y, startParts.m, startParts.d, i);
    const ymd = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const slots = generateSlotsForDateWithContext(ymd, ctx);
    if (slots.length) dates.push(ymd);
  }
  return dates;
}

export async function isSlotAvailable(
  startTimeUtc: string,
  endTimeUtc: string,
  ignoreHoldTokenHash?: string,
  ignoreAppointmentId?: string
): Promise<boolean> {
  const settings = await getSettings();
  const counsellor = await getCounsellor();
  const start = new Date(startTimeUtc);
  const end = new Date(endTimeUtc);
  const now = Date.now();

  if (start.getTime() < now + settings.minimumNoticeHours * 3600_000) return false;
  if (end.getTime() > now + settings.maximumWindowDays * 24 * 3600_000) return false;

  const buffered = expandWithBuffers(
    start,
    end,
    settings.bufferBeforeMinutes,
    settings.bufferAfterMinutes
  );

  const conflictAppt = (await listAppointments()).some(
    (a) =>
      a.id !== ignoreAppointmentId &&
      a.counsellorId === counsellor.id &&
      ACTIVE_STATUSES.has(a.status) &&
      rangesOverlap(buffered.start, buffered.end, new Date(a.startTimeUtc), new Date(a.endTimeUtc))
  );
  if (conflictAppt) return false;

  const conflictHold = (await listHolds()).some(
    (h) =>
      h.counsellorId === counsellor.id &&
      !h.convertedAt &&
      h.tokenHash !== ignoreHoldTokenHash &&
      rangesOverlap(buffered.start, buffered.end, new Date(h.startTimeUtc), new Date(h.endTimeUtc))
  );
  if (conflictHold) return false;

  const googleBusy = await getBusyIntervals(buffered.start, buffered.end);
  if (googleBusy.some((b) => rangesOverlap(buffered.start, buffered.end, b.start, b.end))) {
    return false;
  }

  return true;
}
