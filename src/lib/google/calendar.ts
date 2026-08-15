import { google, calendar_v3 } from 'googleapis';
import { counsellingEnv, isGoogleOAuthConfigured } from '@/lib/config/counselling-env';
import { prisma } from '@/lib/db/prisma';
import { decryptSecret, encryptSecret } from '@/lib/security/token-encryption';
import { logError, logInfo, logWarn } from '@/lib/security/logger';

const CALENDAR_SCOPES = [
  'openid',
  'email',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
];

export type CalendarConnectionStatus = {
  connected: boolean;
  configured: boolean;
  status: string;
  connectedEmail: string | null;
  calendarId: string | null;
  calendarIdMasked: string | null;
  calendarName: string | null;
  lastSuccessfulCheckAt: string | null;
  lastError: string | null;
  message: string;
};

function maskCalendarId(id: string | null | undefined): string | null {
  if (!id) return null;
  if (id.length <= 8) return '••••';
  return `${id.slice(0, 4)}…${id.slice(-4)}`;
}

function oauthClient() {
  if (!isGoogleOAuthConfigured()) {
    throw new Error('Google OAuth is not configured (GOOGLE_CLIENT_ID / SECRET / REDIRECT_URI).');
  }
  return new google.auth.OAuth2(
    counsellingEnv.google.clientId,
    counsellingEnv.google.clientSecret,
    counsellingEnv.google.redirectUri
  );
}

export function getGoogleAuthUrl(state: string): string {
  const client = oauthClient();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: CALENDAR_SCOPES,
    state,
    include_granted_scopes: false,
  });
}

export async function exchangeCodeAndStoreTokens(input: {
  code: string;
  adminUserId: string;
}): Promise<{ connectedEmail: string | null }> {
  const client = oauthClient();
  const { tokens } = await client.getToken(input.code);
  if (!tokens.refresh_token) {
    throw new Error(
      'Google did not return a refresh token. Disconnect the app in Google Account permissions and reconnect.'
    );
  }

  client.setCredentials(tokens);
  let connectedEmail: string | null = null;
  if (tokens.id_token) {
    try {
      const payload = JSON.parse(
        Buffer.from(tokens.id_token.split('.')[1] || '', 'base64url').toString('utf8')
      ) as { email?: string };
      connectedEmail = payload.email ?? null;
    } catch {
      connectedEmail = null;
    }
  }

  const encrypted = encryptSecret(tokens.refresh_token);
  const calendarId = counsellingEnv.google.counsellingCalendarId || null;

  await prisma.googleCalendarIntegration.updateMany({
    where: { provider: 'GOOGLE_CALENDAR', status: 'CONNECTED' },
    data: { status: 'DISCONNECTED', revokedAt: new Date() },
  });

  await prisma.googleCalendarIntegration.create({
    data: {
      provider: 'GOOGLE_CALENDAR',
      encryptedRefreshToken: encrypted,
      connectedEmail,
      calendarId,
      connectedByUserId: input.adminUserId,
      status: 'CONNECTED',
      connectedAt: new Date(),
    },
  });

  logInfo('google_calendar_connected', {
    integration: 'google_calendar',
    action: 'connect',
    status: 'CONNECTED',
  });

  return { connectedEmail };
}

async function getActiveIntegration() {
  return prisma.googleCalendarIntegration.findFirst({
    where: { provider: 'GOOGLE_CALENDAR', status: 'CONNECTED', revokedAt: null },
    orderBy: { connectedAt: 'desc' },
  });
}

export async function isGoogleCalendarConnected(): Promise<boolean> {
  if (!isGoogleOAuthConfigured()) return false;
  const row = await getActiveIntegration();
  return Boolean(row?.encryptedRefreshToken);
}

export async function getCalendarConnectionStatus(): Promise<CalendarConnectionStatus> {
  const configured = isGoogleOAuthConfigured();
  const row = await getActiveIntegration();
  const calendarId = row?.calendarId || counsellingEnv.google.counsellingCalendarId || null;

  if (!configured) {
    return {
      connected: false,
      configured: false,
      status: 'NOT_CONFIGURED',
      connectedEmail: null,
      calendarId,
      calendarIdMasked: maskCalendarId(calendarId),
      calendarName: null,
      lastSuccessfulCheckAt: null,
      lastError: null,
      message: 'Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, and GOOGLE_CALENDAR_ID.',
    };
  }

  if (!row) {
    return {
      connected: false,
      configured: true,
      status: 'NOT_CONNECTED',
      connectedEmail: null,
      calendarId,
      calendarIdMasked: maskCalendarId(calendarId),
      calendarName: null,
      lastSuccessfulCheckAt: null,
      lastError: null,
      message: 'Google Calendar is not connected. An administrator must connect via OAuth.',
    };
  }

  return {
    connected: true,
    configured: true,
    status: row.status,
    connectedEmail: row.connectedEmail,
    calendarId,
    calendarIdMasked: maskCalendarId(calendarId),
    calendarName: row.calendarName,
    lastSuccessfulCheckAt: row.lastSuccessfulCheckAt?.toISOString() ?? null,
    lastError: row.lastError,
    message: 'Google Calendar is connected.',
  };
}

