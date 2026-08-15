'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type Payload = {
  summary: {
    referenceNumber: string;
    displayDate: string;
    displayTime: string;
    timeZone: string;
    appointmentMode: string;
    counsellorName: string;
    location?: string;
    consentStatus: string;
    status: string;
    crisisMessage: string;
  };
};

export default function ManageBookingPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/public/counselling/bookings/manage/${token}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Not found');
        setData(j);
      })
      .catch((e) => setError(e.message));
  }, [token]);

  if (error) {
    return (
      <main className="min-h-screen bg-[#050505] px-6 pt-28 text-white">
        <p className="text-red-200">{error}</p>
        <Link href="/book-now" className="mt-4 inline-block text-[#f1328b]">
          Book again
        </Link>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-[#050505] px-6 pt-28 text-white/60">Loading…</main>
    );
  }

  const s = data.summary;
  const cancelled = s.status.startsWith('CANCELLED');

  return (
    <main className="min-h-screen bg-[#050505] px-6 pb-20 pt-28 text-white">
      <div className="mx-auto max-w-xl">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#f1328b]">LoveCry</p>
        <h1 className="mt-2 text-3xl font-black">Manage appointment</h1>
        <dl className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm">
          <Row label="Reference" value={s.referenceNumber} />
          <Row label="Status" value={s.status} />
          <Row label="When" value={`${s.displayDate} · ${s.displayTime} (${s.timeZone})`} />
          <Row label="Type" value={s.appointmentMode} />
          <Row label="Counsellor" value={s.counsellorName} />
          <Row label="Consent" value={s.consentStatus} />
          {s.location && <Row label="Location" value={s.location} />}
        </dl>
        {!cancelled && (
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/bookings/reschedule/${token}`}
              className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-bold"
            >
              Reschedule
            </Link>
            <Link
              href={`/bookings/cancel/${token}`}
              className="rounded-full border border-red-400/40 px-5 py-2.5 text-sm font-bold text-red-200"
            >
              Cancel
            </Link>
            {s.consentStatus !== 'SIGNED' && (
              <Link
                href={`/consent/sign/${token}`}
                className="rounded-full bg-[#f1328b] px-5 py-2.5 text-sm font-bold"
              >
                Sign consent
              </Link>
            )}
          </div>
        )}
        <p className="mt-8 text-xs text-white/40">{s.crisisMessage}</p>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-widest text-white/40">{label}</dt>
      <dd className="mt-1 text-white/85">{value}</dd>
    </div>
  );
}
