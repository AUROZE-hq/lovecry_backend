'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import {
  appointmentModeLabel,
  buildGoogleCalendarUrl,
  counsellorFirstName,
  counsellorNameWithoutCredentials,
} from '@/lib/counselling/display';
import { orgInfo } from '@/lib/org-info';
import type { BookingSummary } from './types';

const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f1328b]';

type Props = {
  summary: BookingSummary;
  manageToken: string | null;
};

export default function BookingConfirmation({ summary, manageToken }: Props) {
  const firstName = summary.counsellorFirstName || counsellorFirstName(summary.counsellorName);
  const shortName = counsellorNameWithoutCredentials(summary.counsellorName);
  const timeRange = summary.displayTimeRange || `${summary.displayTime}`;
  const dateUpper = summary.displayDateUpper || summary.displayDate.toUpperCase();
  const modeLabel = appointmentModeLabel(summary.appointmentMode);
  const locationLine = confirmationLocation(summary);
  const calendarHref = calendarLink(summary, shortName);

  return (
    <div className="min-h-screen bg-[#050505] px-4 pb-24 pt-[calc(var(--site-header-height)+2.75rem)] text-white lg:px-6">
      <div className="mx-auto max-w-xl text-center">
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#3ecf8e] text-white"
          aria-hidden
        >
          <Check className="h-8 w-8" strokeWidth={2.75} />
        </div>
        <h1 className="font-hero mt-6 text-4xl font-bold tracking-tight sm:text-5xl">You’re booked.</h1>
        <p className="mt-3 text-base text-white/55">
          Your counselling session with {shortName} has been scheduled.
        </p>

        <div className="mt-8 rounded-[20px] border border-white/[0.08] bg-[#0c0a12] p-5 text-left sm:p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#f1328b]">{dateUpper}</p>
          <p className="font-hero mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{timeRange}</p>
          <p className="mt-3 text-white">{summary.counsellorName}</p>
          <p className="mt-1 text-sm text-white/45">
            {modeLabel} · {summary.durationMinutes} minutes
          </p>
          <div className="my-5 h-px bg-white/10" />
          <p className="text-white">{orgInfo.shortName}</p>
          <p className="mt-1 text-sm leading-relaxed text-white/45">{locationLine}</p>
          {calendarHref ? (
            <a
              href={calendarHref}
              target="_blank"
              rel="noreferrer"
              className={`mt-6 flex w-full items-center justify-center rounded-xl bg-[#f1328b] py-3.5 text-sm font-bold text-white transition hover:brightness-110 ${FOCUS}`}
            >
              Add to Google Calendar
            </a>
          ) : (
            <p className="mt-6 text-sm text-red-200">Calendar times were unavailable for this booking.</p>
          )}
        </div>

        <div className="mt-4 rounded-[20px] border border-white/[0.08] bg-[#0c0a12] p-5 text-left sm:p-6">
          <h2 className="font-hero text-lg font-bold">First time meeting with {firstName}?</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/50">
            Complete a short confidential intake form now, or use the link in your confirmation email.
          </p>
          {manageToken ? (
            <Link
              href={`/bookings/intake/${manageToken}`}
              className={`mt-5 flex w-full items-center justify-center rounded-xl border border-white/15 py-3 text-sm font-semibold text-white transition hover:border-white/30 ${FOCUS}`}
            >
              Complete intake · ~3 min
            </Link>
          ) : (
            <p className="mt-4 text-sm text-white/45">Check your confirmation email for the intake link.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function confirmationLocation(summary: BookingSummary): string {
  if (summary.appointmentMode === 'VIRTUAL') {
    return summary.googleMeetUrl || summary.location || 'Virtual session details will arrive by email.';
  }
  if (summary.appointmentMode === 'PHONE') {
    return summary.location || 'Phone appointment';
  }
  return summary.location || orgInfo.address;
}

function calendarLink(summary: BookingSummary, counsellorName: string): string | null {
  if (!summary.startTimeUtc || !summary.endTimeUtc) return null;
  const mode = appointmentModeLabel(summary.appointmentMode);
  const location =
    summary.appointmentMode === 'VIRTUAL'
      ? summary.googleMeetUrl || 'Virtual counselling session'
      : summary.location;
  return buildGoogleCalendarUrl({
    title: `LoveCry counselling with ${counsellorName}`,
    startTimeUtc: summary.startTimeUtc,
    endTimeUtc: summary.endTimeUtc,
    details: [
      'LoveCry counselling appointment',
      `Counsellor: ${summary.counsellorName}`,
      `Format: ${mode}`,
      `Reference: ${summary.referenceNumber}`,
    ].join('\n'),
    location,
  });
}
