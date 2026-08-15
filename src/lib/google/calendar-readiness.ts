import { donationEnv } from '@/lib/config/env';
import { isGoogleOAuthConfigured } from '@/lib/config/counselling-env';
import { prisma } from '@/lib/db/prisma';

export type CalendarReadiness =
  | { ok: true; mode: 'connected' | 'optional_dev' }
  | {
      ok: false;
      reason: 'NOT_CONFIGURED' | 'NOT_CONNECTED' | 'REVOKED' | 'ERROR' | 'DISCONNECTED';
      message: string;
    };

const SAFE_UNAVAILABLE =
  'Online booking is temporarily unavailable. Please try again later or contact LoveCry.';

/**
 * Production fail-closed: booking finalization requires a CONNECTED Calendar integration.
 * Development may proceed without Calendar when GOOGLE_CALENDAR_REQUIRED is not true.
 */
export async function getCalendarReadinessForBooking(): Promise<CalendarReadiness> {
  const required =
    process.env.GOOGLE_CALENDAR_REQUIRED === 'true' ||
    donationEnv.appEnv === 'production' ||
    process.env.NODE_ENV === 'production';

  if (!isGoogleOAuthConfigured()) {
    if (required) {
      return { ok: false, reason: 'NOT_CONFIGURED', message: SAFE_UNAVAILABLE };
    }
    return { ok: true, mode: 'optional_dev' };
  }

  const row = await prisma.googleCalendarIntegration.findFirst({
    where: { provider: 'GOOGLE_CALENDAR' },
    orderBy: { connectedAt: 'desc' },
  });

  if (!row || row.status === 'DISCONNECTED' || row.revokedAt) {
    if (required) {
      return { ok: false, reason: 'NOT_CONNECTED', message: SAFE_UNAVAILABLE };
    }
    return { ok: true, mode: 'optional_dev' };
  }

  if (row.status === 'REVOKED') {
    return { ok: false, reason: 'REVOKED', message: SAFE_UNAVAILABLE };
  }

  if (row.status === 'ERROR') {
    return { ok: false, reason: 'ERROR', message: SAFE_UNAVAILABLE };
  }

  if (row.status === 'CONNECTED' && row.encryptedRefreshToken) {
    return { ok: true, mode: 'connected' };
  }

  if (required) {
    return { ok: false, reason: 'NOT_CONNECTED', message: SAFE_UNAVAILABLE };
  }
  return { ok: true, mode: 'optional_dev' };
}

export async function assertCalendarReadyForMutation(): Promise<CalendarReadiness> {
  return getCalendarReadinessForBooking();
}