export async function getGoogleCalendarClient(): Promise<{
  calendar: calendar_v3.Calendar;
  calendarId: string;
  integrationId: string;
}> {
  const row = await getActiveIntegration();
  if (!row) throw new Error('Google Calendar is not connected.');

  let refreshToken: string;
  try {
    refreshToken = decryptSecret(row.encryptedRefreshToken);
  } catch (err) {
    logError('google_token_decrypt_failed', {
      integration: 'google_calendar',
      action: 'decrypt',
      errorCode: 'TOKEN_DECRYPT_FAILED',
    });
    throw err;
  }

  const client = oauthClient();
  client.setCredentials({ refresh_token: refreshToken });

  client.on('tokens', async (tokens) => {
    if (tokens.refresh_token) {
      try {
        await prisma.googleCalendarIntegration.update({
          where: { id: row.id },
          data: { encryptedRefreshToken: encryptSecret(tokens.refresh_token) },
        });
      } catch {
        logWarn('google_refresh_token_rotate_failed', {
          integration: 'google_calendar',
          action: 'rotate',
        });
      }
    }
  });

  const calendarId = row.calendarId || counsellingEnv.google.counsellingCalendarId;
  if (!calendarId) throw new Error('GOOGLE_CALENDAR_ID is not set.');

  return {
    calendar: google.calendar({ version: 'v3', auth: client }),
    calendarId,
    integrationId: row.id,
  };
}

export async function verifyCalendarAccess(): Promise<{
  ok: boolean;
  calendarName?: string;
  error?: string;
}> {
  try {
    const { calendar, calendarId, integrationId } = await getGoogleCalendarClient();
    const meta = await calendar.calendars.get({ calendarId });
    await prisma.googleCalendarIntegration.update({
      where: { id: integrationId },
      data: {
        calendarName: meta.data.summary ?? null,
        lastSuccessfulCheckAt: new Date(),
        lastError: null,
        status: 'CONNECTED',
      },
    });
    return { ok: true, calendarName: meta.data.summary ?? undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Calendar verification failed';
    const row = await getActiveIntegration();
    if (row) {
      const revoked = /invalid_grant|revoked|unauthorized/i.test(message);
      await prisma.googleCalendarIntegration.update({
        where: { id: row.id },
        data: {
          lastError: 'Calendar API check failed',
          status: revoked ? 'REVOKED' : 'ERROR',
        },
      });
    }
    logError('google_calendar_verify_failed', {
      integration: 'google_calendar',
      action: 'test',
      errorCode: 'VERIFY_FAILED',
      message,
    });
    return { ok: false, error: 'Unable to verify Google Calendar access. Reconnect may be required.' };
  }
}

export async function getBusyIntervals(
  timeMin: Date,
  timeMax: Date
): Promise<Array<{ start: Date; end: Date }>> {
  if (!(await isGoogleCalendarConnected())) return [];

  try {
    const { calendar, calendarId, integrationId } = await getGoogleCalendarClient();
    const res = await calendar.freebusy.query({
      requestBody: {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        timeZone: counsellingEnv.google.calendarTimezone,
        items: [{ id: calendarId }],
      },
    });

    await prisma.googleCalendarIntegration.update({
      where: { id: integrationId },
      data: { lastSuccessfulCheckAt: new Date(), lastError: null },
    });

    const busy = res.data.calendars?.[calendarId]?.busy ?? [];
    return busy
      .filter((b) => b.start && b.end)
      .map((b) => ({ start: new Date(b.start!), end: new Date(b.end!) }));
  } catch (err) {
    logError('google_freebusy_failed', {
      integration: 'google_calendar',
      action: 'freebusy',
      errorCode: 'FREEBUSY_FAILED',
      message: err instanceof Error ? err.message : 'unknown',
    });
    // Fail closed for availability: treat as fully busy for the window would block booking;
    // instead rethrow so callers can decide. Availability generation should exclude nothing
    // only when disconnected; when connected but erroring, return a sentinel busy span.
    return [{ start: timeMin, end: timeMax }];
  }
}

/** @deprecated alias */
export const getCalendarBusyPeriods = getBusyIntervals;

export async function createCalendarEvent(input: {
  reference: string;
  startUtc: Date;
  endUtc: Date;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  mode: string;
  consentStatus: string;
  createMeet?: boolean;
}): Promise<{ eventId: string; meetUrl: string | null; htmlLink: string | null; calendarId: string }> {
  const { calendar, calendarId } = await getGoogleCalendarClient();
  const { buildCounsellingCalendarEventPayload, assertCalendarPayloadPrivacy } = await import(
    './calendar-event-payload'
  );
  const payload = buildCounsellingCalendarEventPayload({
    reference: input.reference,
    startUtc: input.startUtc,
    endUtc: input.endUtc,
    timeZone: counsellingEnv.google.calendarTimezone,
    clientName: input.clientName,
    clientEmail: input.clientEmail,
    clientPhone: input.clientPhone,
    mode: input.mode,
    consentStatus: input.consentStatus,
    createMeet: Boolean(input.createMeet),
    conferenceRequestId: `lc-meet-${input.reference}`.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64),
  });
  assertCalendarPayloadPrivacy(payload.description);

  const res = await calendar.events.insert({
    calendarId,
    conferenceDataVersion: payload.conferenceDataVersion,
    requestBody: payload.requestBody,
  });

  const eventId = res.data.id;
  if (!eventId) throw new Error('Google Calendar did not return an event id.');

  const meetUrl =
    res.data.hangoutLink ||
    res.data.conferenceData?.entryPoints?.find((e) => e.entryPointType === 'video')?.uri ||
    null;

  return {
    eventId,
    meetUrl,
    htmlLink: res.data.htmlLink ?? null,
    calendarId,
  };
}

