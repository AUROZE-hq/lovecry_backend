'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  FileText,
  Layers,
  Monitor,
  User,
} from 'lucide-react';
import ConsentDocumentViewer from '@/components/consent/ConsentDocumentViewer';
import ConsentCheckboxes, { acknowledgementLabels } from '@/components/consent/ConsentCheckboxes';
import SignaturePad from '@/components/consent/SignaturePad';
import TypedSignature from '@/components/consent/TypedSignature';

type Service = { id: string; name: string; slug: string; description: string; durationMinutes: number };
type Slot = { startTimeUtc: string; endTimeUtc: string; label: string };
type Summary = {
  referenceNumber: string;
  displayDate: string;
  displayTime: string;
  timeZone: string;
  durationMinutes: number;
  appointmentMode: string;
  counsellorName: string;
  location?: string;
  consentStatus: string;
  managePath?: string;
  consentPath?: string;
  crisisMessage: string;
};

type Bootstrap = {
  services: Service[];
  settings: {
    timeZone: string;
    durationMinutes: number;
    consentRequiredBeforeConfirm: boolean;
    consentDeadlineHours: number;
    crisisMessage: string;
    inPersonLocation: string;
    holdMinutes: number;
  };
  counsellor: { displayName: string };
  consent: { id: string; title: string; version: string; bodyText: string } | null;
  google: { configured: boolean; message: string };
};

const STEPS = [
  'Service',
  'Format',
  'Date',
  'Time',
  'Details',
  'Intake',
  'Consent',
  'Confirm',
] as const;

const stepIcons = [Layers, Monitor, Calendar, Clock, User, ClipboardList, FileText, CheckCircle2] as const;

const primaryBtn =
  'rounded-full bg-gradient-to-r from-[#693492] to-[#f1328b] px-6 py-2.5 text-sm font-bold text-white shadow-[0_10px_30px_rgba(241,50,139,0.25)] transition hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f1328b] disabled:opacity-50';
const ghostBtn = 'text-sm font-semibold text-white/55 transition hover:text-white';
const optionCard = (active: boolean) =>
  `w-full rounded-2xl border px-5 py-4 text-left transition ${
    active
      ? 'border-[#f1328b]/60 bg-gradient-to-br from-[#f1328b]/15 to-[#693492]/10 shadow-[0_0_30px_rgba(241,50,139,0.12)]'
      : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.05]'
  }`;

