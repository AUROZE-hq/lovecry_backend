import { NextResponse } from 'next/server';
import { listServices, getSettings, getCounsellor, getActiveConsentTemplate } from '@/lib/counselling/store';
import { getGoogleStatus } from '@/lib/google/calendar';

export async function GET() {
  const [services, settings, counsellor, template] = await Promise.all([
    listServices(),
    getSettings(),
    getCounsellor(),
    getActiveConsentTemplate(),
  ]);

  return NextResponse.json({
    services,
    settings: {
      timeZone: settings.timeZone,
      durationMinutes: settings.durationMinutes,
      consentRequiredBeforeConfirm: settings.consentRequiredBeforeConfirm,
      consentDeadlineHours: settings.consentDeadlineHours,
      crisisMessage: settings.crisisMessage,
      inPersonLocation: settings.inPersonLocation,
      googleMeetEnabled: settings.googleMeetEnabled,
      holdMinutes: settings.holdMinutes,
    },
    counsellor: {
      displayName: counsellor.displayName,
    },
    consent: template
      ? {
          id: template.id,
          title: template.title,
          version: template.version,
          bodyText: template.bodyText,
        }
      : null,
    google: getGoogleStatus(),
  });
}
