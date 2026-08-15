/**
 * Counselling booking + Google Calendar OAuth configuration.
 * Calendar uses server-side OAuth (not service accounts).
 * Drive folder IDs remain separate and must not share Calendar OAuth scopes.
 */

export const counsellingEnv = {
  timeZone: process.env.APP_TIME_ZONE || 'America/Toronto',
  holdMinutes: Number(process.env.BOOKING_HOLD_MINUTES || 10),
  durationMinutes: Number(process.env.DEFAULT_APPOINTMENT_DURATION_MINUTES || 60),
  bufferBeforeMinutes: Number(process.env.DEFAULT_BUFFER_BEFORE_MINUTES || 0),
  bufferAfterMinutes: Number(process.env.DEFAULT_BUFFER_AFTER_MINUTES || 15),
  minimumNoticeHours: Number(process.env.MINIMUM_BOOKING_NOTICE_HOURS || 24),
  maximumWindowDays: Number(process.env.MAXIMUM_BOOKING_WINDOW_DAYS || 60),
  consentDeadlineHours: Number(process.env.CONSENT_DEADLINE_HOURS || 24),
  /** Policy B default: allow booking before signature */
  consentRequiredBeforeConfirm: process.env.CONSENT_REQUIRED_BEFORE_CONFIRM === 'true',
  google: {
    /** @deprecated service-account Calendar auth — superseded by OAuth */
    projectId: process.env.GOOGLE_PROJECT_ID || '',
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL || '',
    privateKey: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    workspaceAdminEmail: process.env.GOOGLE_WORKSPACE_ADMIN_EMAIL || '',
    /** OAuth web client */
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI ||
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/integrations/google-calendar/callback`,
    counsellingCalendarId:
      process.env.GOOGLE_CALENDAR_ID || process.env.GOOGLE_COUNSELLING_CALENDAR_ID || '',
    calendarTimezone: process.env.GOOGLE_CALENDAR_TIMEZONE || 'America/Toronto',
    /** Drive — separate from Calendar OAuth */
    signedConsentFolderId: process.env.GOOGLE_SIGNED_CONSENT_FOLDER_ID || '',
    consentTemplateFolderId: process.env.GOOGLE_CONSENT_TEMPLATE_FOLDER_ID || '',
  },
  inPersonLocation: process.env.COUNSELLING_IN_PERSON_LOCATION || '',
  crisisMessage:
    process.env.COUNSELLING_CRISIS_MESSAGE ||
    "LoveCry's online booking service is not an emergency or crisis service. If you are in immediate danger, call 911 or go to the nearest emergency department.",
};

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(
    counsellingEnv.google.clientId &&
      counsellingEnv.google.clientSecret &&
      counsellingEnv.google.redirectUri
  );
}

/** @deprecated prefer isGoogleOAuthConfigured + DB connection status */
export function isGoogleConfigured(): boolean {
  return isGoogleOAuthConfigured() && Boolean(counsellingEnv.google.counsellingCalendarId);
}
