import type { AppointmentMode } from '@/lib/counselling/types';

export type BookingScreen = 'SCHEDULE' | 'DETAILS' | 'CONFIRMED';

export type BookingService = {
  id: string;
  name: string;
  slug: string;
  description: string;
  durationMinutes: number;
};

export type TimeSlot = {
  startTimeUtc: string;
  endTimeUtc: string;
  label: string;
};

export type BookingSummary = {
  referenceNumber: string;
  displayDate: string;
  displayTime: string;
  displayEndTime?: string;
  displayTimeRange?: string;
  displayWeekdayDate?: string;
  displayWeekdayDateShort?: string;
  displayDateUpper?: string;
  timeZone: string;
  durationMinutes: number;
  appointmentMode: string;
  counsellorName: string;
  counsellorFirstName?: string;
  location?: string;
  googleMeetUrl?: string | null;
  consentStatus: string;
  managePath?: string;
  consentPath?: string;
  intakePath?: string;
  crisisMessage: string;
  startTimeUtc: string;
  endTimeUtc: string;
};

export type BookingBootstrap = {
  services: BookingService[];
  settings: {
    timeZone: string;
    durationMinutes: number;
    consentRequiredBeforeConfirm: boolean;
    consentDeadlineHours: number;
    crisisMessage: string;
    inPersonLocation: string;
    holdMinutes: number;
    googleMeetEnabled?: boolean;
  };
  counsellor: { displayName: string };
  consent: { id: string; title: string; version: string; bodyText: string } | null;
  google: { configured: boolean; message: string };
};

export type ContactDetails = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export type FieldErrors = Partial<Record<'firstName' | 'lastName' | 'email' | 'phone' | 'terms', string>>;

export type { AppointmentMode };
