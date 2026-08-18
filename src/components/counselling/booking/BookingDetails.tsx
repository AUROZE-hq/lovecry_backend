'use client';

import {
  counsellorNameWithoutCredentials,
  formatClockTime,
  formatCompactClockTime,
  formatCredentialLine,
  formatDisplayTimeRange,
  formatServiceLabel,
  formatYmdLong,
  formatYmdShort,
} from '@/lib/counselling/display';
import { orgInfo } from '@/lib/org-info';
import type {
  AppointmentMode,
  BookingBootstrap,
  BookingService,
  ContactDetails,
  FieldErrors,
  TimeSlot,
} from './types';

const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f1328b]';

const MODES: { value: AppointmentMode; label: string }[] = [
  { value: 'IN_PERSON', label: 'In Person' },
  { value: 'VIRTUAL', label: 'Virtual' },
  { value: 'PHONE', label: 'Phone' },
];

type Props = {
  boot: BookingBootstrap;
  service: BookingService | null;
  selectedDate: string;
  slot: TimeSlot;
  mode: AppointmentMode;
  onModeChange: (mode: AppointmentMode) => void;
  contact: ContactDetails;
  onContactChange: (patch: Partial<ContactDetails>) => void;
  termsAccepted: boolean;
  onTermsChange: (next: boolean) => void;
  fieldErrors: FieldErrors;
  error: string | null;
  busy: boolean;
  holdSecondsLeft: number | null;
  onChangeTime: () => void;
  onConfirm: () => void;
};

