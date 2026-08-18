import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  assertCalendarPayloadPrivacy,
  buildCounsellingCalendarEventPayload,
} from '@/lib/google/calendar-event-payload';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { encryptSecret, decryptSecret } from '@/lib/security/token-encryption';
import { localMinutesToUtc, rangesOverlap, ymdInTz } from '@/lib/counselling/time-zone';
import { roleHasPermission } from '@/lib/auth/permissions';

describe('calendar event privacy (real builder)', () => {
  it('builds approved summary and operational-only description', () => {
    const payload = buildCounsellingCalendarEventPayload({
      reference: 'LC-APT-2026-000001',
      startUtc: new Date('2026-06-01T15:00:00.000Z'),
      endUtc: new Date('2026-06-01T16:00:00.000Z'),
      timeZone: 'America/Toronto',
      clientName: 'Test Client',
      clientEmail: 'test@example.com',
      clientPhone: '416-555-0100',
      mode: 'VIRTUAL',
      consentStatus: 'SENT',
      createMeet: true,
    });

    expect(payload.summary).toBe('LoveCry Counselling Appointment');
    expect(payload.description).not.toMatch(/trauma|diagnos|intake|medical|notes|consent answer/i);
    expect(() => assertCalendarPayloadPrivacy(payload.description)).not.toThrow();
    expect(payload.conferenceDataVersion).toBe(1);
    expect(payload.requestBody.visibility).toBe('private');
  });

  it('rejects clinical content in privacy assert', () => {
    expect(() => assertCalendarPayloadPrivacy('Client trauma history details')).toThrow();
  });
});

describe('token encryption', () => {
  it('round-trips secrets', () => {
    process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = 'test-key-for-vitest-only';
    const sealed = encryptSecret('refresh-token-value');
    expect(decryptSecret(sealed)).toBe('refresh-token-value');
  });
});

describe('rate limit adapter', () => {
  it('blocks after limit', () => {
    const key = `rbac-test-${Date.now()}-${Math.random()}`;
    expect(checkRateLimit({ key, limit: 2, windowMs: 60_000 }).ok).toBe(true);
    expect(checkRateLimit({ key, limit: 2, windowMs: 60_000 }).ok).toBe(true);
    expect(checkRateLimit({ key, limit: 2, windowMs: 60_000 }).ok).toBe(false);
  });
});

describe('RBAC matrix', () => {
  it('denies READ_ONLY mutations', () => {
    expect(roleHasPermission('READ_ONLY', 'counselling.write')).toBe(false);
    expect(roleHasPermission('READ_ONLY', 'counselling.google')).toBe(false);
    expect(roleHasPermission('READ_ONLY', 'donations.write')).toBe(false);
    expect(roleHasPermission('READ_ONLY', 'events.write')).toBe(false);
    expect(roleHasPermission('READ_ONLY', 'marketplace.write')).toBe(false);
  });

  it('allows COUNSELLOR_ADMIN counselling only', () => {
    expect(roleHasPermission('COUNSELLOR_ADMIN', 'counselling.write')).toBe(true);
    expect(roleHasPermission('COUNSELLOR_ADMIN', 'donations.write')).toBe(false);
    expect(roleHasPermission('COUNSELLOR_ADMIN', 'events.write')).toBe(false);
    expect(roleHasPermission('COUNSELLOR_ADMIN', 'marketplace.write')).toBe(false);
  });

  it('allows SUPER_ADMIN everything', () => {
    expect(roleHasPermission('SUPER_ADMIN', 'admin.users')).toBe(true);
  });
});

describe('mock pay production guard', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('is unavailable when APP_ENV is production (fresh module load)', async () => {
    vi.stubEnv('APP_ENV', 'production');
    vi.stubEnv('ALLOW_MOCK_PAY', 'true');
    vi.stubEnv('NODE_ENV', 'production');
    const { isMockPayAllowed } = await import('@/lib/config/env');
    expect(isMockPayAllowed()).toBe(false);
    vi.unstubAllEnvs();
  });
});

describe('America/Toronto DST', () => {
  it('spring forward 2026 keeps local mapping coherent', () => {
    const before = localMinutesToUtc(2026, 3, 8, 1 * 60, 'America/Toronto');
    const after = localMinutesToUtc(2026, 3, 8, 3 * 60, 'America/Toronto');
    expect(after.getTime() - before.getTime()).toBe(60 * 60_000);
    const parts = ymdInTz(after, 'America/Toronto');
    expect(parts).toMatchObject({ y: 2026, m: 3, d: 8 });
  });

  it('overlap helper is exclusive at endpoint', () => {
    const a0 = new Date('2026-06-01T15:00:00.000Z');
    const a1 = new Date('2026-06-01T16:00:00.000Z');
    const b0 = new Date('2026-06-01T16:00:00.000Z');
    const b1 = new Date('2026-06-01T17:00:00.000Z');
    expect(rangesOverlap(a0, a1, b0, b1)).toBe(false);
  });
});

describe('calendar readiness fail-closed contract', () => {
  it('exports readiness helper', async () => {
    const mod = await import('@/lib/google/calendar-readiness');
    expect(typeof mod.getCalendarReadinessForBooking).toBe('function');
  });
});
