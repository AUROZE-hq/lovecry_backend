'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import BookingConfirmation from './booking/BookingConfirmation';
import BookingDetails from './booking/BookingDetails';
import BookingSchedule from './booking/BookingSchedule';
import ConsentGate from './booking/ConsentGate';
import type {
  AppointmentMode,
  BookingBootstrap,
  BookingScreen,
  BookingService,
  BookingSummary,
  ContactDetails,
  FieldErrors,
  TimeSlot,
} from './booking/types';

function pickService(services: BookingService[]): BookingService | null {
  return services.find((service) => service.slug === 'individual-counselling') || services[0] || null;
}

function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `bk-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function digitCount(value: string): number {
  return value.replace(/\D/g, '').length;
}

export default function BookNowWizard() {
  const [screen, setScreen] = useState<BookingScreen>('SCHEDULE');
  const [boot, setBoot] = useState<BookingBootstrap | null>(null);
  const [service, setService] = useState<BookingService | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);

  const [dates, setDates] = useState<string[]>([]);
  const [datesLoading, setDatesLoading] = useState(true);
  const [viewYear, setViewYear] = useState(() => new Date().getUTCFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getUTCMonth() + 1);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [slot, setSlot] = useState<TimeSlot | null>(null);
  const [holdToken, setHoldToken] = useState<string | null>(null);
  const [holdExpires, setHoldExpires] = useState<string | null>(null);
  const [holding, setHolding] = useState(false);
  const [holdingStart, setHoldingStart] = useState<string | null>(null);

  const [mode, setMode] = useState<AppointmentMode>('IN_PERSON');
  const [contact, setContact] = useState<ContactDetails>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const [summary, setSummary] = useState<BookingSummary | null>(null);
  const [manageToken, setManageToken] = useState<string | null>(null);

  const [consentOpen, setConsentOpen] = useState(false);
  const [legalName, setLegalName] = useState('');
  const [drawn, setDrawn] = useState<string | null>(null);
  const [acks, setAcks] = useState<Record<string, boolean>>({});
  const [now, setNow] = useState(() => Date.now());
  const selectedDateRef = useRef('');

  const loadDates = useCallback(async (autoSelect: boolean) => {
    setDatesLoading(true);
    try {
      const res = await fetch('/api/public/counselling/availability');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load available dates.');
      const nextDates: string[] = data.dates || [];
      setDates(nextDates);
      if (autoSelect && nextDates.length) {
        const current = selectedDateRef.current;
        const pick = current && nextDates.includes(current) ? current : nextDates[0]!;
        setSelectedDate(pick);
        const [y, m] = pick.split('-').map(Number);
        if (y && m) {
          setViewYear(y);
          setViewMonth(m);
        }
      } else if (autoSelect) {
        setSelectedDate('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load available dates.');
    } finally {
      setDatesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch('/api/public/counselling/services')
      .then(async (res) => {
        const data = (await res.json()) as BookingBootstrap;
        if (!res.ok) throw new Error('Could not load booking services.');
        setBoot(data);
        setService(pickService(data.services));
      })
      .catch(() => setBootError('Could not load booking services. Please refresh and try again.'));
  }, []);

  useEffect(() => {
    selectedDateRef.current = selectedDate;
  }, [selectedDate]);

  useEffect(() => {
    if (!boot) return;
    void loadDates(true);
  }, [boot, loadDates]);

  useEffect(() => {
    if (!selectedDate) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
    fetch(`/api/public/counselling/availability?date=${selectedDate}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not load time slots.');
        if (!cancelled) setSlots(data.slots || []);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [screen]);

  const holdSecondsLeft =
    holdExpires && screen === 'DETAILS'
      ? Math.max(0, Math.floor((new Date(holdExpires).getTime() - now) / 1000))
      : null;

  useEffect(() => {
    if (screen !== 'DETAILS' || !holdExpires) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [screen, holdExpires]);

  useEffect(() => {
    if (screen !== 'DETAILS' || !holdExpires) return;
    if (new Date(holdExpires).getTime() > Date.now()) return;
    setError('Your selected time is no longer being held. Please choose a time again.');
    setHoldToken(null);
    setHoldExpires(null);
    setSlot(null);
    setConsentOpen(false);
    setScreen('SCHEDULE');
    void loadDates(false);
  }, [screen, holdExpires, now, loadDates]);

  async function selectSlot(nextSlot: TimeSlot) {
    if (!selectedDate) return;
    setHolding(true);
    setHoldingStart(nextSlot.startTimeUtc);
    setError(null);
    try {
      if (holdToken) {
        await fetch(`/api/public/counselling/holds?token=${encodeURIComponent(holdToken)}`, {
          method: 'DELETE',
        });
      }
      const res = await fetch('/api/public/counselling/holds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTimeUtc: nextSlot.startTimeUtc,
          endTimeUtc: nextSlot.endTimeUtc,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not hold this slot.');
        const refresh = await fetch(`/api/public/counselling/availability?date=${selectedDate}`);
        const refreshed = await refresh.json();
        setSlots(refreshed.slots || []);
        return;
      }
      setSlot(nextSlot);
      setHoldToken(data.holdToken);
      setHoldExpires(data.expiresAt);
      setNow(Date.now());
      setIdempotencyKey(newIdempotencyKey());
      setScreen('DETAILS');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setHolding(false);
      setHoldingStart(null);
    }
  }

  function changeTime() {
    const token = holdToken;
    setHoldToken(null);
    setHoldExpires(null);
    setSlot(null);
    setConsentOpen(false);
    setError(null);
    setFieldErrors({});
    setScreen('SCHEDULE');
    if (token) {
      void fetch(`/api/public/counselling/holds?token=${encodeURIComponent(token)}`, { method: 'DELETE' });
    }
    void loadDates(false);
  }

  function validateDetails(): boolean {
    const nextErrors: FieldErrors = {};
    if (!contact.firstName.trim()) nextErrors.firstName = 'First name is required.';
    if (!contact.lastName.trim()) nextErrors.lastName = 'Last name is required.';
    if (!contact.email.trim() || !isValidEmail(contact.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!contact.phone.trim() || digitCount(contact.phone) < 7 || contact.phone.trim().length > 30) {
      nextErrors.phone = 'Enter a valid phone number.';
    }
    if (!termsAccepted) {
      nextErrors.terms = 'Please agree to the counselling consent and privacy terms to continue.';
    }
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function submitBooking(signature?: {
    legalName: string;
    method: 'DRAWN' | 'TYPED' | 'DRAWN_AND_TYPED';
    signatureDataUrl?: string;
    acknowledgements: string[];
  }) {
    if (!boot || !service || !slot || !holdToken) {
      setError('Your selected time is no longer being held. Please choose a time again.');
      setScreen('SCHEDULE');
      return;
    }

    if (holdExpires && new Date(holdExpires).getTime() <= Date.now()) {
      setError('Your selected time is no longer being held. Please choose a time again.');
      setHoldToken(null);
      setSlot(null);
      setScreen('SCHEDULE');
      void loadDates(true);
      return;
    }

    if (signature) {
      if (!signature.legalName || signature.acknowledgements.length < 3) {
        setError('Please complete your legal name and all consent acknowledgements.');
        return;
      }
    }

    setBusy(true);
    setError(null);
    try {
      const key = idempotencyKey || newIdempotencyKey();
      if (!idempotencyKey) setIdempotencyKey(key);
      const res = await fetch('/api/public/counselling/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': key,
        },
        body: JSON.stringify({
          holdToken,
          serviceId: service.id,
          appointmentMode: mode,
          idempotencyKey: key,
          client: {
            firstName: contact.firstName.trim(),
            lastName: contact.lastName.trim(),
            email: contact.email.trim(),
            phone: contact.phone.trim(),
            preferredContactMethod: 'EMAIL',
            preferredLanguage: 'English',
            safeToLeaveVoicemail: false,
            safeToSendEmail: true,
          },
          intakeAnswers: {},
          signature,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const message = data.error || 'Booking failed.';
        setError(message);
        if (data.code === 'VALIDATION' && /hold expired/i.test(message)) {
          setHoldToken(null);
          setHoldExpires(null);
          setSlot(null);
          setConsentOpen(false);
          setScreen('SCHEDULE');
          void loadDates(true);
        }
        return;
      }
      setSummary(data.summary);
      setManageToken(data.manageToken || null);
      setConsentOpen(false);
      setScreen('CONFIRMED');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  function onConfirm() {
    if (!validateDetails()) return;
    if (!boot) return;
    if (boot.settings.consentRequiredBeforeConfirm) {
      setLegalName(`${contact.firstName} ${contact.lastName}`.trim());
      setError(null);
      setConsentOpen(true);
      return;
    }
    void submitBooking();
  }

  if (bootError) {
    return (
      <div className="min-h-screen bg-[#050505] px-4 pt-[calc(var(--site-header-height)+3rem)] text-white">
        <div className="mx-auto max-w-xl rounded-[20px] border border-red-400/30 bg-red-500/10 p-6">
          <h1 className="font-hero text-2xl font-bold">Booking unavailable</h1>
          <p className="mt-3 text-sm text-red-100" role="alert">
            {bootError}
          </p>
        </div>
      </div>
    );
  }

  if (!boot) {
    return (
      <div className="min-h-screen bg-[#050505] text-white">
        <div className="site-header-gradient h-48 pt-[var(--site-header-height)]" />
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="h-[420px] animate-pulse rounded-[20px] border border-white/10 bg-white/5" />
          <p className="mt-4 text-sm text-white/45">Loading booking…</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-[#050505] px-4 pt-[calc(var(--site-header-height)+3rem)] text-white">
        <p role="alert">No active counselling services are available right now.</p>
      </div>
    );
  }

  return (
    <>
      {screen === 'SCHEDULE' && (
        <BookingSchedule
          boot={boot}
          service={service}
          dates={dates}
          datesLoading={datesLoading}
          viewYear={viewYear}
          viewMonth={viewMonth}
          onViewMonthChange={(year, month) => {
            setViewYear(year);
            setViewMonth(month);
          }}
          selectedDate={selectedDate}
          onSelectDate={(ymd) => {
            setError(null);
            setSelectedDate(ymd);
          }}
          slots={slots}
          slotsLoading={slotsLoading}
          holding={holding}
          holdingStart={holdingStart}
          error={error}
          onSelectSlot={selectSlot}
        />
      )}

      {screen === 'DETAILS' && slot && (
        <BookingDetails
          boot={boot}
          service={service}
          selectedDate={selectedDate}
          slot={slot}
          mode={mode}
          onModeChange={setMode}
          contact={contact}
          onContactChange={(patch) => {
            setContact((prev) => ({ ...prev, ...patch }));
            setFieldErrors((prev) => {
              const next = { ...prev };
              for (const key of Object.keys(patch) as (keyof ContactDetails)[]) {
                delete next[key];
              }
              return next;
            });
          }}
          termsAccepted={termsAccepted}
          onTermsChange={(next) => {
            setTermsAccepted(next);
            if (next) {
              setFieldErrors((prev) => {
                const copy = { ...prev };
                delete copy.terms;
                return copy;
              });
            }
          }}
          fieldErrors={fieldErrors}
          error={error}
          busy={busy}
          holdSecondsLeft={holdSecondsLeft}
          onChangeTime={changeTime}
          onConfirm={onConfirm}
        />
      )}

      {screen === 'CONFIRMED' && summary && (
        <BookingConfirmation summary={summary} manageToken={manageToken} />
      )}

      {consentOpen && (
        <ConsentGate
          boot={boot}
          legalName={legalName}
          onLegalNameChange={setLegalName}
          drawn={drawn}
          onDrawnChange={setDrawn}
          acks={acks}
          onAcksChange={setAcks}
          error={error}
          busy={busy}
          onClose={() => {
            if (!busy) setConsentOpen(false);
          }}
          onSubmit={(signature) => {
            void submitBooking(signature);
          }}
        />
      )}
    </>
  );
}
