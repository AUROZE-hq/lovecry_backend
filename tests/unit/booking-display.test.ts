import { describe, expect, it } from 'vitest';
import {
  appointmentModeLabel,
  buildCalendarGrid,
  buildGoogleCalendarUrl,
  counsellorFirstName,
  counsellorNameWithoutCredentials,
  durationMinutesBetween,
  formatCredentialLine,
  formatDisplayTimeRange,
  formatMonthYear,
  formatYmdLong,
  toGoogleUtcStamp,
} from '@/lib/counselling/display';

describe('booking display helpers', () => {
  it('formats civil dates without using the local timezone', () => {
    expect(formatYmdLong('2026-08-21')).toBe('Friday, August 21');
    expect(formatMonthYear(2026, 8)).toBe('August 2026');
  });

  it('builds a 6-week Sunday-start calendar grid', () => {
    const available = new Set(['2026-08-21']);
    const cells = buildCalendarGrid(2026, 8, available);
    expect(cells).toHaveLength(42);
    expect(cells[0]?.ymd).toBe('2026-07-26');
    expect(cells[0]?.inMonth).toBe(false);
    const selected = cells.find((cell) => cell.ymd === '2026-08-21');
    expect(selected?.inMonth).toBe(true);
    expect(selected?.available).toBe(true);
    expect(cells[41]?.ymd).toBe('2026-09-05');
  });

  it('formats counsellor names and credentials', () => {
    expect(counsellorNameWithoutCredentials('Jesse Wilson, RSW')).toBe('Jesse Wilson');
    expect(counsellorFirstName('Jesse Wilson, RSW')).toBe('Jesse');
    expect(formatCredentialLine('Registered Social Worker | CCTP (I-II)')).toBe(
      'Registered Social Worker · CCTP (I–II) · Counsellor'
    );
    expect(appointmentModeLabel('IN_PERSON')).toBe('In Person');
  });

  it('uses real start and end instants for duration and time range', () => {
    const start = '2026-08-21T18:30:00.000Z';
    const end = '2026-08-21T19:30:00.000Z';
    expect(durationMinutesBetween(start, end)).toBe(60);
    expect(formatDisplayTimeRange(start, end, 'America/Toronto')).toMatch(/PM/);
  });

  it('builds a Google Calendar URL with UTC start and end', () => {
    const start = '2026-08-21T18:30:00.000Z';
    const end = '2026-08-21T19:30:00.000Z';
    const url = buildGoogleCalendarUrl({
      title: 'LoveCry counselling',
      startTimeUtc: start,
      endTimeUtc: end,
      details: 'LoveCry counselling appointment',
      location: '150 Cosburn Ave., East York, ON M4J 2L9',
    });
    expect(toGoogleUtcStamp(start)).toBe('20260821T183000Z');
    expect(url).toContain('dates=20260821T183000Z/20260821T193000Z');
    expect(url).toContain('text=LoveCry+counselling');
    expect(url).toContain('location=150+Cosburn');
  });
});
