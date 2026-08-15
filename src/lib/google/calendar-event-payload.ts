/**
 * Calendar event payload builder — kept pure for privacy tests.
 * No clinical/intake/trauma content is permitted.
 */

export function buildCounsellingCalendarEventPayload(input: {
  reference: string;
  startUtc: Date;
  endUtc: Date;
  timeZone: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  mode: string;
  consentStatus: string;
  createMeet?: boolean;
  conferenceRequestId?: string;
}) {
  const description = [
    `Booking reference: ${input.reference}`,
    `Client name: ${input.clientName}`,
    `Client email: ${input.clientEmail}`,
    `Client phone: ${input.clientPhone}`,
    `Consent status: ${input.consentStatus}`,
    `Mode: ${input.mode}`,
  ].join('\n');

  const requestBody: Record<string, unknown> = {
    summary: 'LoveCry Counselling Appointment',
    description,
    start: { dateTime: input.startUtc.toISOString(), timeZone: input.timeZone },
    end: { dateTime: input.endUtc.toISOString(), timeZone: input.timeZone },
    visibility: 'private',
    guestsCanInviteOthers: false,
    guestsCanModify: false,
    guestsCanSeeOtherGuests: false,
  };

  if (input.createMeet) {
    requestBody.conferenceData = {
      createRequest: {
        requestId: input.conferenceRequestId || `lc-${input.reference}`.slice(0, 64),
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    };
  }

  return {
    summary: requestBody.summary as string,
    description,
    requestBody,
    conferenceDataVersion: input.createMeet ? 1 : 0,
  };
}

export function assertCalendarPayloadPrivacy(description: string): void {
  if (/trauma|diagnos|intake|medical|counselling notes|consent answer/i.test(description)) {
    throw new Error('Calendar payload contains forbidden clinical content');
  }
}
