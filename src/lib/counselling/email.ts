import { donationEnv } from '@/lib/config/env';
import { deliverEmail } from '@/lib/email/send';
import type { AppointmentRecord, DeliveryStatus } from './types';
import { formatInTz } from './time-zone';
import { getCounsellor, getSettings } from './store';

type EmailKind =
  | 'booking_confirmation'
  | 'consent_required'
  | 'consent_signed'
  | 'cancelled'
  | 'rescheduled'
  | 'appointment_reminder';

export async function deliverCounsellingEmail(input: {
  kind: EmailKind;
  appointment: AppointmentRecord;
  manageToken?: string;
  consentToken?: string;
}): Promise<DeliveryStatus> {
  const { appointment: a } = input;
  if (!a.client.safeToSendEmail && input.kind !== 'booking_confirmation') {
    return 'SKIPPED';
  }

  const settings = await getSettings();
  const counsellor = await getCounsellor();
  const site = donationEnv.siteUrl;
  const when = `${formatInTz(a.startTimeUtc, { dateStyle: 'full', timeStyle: 'short' }, a.timeZone)} (${a.timeZone})`;
  const manageUrl = input.manageToken
    ? `${site}/bookings/manage/${input.manageToken}`
    : `${site}/bookings/manage`;
  const consentUrl = input.consentToken ? `${site}/consent/sign/${input.consentToken}` : '';
  const crisis = settings.crisisMessage;

  const subjects: Record<EmailKind, string> = {
    booking_confirmation: `LoveCry booking confirmed — ${a.referenceNumber}`,
    consent_required: 'Action required: Sign your LoveCry counselling consent form',
    consent_signed: `Consent received — ${a.referenceNumber}`,
    cancelled: `Appointment cancelled — ${a.referenceNumber}`,
    rescheduled: `Appointment rescheduled — ${a.referenceNumber}`,
    appointment_reminder: `Reminder: LoveCry appointment — ${a.referenceNumber}`,
  };

  const bodies: Record<EmailKind, string> = {
    booking_confirmation: [
      `Hi ${a.client.firstName},`,
      '',
      'Your LoveCry counselling appointment is confirmed.',
      `Reference: ${a.referenceNumber}`,
      `When: ${when}`,
      `Type: ${a.appointmentMode}`,
      `Counsellor: ${counsellor.displayName}`,
      a.location ? `Location / access: ${a.location}` : '',
      a.googleMeetUrl ? `Meet link: ${a.googleMeetUrl}` : '',
      `Consent status: ${a.consentStatus}`,
      '',
      consentUrl && a.consentStatus !== 'SIGNED' ? `Sign consent: ${consentUrl}` : '',
      input.manageToken ? `Manage / reschedule / cancel: ${manageUrl}` : '',
      '',
      crisis,
      '',
      'LoveCry — https://www.lovecry.ca',
    ]
      .filter(Boolean)
      .join('\n'),
    consent_required: [
      `Hi ${a.client.firstName},`,
      '',
      'Please sign your counselling consent form before your appointment.',
      `Appointment: ${when}`,
      `Reference: ${a.referenceNumber}`,
      `Deadline: at least ${settings.consentDeadlineHours} hours before the appointment.`,
      '',
      `Sign here: ${consentUrl}`,
      '',
      crisis,
    ].join('\n'),
    consent_signed: [
      `Hi ${a.client.firstName},`,
      '',
      'We received your signed consent form.',
      `Reference: ${a.referenceNumber}`,
      'The document has been stored securely by LoveCry.',
      '',
      crisis,
    ].join('\n'),
    cancelled: [
      `Hi ${a.client.firstName},`,
      '',
      'Your LoveCry counselling appointment has been cancelled.',
      `Reference: ${a.referenceNumber}`,
      `Was scheduled: ${when}`,
      '',
      'If you need a new appointment, visit https://www.lovecry.ca/book-now',
    ].join('\n'),
    rescheduled: [
      `Hi ${a.client.firstName},`,
      '',
      'Your appointment has been rescheduled.',
      `Reference: ${a.referenceNumber}`,
      `New time: ${when}`,
      input.manageToken ? `Manage: ${manageUrl}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
    appointment_reminder: [
      `Hi ${a.client.firstName},`,
      '',
      `Reminder: your LoveCry appointment is coming up.`,
      `Reference: ${a.referenceNumber}`,
      `When: ${when}`,
      a.googleMeetUrl ? `Meet: ${a.googleMeetUrl}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
  };

  const text = bodies[input.kind];
  const html = `<pre style="font-family:system-ui,sans-serif;white-space:pre-wrap">${text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')}</pre>`;

  return deliverEmail({
    to: a.client.email,
    subject: subjects[input.kind],
    html,
    text,
  });
}
