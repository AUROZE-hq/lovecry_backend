'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type Summary = {
  referenceNumber: string;
  displayWeekdayDate?: string;
  displayTimeRange?: string;
  displayDate: string;
  displayTime: string;
  counsellorName: string;
  counsellorFirstName?: string;
  crisisMessage: string;
  managePath?: string;
};

type IntakePayload = {
  supportWith: string;
  interpreter: boolean;
  accessibility: string;
  firstSession: boolean;
};

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asBool(value: unknown): boolean {
  return value === true;
}

export default function BookingIntakePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [summary, setSummary] = useState<Summary | null>(null);
  const [form, setForm] = useState<IntakePayload>({
    supportWith: '',
    interpreter: false,
    accessibility: '',
    firstSession: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/public/counselling/bookings/intake/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Invalid or expired link');
        setSummary(data.summary);
        const answers = data.intakeAnswers || {};
        setForm({
          supportWith: asString(answers.supportWith),
          interpreter: asBool(answers.interpreter),
          accessibility: asString(answers.accessibility),
          firstSession: answers.firstSession === undefined ? true : asBool(answers.firstSession),
        });
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/public/counselling/bookings/intake/${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save intake.');
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save intake.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] px-4 pt-[calc(var(--site-header-height)+2.5rem)] text-white/55">
        <div className="mx-auto max-w-xl animate-pulse space-y-4">
          <div className="h-8 w-2/3 rounded-lg bg-white/10" />
          <div className="h-40 rounded-[20px] bg-white/5" />
        </div>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="min-h-screen bg-[#050505] px-4 pt-[calc(var(--site-header-height)+2.5rem)] text-white">
        <div className="mx-auto max-w-xl">
          <h1 className="font-hero text-3xl font-bold">Intake form</h1>
          <p className="mt-4 text-red-200" role="alert">
            {error}
          </p>
          <Link href="/book-now" className="mt-6 inline-block text-[#f1328b]">
            Book an appointment
          </Link>
        </div>
      </div>
    );
  }

  const when = summary
    ? `${summary.displayWeekdayDate || summary.displayDate} · ${summary.displayTimeRange || summary.displayTime}`
    : '';

  return (
    <div className="min-h-screen bg-[#050505] px-4 pb-24 pt-[calc(var(--site-header-height)+2.5rem)] text-white">
      <div className="mx-auto max-w-xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#f1328b]">
          Confidential intake
        </p>
        <h1 className="font-hero mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Prepare for your session
        </h1>
        {summary && (
          <p className="mt-3 text-sm text-white/55">
            {summary.counsellorName}
            {when ? ` · ${when}` : ''}
          </p>
        )}

        {summary?.crisisMessage && (
          <p
            role="note"
            className="mt-6 rounded-2xl border border-[#f1328b]/35 bg-[#f1328b]/10 px-4 py-3 text-sm leading-relaxed text-white/80"
          >
            {summary.crisisMessage}
          </p>
        )}

        <form
          onSubmit={submit}
          className="mt-6 space-y-5 rounded-[20px] border border-white/[0.08] bg-[#0c0a12] p-5 sm:p-6"
        >
          {error && (
            <p role="alert" className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </p>
          )}
          {saved && (
            <p role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
              Intake saved. You can update it any time before your appointment.
            </p>
          )}

          <label className="block">
            <span className="text-sm font-medium text-white">What would you like support with?</span>
            <textarea
              value={form.supportWith}
              onChange={(e) => setForm((prev) => ({ ...prev, supportWith: e.target.value }))}
              rows={4}
              maxLength={2000}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f1328b]"
              placeholder="Share as much or as little as you are comfortable with."
            />
          </label>

          <label className="flex cursor-pointer items-start gap-3 text-sm text-white/80">
            <input
              type="checkbox"
              checked={form.interpreter}
              onChange={(e) => setForm((prev) => ({ ...prev, interpreter: e.target.checked }))}
              className="mt-1 h-4 w-4 accent-[#f1328b]"
            />
            Interpreter required?
          </label>

          <label className="block">
            <span className="text-sm font-medium text-white">Accessibility requirements</span>
            <textarea
              value={form.accessibility}
              onChange={(e) => setForm((prev) => ({ ...prev, accessibility: e.target.value }))}
              rows={3}
              maxLength={500}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f1328b]"
              placeholder="Let us know how we can make your session more accessible."
            />
          </label>

          <label className="flex cursor-pointer items-start gap-3 text-sm text-white/80">
            <input
              type="checkbox"
              checked={form.firstSession}
              onChange={(e) => setForm((prev) => ({ ...prev, firstSession: e.target.checked }))}
              className="mt-1 h-4 w-4 accent-[#f1328b]"
            />
            This is my first LoveCry counselling session
          </label>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-[#f1328b] py-3.5 text-sm font-bold text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f1328b] disabled:opacity-60"
          >
            {busy ? 'Saving…' : saved ? 'Save updates' : 'Save intake'}
          </button>
        </form>

        {summary?.managePath && (
          <Link href={summary.managePath} className="mt-6 inline-block text-sm font-semibold text-white/55 hover:text-white">
            Manage appointment
          </Link>
        )}
      </div>
    </div>
  );
}