export default function BookNowWizard() {
  const [boot, setBoot] = useState<Bootstrap | null>(null);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [serviceId, setServiceId] = useState('');
  const [mode, setMode] = useState<'VIRTUAL' | 'PHONE' | 'IN_PERSON'>('VIRTUAL');
  const [dates, setDates] = useState<string[]>([]);
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [holdToken, setHoldToken] = useState<string | null>(null);
  const [holdExpires, setHoldExpires] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredContact, setPreferredContact] = useState<'EMAIL' | 'PHONE' | 'SMS'>('EMAIL');
  const [language, setLanguage] = useState('English');
  const [safeVm, setSafeVm] = useState(false);
  const [safeEmail, setSafeEmail] = useState(true);
  const [access, setAccess] = useState('');
  const [emName, setEmName] = useState('');
  const [emPhone, setEmPhone] = useState('');
  const [emRel, setEmRel] = useState('');
  const [referral, setReferral] = useState('');
  const [firstSession, setFirstSession] = useState(true);
  const [notes, setNotes] = useState('');

  const [supportWith, setSupportWith] = useState('');
  const [interpreter, setInterpreter] = useState(false);

  const [signNow, setSignNow] = useState(false);
  const [legalName, setLegalName] = useState('');
  const [drawn, setDrawn] = useState<string | null>(null);
  const [acks, setAcks] = useState<Record<string, boolean>>({});
  const [summary, setSummary] = useState<Summary | null>(null);
  const [manageToken, setManageToken] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/public/counselling/services')
      .then((r) => r.json())
      .then((data: Bootstrap) => {
        setBoot(data);
        if (data.services[0]) setServiceId(data.services[0].id);
      })
      .catch(() => setError('Could not load booking services.'));
  }, []);

  useEffect(() => {
    if (step === 2) {
      fetch('/api/public/counselling/availability')
        .then((r) => r.json())
        .then((d) => setDates(d.dates || []))
        .catch(() => setError('Could not load available dates.'));
    }
  }, [step]);

  useEffect(() => {
    if (step === 3 && date) {
      fetch(`/api/public/counselling/availability?date=${date}`)
        .then((r) => r.json())
        .then((d) => setSlots(d.slots || []))
        .catch(() => setError('Could not load time slots.'));
    }
  }, [step, date]);

  const holdSecondsLeft = useMemo(() => {
    if (!holdExpires) return null;
    return Math.max(0, Math.floor((new Date(holdExpires).getTime() - Date.now()) / 1000));
  }, [holdExpires, step, busy]);

  async function selectSlot(s: Slot) {
    setBusy(true);
    setError(null);
    if (holdToken) {
      await fetch(`/api/public/counselling/holds?token=${encodeURIComponent(holdToken)}`, {
        method: 'DELETE',
      });
    }
    const res = await fetch('/api/public/counselling/holds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startTimeUtc: s.startTimeUtc, endTimeUtc: s.endTimeUtc }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || 'Could not hold this slot.');
      return;
    }
    setSlot(s);
    setHoldToken(data.holdToken);
    setHoldExpires(data.expiresAt);
    setStep(4);
  }

  async function submitBooking() {
    if (!holdToken || !boot) return;
    setBusy(true);
    setError(null);

    const signature =
      signNow || boot.settings.consentRequiredBeforeConfirm
        ? {
            legalName: legalName.trim(),
            method: drawn ? ('DRAWN_AND_TYPED' as const) : ('TYPED' as const),
            signatureDataUrl: drawn || undefined,
            acknowledgements: acknowledgementLabels(acks),
          }
        : undefined;

    if (signature) {
      if (!signature.legalName || signature.acknowledgements.length < 3) {
        setBusy(false);
        setError('Please complete legal name and all consent checkboxes to sign now.');
        return;
      }
    }

    const res = await fetch('/api/public/counselling/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        holdToken,
        serviceId,
        appointmentMode: mode,
        client: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          preferredContactMethod: preferredContact,
          preferredLanguage: language,
          safeToLeaveVoicemail: safeVm,
          safeToSendEmail: safeEmail,
          accessibilityRequirements: access || undefined,
          emergencyContactName: emName || undefined,
          emergencyContactPhone: emPhone || undefined,
          emergencyRelationship: emRel || undefined,
          referralSource: referral || undefined,
          firstSession,
        },
        intakeAnswers: {
          supportWith,
          interpreter,
          firstSession,
          accessibility: access,
        },
        clientNotes: notes || undefined,
        signature,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || 'Booking failed.');
      return;
    }
    setSummary(data.summary);
    setManageToken(data.manageToken);
    setStep(7);
  }

  function nextFromDetails() {
    if (!firstName || !lastName || !email || !phone) {
      setError('First name, last name, email and phone are required.');
      return;
    }
    setError(null);
    setStep(5);
  }

  function nextFromIntake() {
    if (!supportWith.trim()) {
      setError('Please tell us what you would like support with.');
      return;
    }
    setError(null);
    setLegalName(`${firstName} ${lastName}`.trim());
    setStep(6);
  }

  if (!boot) {
    return (
      <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-8 shadow-2xl backdrop-blur-xl">
        <div className="animate-pulse space-y-4">
          <div className="h-2 w-1/3 rounded-full bg-white/10" />
          <div className="h-10 rounded-2xl bg-white/10" />
          <div className="h-32 rounded-2xl bg-white/10" />
        </div>
        <p className="mt-6 text-sm text-white/50">Loading booking…</p>
      </div>
    );
  }

  const StepIcon = stepIcons[step] ?? Layers;
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <div className="border-b border-white/10 bg-black/20 px-5 py-5 sm:px-8 sm:py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#f1328b]">
              Step {step + 1} of {STEPS.length}
            </p>
            <p className="mt-1 text-lg font-black text-white sm:text-xl">{STEPS[step]}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[#f1328b]">
            <StepIcon className="h-5 w-5" aria-hidden />
          </div>
        </div>

        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#693492] via-[#bd338e] to-[#f1328b] transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={step + 1}
            aria-valuemin={1}
            aria-valuemax={STEPS.length}
            aria-label={`Booking progress: step ${step + 1} of ${STEPS.length}`}
          />
        </div>

        <ol className="mt-4 hidden gap-2 lg:flex" aria-label="Booking steps">
          {STEPS.map((label, i) => (
            <li
              key={label}
              className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                i === step
                  ? 'bg-[#f1328b] text-white'
                  : i < step
                    ? 'bg-white/15 text-white/80'
                    : 'bg-white/5 text-white/35'
              }`}
            >
              {label}
            </li>
          ))}
        </ol>
      </div>

      <div className="p-5 sm:p-8">

      {!boot.google.configured && (
        <p className="mb-5 rounded-xl border border-amber-300/25 bg-amber-400/10 px-4 py-3 text-xs leading-relaxed text-amber-50/90">
          Google Calendar sync will activate when Workspace credentials are added. Bookings still
          work securely on LoveCry.ca.
        </p>
      )}

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100"
        >
          {error}
        </div>
      )}

      {holdToken && step >= 4 && step < 7 && holdExpires && (
        <p className="mb-4 text-xs text-white/45">
          Slot held for ~{boot.settings.holdMinutes} minutes
          {holdSecondsLeft != null ? ` (${Math.floor(holdSecondsLeft / 60)}m left)` : ''}.
        </p>
      )}

      {step === 0 && (
        <section>
          <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Choose a service</h2>
          <p className="mt-2 text-sm text-white/55">Select the counselling service that fits your needs.</p>
          <div className="mt-6 space-y-3">
            {boot.services.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setServiceId(s.id);
                  setStep(1);
                }}
                className={`group ${optionCard(serviceId === s.id)}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold text-white">{s.name}</p>
                    <p className="mt-1 text-sm leading-relaxed text-white/55">{s.description}</p>
                    <p className="mt-3 inline-flex rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/45">
                      {s.durationMinutes} minutes
                    </p>
                  </div>
                  <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-white/30 transition group-hover:translate-x-0.5 group-hover:text-[#f1328b]" />
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 1 && (
        <section>
          <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Appointment format</h2>
          <p className="mt-2 text-sm text-white/55">Choose how you would like to meet with your counsellor.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {(
              [
                ['VIRTUAL', 'Virtual', Monitor],
                ['PHONE', 'Phone', Clock],
                ['IN_PERSON', 'In person', Calendar],
              ] as const
            ).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={`flex flex-col items-center gap-3 rounded-2xl border px-4 py-6 text-sm font-bold transition ${
                  mode === value
                    ? 'border-[#693492]/70 bg-gradient-to-br from-[#693492]/30 to-[#f1328b]/10 text-white shadow-[0_0_24px_rgba(105,52,146,0.2)]'
                    : 'border-white/10 bg-white/[0.03] text-white/70 hover:border-white/25'
                }`}
              >
                <Icon className="h-6 w-6 text-[#f1328b]" aria-hidden />
                {label}
              </button>
            ))}
          </div>
          {mode === 'IN_PERSON' && (
            <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/55">
              {boot.settings.inPersonLocation}
            </p>
          )}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button type="button" className={ghostBtn} onClick={() => setStep(0)}>
              Back
            </button>
            <button type="button" onClick={() => setStep(2)} className={primaryBtn}>
              Continue
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section>
          <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Select a date</h2>
          <p className="mt-2 text-sm text-white/55">
            Only dates with open slots are shown · {boot.settings.timeZone}
          </p>
          <div className="mt-6 grid max-h-[360px] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
            {dates.length === 0 && (
              <p className="col-span-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-6 text-sm text-white/50">
                No open dates in the booking window.
              </p>
            )}
            {dates.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  setDate(d);
                  setStep(3);
                }}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm font-semibold text-white transition hover:border-[#f1328b]/50 hover:bg-[#f1328b]/10"
              >
                {d}
              </button>
            ))}
          </div>
          <button type="button" className={`mt-8 ${ghostBtn}`} onClick={() => setStep(1)}>
            Back
          </button>
        </section>
      )}

      {step === 3 && (
        <section>
          <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Select a time</h2>
          <p className="mt-2 text-sm text-white/55">
            {date} · {boot.settings.durationMinutes}-minute sessions
          </p>
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {slots.map((s) => (
              <button
                key={s.startTimeUtc}
                type="button"
                disabled={busy}
                onClick={() => selectSlot(s)}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm font-semibold text-white transition hover:border-[#693492] hover:bg-[#693492]/15 disabled:opacity-50"
              >
                {s.label}
              </button>
            ))}
            {!slots.length && (
              <p className="col-span-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-6 text-sm text-white/50">
                No slots this day.
              </p>
            )}
          </div>
          <button type="button" className={`mt-8 ${ghostBtn}`} onClick={() => setStep(2)}>
            Back
          </button>
        </section>
      )}

      {step === 4 && (
        <section>
          <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Your details</h2>
          <p className="mt-2 text-sm text-white/55">We use this information to confirm and follow up on your session.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="First name *" value={firstName} onChange={setFirstName} required />
            <Field label="Last name *" value={lastName} onChange={setLastName} required />
            <Field label="Email *" value={email} onChange={setEmail} type="email" required />
            <Field label="Mobile phone *" value={phone} onChange={setPhone} type="tel" required />
            <label className="block text-sm">
              <span className="text-xs uppercase tracking-wider text-white/45">Preferred contact</span>
              <select
                value={preferredContact}
                onChange={(e) => setPreferredContact(e.target.value as 'EMAIL' | 'PHONE' | 'SMS')}
                className="mt-2 w-full rounded-xl border border-white/15 bg-[#111] px-3 py-3 text-white"
              >
                <option value="EMAIL">Email</option>
                <option value="PHONE">Phone</option>
                <option value="SMS">SMS</option>
              </select>
            </label>
            <Field label="Preferred language" value={language} onChange={setLanguage} />
            <Field label="Emergency contact name" value={emName} onChange={setEmName} />
            <Field label="Emergency contact phone" value={emPhone} onChange={setEmPhone} />
            <Field label="Relationship" value={emRel} onChange={setEmRel} />
            <Field label="Referral source" value={referral} onChange={setReferral} />
          </div>
          <label className="mt-4 block text-sm">
            <span className="text-xs uppercase tracking-wider text-white/45">Accessibility requirements</span>
            <textarea
              value={access}
              onChange={(e) => setAccess(e.target.value)}
              rows={2}
              className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-3 text-white"
            />
          </label>
          <label className="mt-4 block text-sm">
            <span className="text-xs uppercase tracking-wider text-white/45">Appointment notes (optional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-3 text-white"
            />
          </label>
          <div className="mt-4 space-y-2 text-sm text-white/70">
            <label className="flex gap-2">
              <input type="checkbox" checked={safeVm} onChange={(e) => setSafeVm(e.target.checked)} />
              Safe to leave a voicemail
            </label>
            <label className="flex gap-2">
              <input
                type="checkbox"
                checked={safeEmail}
                onChange={(e) => setSafeEmail(e.target.checked)}
              />
              Safe to send email reminders
            </label>
            <label className="flex gap-2">
              <input
                type="checkbox"
                checked={firstSession}
                onChange={(e) => setFirstSession(e.target.checked)}
              />
              This is my first LoveCry counselling session
            </label>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button type="button" className={ghostBtn} onClick={() => setStep(3)}>
              Back
            </button>
            <button type="button" onClick={nextFromDetails} className={primaryBtn}>
              Continue
            </button>
          </div>
        </section>
      )}

      {step === 5 && (
        <section>
          <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Intake & safety</h2>
          <p className="mt-2 text-sm text-white/55">Help us prepare for your session and keep you safe.</p>
          <div
            role="note"
            className="mt-5 rounded-xl border border-[#f1328b]/40 bg-gradient-to-br from-[#f1328b]/15 to-[#693492]/10 px-4 py-3 text-sm leading-relaxed text-white/85"
          >
            {boot.settings.crisisMessage}
          </div>
          <label className="mt-5 block text-sm">
            <span className="text-xs uppercase tracking-wider text-white/45">
              What would you like support with? *
            </span>
            <textarea
              value={supportWith}
              onChange={(e) => setSupportWith(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-3 text-white"
            />
          </label>
          <label className="mt-4 flex gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              checked={interpreter}
              onChange={(e) => setInterpreter(e.target.checked)}
            />
            I require an interpreter
          </label>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button type="button" className={ghostBtn} onClick={() => setStep(4)}>
              Back
            </button>
            <button type="button" onClick={nextFromIntake} className={primaryBtn}>
              Continue
            </button>
          </div>
        </section>
      )}

      {step === 6 && (
        <section>
          <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Consent form</h2>
          <p className="mt-2 text-sm text-white/55">
            You can book now and sign later (at least {boot.settings.consentDeadlineHours} hours
            before). Or sign below to complete consent immediately.
          </p>
          {boot.consent ? (
            <div className="mt-5">
              <ConsentDocumentViewer
                title={boot.consent.title}
                version={boot.consent.version}
                bodyText={boot.consent.bodyText}
              />
            </div>
          ) : (
            <p className="mt-4 text-sm text-amber-200">No active consent template.</p>
          )}

          <label className="mt-5 flex gap-2 text-sm text-white/80">
            <input type="checkbox" checked={signNow} onChange={(e) => setSignNow(e.target.checked)} />
            Sign now (recommended)
          </label>

          {(signNow || boot.settings.consentRequiredBeforeConfirm) && (
            <div className="mt-5 space-y-4">
              <TypedSignature value={legalName} onChange={setLegalName} />
              <div>
                <p className="mb-2 text-xs uppercase tracking-wider text-white/45">
                  Draw signature (optional if typed name provided)
                </p>
                <SignaturePad onChange={setDrawn} />
              </div>
              <ConsentCheckboxes checked={acks} onChange={setAcks} />
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button type="button" className={ghostBtn} onClick={() => setStep(5)}>
              Back
            </button>
            <button type="button" disabled={busy} onClick={submitBooking} className={primaryBtn}>
              {busy ? 'Submitting…' : 'Submit booking'}
            </button>
          </div>
        </section>
      )}

      {step === 7 && summary && (
        <section>
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
              <CheckCircle2 className="h-7 w-7" aria-hidden />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Booking confirmed</h2>
              <p className="mt-1 text-sm text-white/55">Your session is reserved. Details are below.</p>
            </div>
          </div>
          <dl className="mt-6 divide-y divide-white/10 rounded-2xl border border-white/10 bg-black/20">
            <div className="grid gap-1 px-5 py-4 sm:grid-cols-[140px_1fr]">
              <dt className="text-xs font-bold uppercase tracking-wider text-white/40">Reference</dt>
              <dd className="font-bold text-white">{summary.referenceNumber}</dd>
            </div>
            <div className="grid gap-1 px-5 py-4 sm:grid-cols-[140px_1fr]">
              <dt className="text-xs font-bold uppercase tracking-wider text-white/40">When</dt>
              <dd className="text-sm text-white/85">
                {summary.displayDate} · {summary.displayTime} ({summary.timeZone})
              </dd>
            </div>
            <div className="grid gap-1 px-5 py-4 sm:grid-cols-[140px_1fr]">
              <dt className="text-xs font-bold uppercase tracking-wider text-white/40">Format</dt>
              <dd className="text-sm text-white/85">{summary.appointmentMode}</dd>
            </div>
            <div className="grid gap-1 px-5 py-4 sm:grid-cols-[140px_1fr]">
              <dt className="text-xs font-bold uppercase tracking-wider text-white/40">Counsellor</dt>
              <dd className="text-sm text-white/85">{summary.counsellorName}</dd>
            </div>
            <div className="grid gap-1 px-5 py-4 sm:grid-cols-[140px_1fr]">
              <dt className="text-xs font-bold uppercase tracking-wider text-white/40">Consent</dt>
              <dd className="text-sm text-white/85">{summary.consentStatus}</dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-3">
            {manageToken && (
              <a
                href={`/bookings/manage/${manageToken}`}
                className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-bold text-white"
              >
                Manage appointment
              </a>
            )}
            {summary.consentPath && summary.consentStatus !== 'SIGNED' && (
              <a
                href={summary.consentPath}
                className="rounded-full bg-[#f1328b] px-5 py-2.5 text-sm font-bold text-white"
              >
                Sign consent
              </a>
            )}
            {slot && (
              <a
                href={buildGoogleCalendarLink(summary)}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-bold text-white/80"
              >
                Add to Google Calendar
              </a>
            )}
          </div>
          <p className="mt-6 text-xs text-white/45">{summary.crisisMessage}</p>
        </section>
      )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="text-xs uppercase tracking-wider text-white/45">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-3 text-white outline-none focus:border-[#f1328b]/50"
      />
    </label>
  );
}

function buildGoogleCalendarLink(summary: Summary): string {
  const title = encodeURIComponent(`LoveCry counselling — ${summary.referenceNumber}`);
  const details = encodeURIComponent('LoveCry counselling appointment');
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`;
}