export default function BookingDetails({
  boot,
  service,
  selectedDate,
  slot,
  mode,
  onModeChange,
  contact,
  onContactChange,
  termsAccepted,
  onTermsChange,
  fieldErrors,
  error,
  busy,
  holdSecondsLeft,
  onChangeTime,
  onConfirm,
}: Props) {
  const duration = service?.durationMinutes || boot.settings.durationMinutes;
  const counsellor = boot.counsellor.displayName;
  const credentials = formatCredentialLine(orgInfo.ceoCredentials);
  const timeRange = formatDisplayTimeRange(slot.startTimeUtc, slot.endTimeUtc, boot.settings.timeZone);
  const compactRange = `${formatCompactClockTime(slot.startTimeUtc, boot.settings.timeZone)}–${formatClockTime(slot.endTimeUtc, boot.settings.timeZone)}`;
  const serviceLabel = formatServiceLabel(service?.name || 'individual counselling').toLowerCase();

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <section className="site-header-gradient relative hidden overflow-hidden px-6 pb-14 pt-[calc(var(--site-header-height)+2.5rem)] lg:block">
        <div className="relative mx-auto max-w-6xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/90">Your appointment</p>
          <h1 className="font-hero mt-3 text-5xl font-bold tracking-tight lg:text-6xl">Almost done.</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/90">
            Confirm how you want to meet and add your contact details.
          </p>
        </div>
      </section>

      <section className="px-4 pb-24 pt-[calc(var(--site-header-height)+1.5rem)] lg:px-6 lg:pt-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 lg:hidden">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f1328b]">
              Your appointment
            </p>
            <h1 className="font-hero mt-2 text-3xl font-bold tracking-tight">
              {formatYmdShort(selectedDate)} • {compactRange}
            </h1>
            <p className="mt-2 text-sm text-white/55">
              {counsellor} • {duration} minutes
            </p>
            <button
              type="button"
              onClick={onChangeTime}
              className={`mt-3 text-sm font-semibold text-white/55 underline-offset-4 hover:text-white hover:underline ${FOCUS}`}
            >
              Change time
            </button>
          </div>

          {error && (
            <p
              role="alert"
              className="mb-4 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100"
            >
              {error}
            </p>
          )}

          {holdSecondsLeft != null && holdSecondsLeft < 60 && (
            <p role="status" className="mb-4 text-sm text-amber-200">
              Your selected time expires in {holdSecondsLeft}s.
            </p>
          )}

          <div className="lg:grid lg:grid-cols-[minmax(240px,0.32fr)_minmax(0,0.68fr)] lg:items-start lg:gap-6">
            <aside className="mb-6 hidden rounded-[20px] border border-white/[0.08] bg-[#0c0a12] p-6 lg:mb-0 lg:block">
              <p className="text-sm text-white/70">{formatYmdLong(selectedDate)}</p>
              <p className="font-hero mt-2 text-2xl font-bold tracking-tight">{timeRange}</p>
              <p className="mt-2 text-sm text-white/45">
                {duration}-minute {serviceLabel}
              </p>
              <div className="my-5 h-px bg-white/10" />
              <p className="font-semibold text-white">{counsellor}</p>
              <p className="mt-1 text-sm text-white/45">{credentials.replace(' · Counsellor', '')}</p>
              {mode === 'IN_PERSON' && (
                <p className="mt-3 text-sm leading-relaxed text-white/45">
                  {boot.settings.inPersonLocation}
                </p>
              )}
              {mode === 'VIRTUAL' && (
                <p className="mt-3 text-sm text-white/45">Virtual session details will be sent after booking.</p>
              )}
              {mode === 'PHONE' && (
                <p className="mt-3 text-sm text-white/45">Your counsellor will call the number you provide.</p>
              )}
              <button
                type="button"
                onClick={onChangeTime}
                className={`mt-6 w-full rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-white/30 ${FOCUS}`}
              >
                Change time
              </button>
            </aside>

            <div className="rounded-[20px] border border-white/[0.08] bg-[#0c0a12] p-5 sm:p-6">
              <h2 className="font-hero text-lg font-bold sm:text-xl">How would you like to meet?</h2>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {MODES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={mode === option.value}
                    onClick={() => onModeChange(option.value)}
                    className={`rounded-xl px-2 py-2.5 text-center text-sm font-semibold transition ${FOCUS} ${
                      mode === option.value
                        ? 'bg-[#f1328b] text-white'
                        : 'border border-white/15 bg-transparent text-white/80 hover:border-white/30'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {mode === 'IN_PERSON' && (
                <p className="mt-3 text-sm text-white/45">
                  <span className="hidden lg:inline">
                    In-person sessions are held at LoveCry, {boot.settings.inPersonLocation}.
                  </span>
                  <span className="lg:hidden">{boot.settings.inPersonLocation}</span>
                </p>
              )}
              {mode === 'VIRTUAL' && (
                <p className="mt-3 text-sm text-white/45">
                  You will receive a private virtual meeting link after your appointment is confirmed.
                </p>
              )}
              {mode === 'PHONE' && (
                <p className="mt-3 text-sm text-white/45">
                  We will call you at the phone number you provide.
                </p>
              )}

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <Field
                  id="booking-first-name"
                  label="First name"
                  value={contact.firstName}
                  onChange={(value) => onContactChange({ firstName: value })}
                  placeholder="Your first name"
                  autoComplete="given-name"
                  error={fieldErrors.firstName}
                />
                <Field
                  id="booking-last-name"
                  label="Last name"
                  value={contact.lastName}
                  onChange={(value) => onContactChange({ lastName: value })}
                  placeholder="Your last name"
                  autoComplete="family-name"
                  error={fieldErrors.lastName}
                />
                <Field
                  id="booking-email"
                  label="Email"
                  type="email"
                  value={contact.email}
                  onChange={(value) => onContactChange({ email: value })}
                  placeholder="you@example.com"
                  autoComplete="email"
                  error={fieldErrors.email}
                />
                <Field
                  id="booking-phone"
                  label="Phone"
                  type="tel"
                  value={contact.phone}
                  onChange={(value) => onContactChange({ phone: value })}
                  placeholder="(416) 000-0000"
                  autoComplete="tel"
                  error={fieldErrors.phone}
                />
              </div>

              <div className="mt-5">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={termsAccepted}
                  aria-describedby={fieldErrors.terms ? 'booking-terms-error' : undefined}
                  onClick={() => onTermsChange(!termsAccepted)}
                  className={`flex w-full items-start gap-3 text-left ${FOCUS} rounded-lg`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border ${
                      termsAccepted ? 'border-[#f1328b] bg-[#f1328b]' : 'border-white/30 bg-transparent'
                    }`}
                    aria-hidden
                  >
                    {termsAccepted && (
                      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-none stroke-white stroke-[2.5]">
                        <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
                      </svg>
                    )}
                  </span>
                  <span className="text-sm text-white">
                    <span className="lg:hidden">I agree to counselling consent and privacy terms.</span>
                    <span className="hidden lg:inline">
                      I agree to LoveCry’s counselling consent and privacy terms.
                    </span>
                  </span>
                </button>
                {fieldErrors.terms && (
                  <p id="booking-terms-error" role="alert" className="mt-2 text-sm text-red-300">
                    {fieldErrors.terms}
                  </p>
                )}
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={onConfirm}
                className={`mt-6 w-full rounded-xl bg-[#f1328b] py-3.5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60 ${FOCUS}`}
              >
                {busy ? 'Confirming…' : 'Confirm appointment'}
              </button>
              <p className="mt-3 hidden text-xs text-white/35 lg:block">
                Booking as {counsellorNameWithoutCredentials(counsellor)}.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  autoComplete,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  autoComplete?: string;
  error?: string;
}) {
  return (
    <label className="block sm:col-span-1" htmlFor={id}>
      <span className="text-sm font-medium text-white">{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-2 w-full rounded-xl border bg-black/30 px-4 py-3 text-white outline-none placeholder:text-white/30 ${FOCUS} ${
          error ? 'border-red-400/60' : 'border-white/10'
        }`}
      />
      {error && (
        <span id={`${id}-error`} role="alert" className="mt-1.5 block text-sm text-red-300">
          {error}
        </span>
      )}
    </label>
  );
}