export async function updateCalendarEvent(
  googleEventId: string,
  patch: { startUtc: Date; endUtc: Date }
): Promise<{ htmlLink: string | null }> {
  const { calendar, calendarId } = await getGoogleCalendarClient();
  const tz = counsellingEnv.google.calendarTimezone;
  const res = await calendar.events.patch({
    calendarId,
    eventId: googleEventId,
    requestBody: {
      start: { dateTime: patch.startUtc.toISOString(), timeZone: tz },
      end: { dateTime: patch.endUtc.toISOString(), timeZone: tz },
    },
  });
  return { htmlLink: res.data.htmlLink ?? null };
}

export async function deleteCalendarEvent(googleEventId: string): Promise<{ ok: true }> {
  const { calendar, calendarId } = await getGoogleCalendarClient();
  try {
    await calendar.events.delete({ calendarId, eventId: googleEventId });
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    const status = (err as { code?: number })?.code;
    if (status === 404 || status === 410 || /Not Found|Resource has been deleted/i.test(message)) {
      return { ok: true };
    }
    throw err;
  }
  return { ok: true };
}

export const cancelCalendarEvent = deleteCalendarEvent;

export async function disconnectGoogleCalendar(adminUserId?: string): Promise<void> {
  const row = await prisma.googleCalendarIntegration.findFirst({
    where: { provider: 'GOOGLE_CALENDAR', status: 'CONNECTED', revokedAt: null },
    orderBy: { connectedAt: 'desc' },
  });
  if (!row) {
    // Idempotent: already disconnected
    return;
  }

  try {
    const refreshToken = decryptSecret(row.encryptedRefreshToken);
    const client = oauthClient();
    await client.revokeToken(refreshToken).catch(() => undefined);
  } catch {
    // Token may already be invalid — continue soft-disconnect
  }

  await prisma.googleCalendarIntegration.update({
    where: { id: row.id },
    data: {
      status: 'DISCONNECTED',
      revokedAt: new Date(),
      encryptedRefreshToken: encryptSecret(`revoked:${row.id}:${Date.now()}`),
      lastError: null,
    },
  });

  logInfo('google_calendar_disconnected', {
    integration: 'google_calendar',
    action: 'disconnect',
    status: 'DISCONNECTED',
  });
  void adminUserId;
}

/** Legacy status used by admin UI before OAuth panel. */
export function getGoogleStatus() {
  return {
    configured: isGoogleOAuthConfigured(),
    message: isGoogleOAuthConfigured()
      ? 'Google OAuth credentials detected. Connect from the admin panel.'
      : 'Google OAuth is not configured yet.',
  };
}
