'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

type Slot = { startTimeUtc: string; endTimeUtc: string; label: string };

export default function ReschedulePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [dates, setDates] = useState<string[]>([]);
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/public/counselling/availability')
      .then((r) => r.json())
      .then((d) => setDates(d.dates || []));
  }, []);

  useEffect(() => {
    if (!date) return;
    fetch(`/api/public/counselling/availability?date=${date}`)
      .then((r) => r.json())
      .then((d) => setSlots(d.slots || []));
  }, [date]);

  async function pick(slot: Slot) {
    setBusy(true);
    setError(null);
    const holdRes = await fetch('/api/public/counselling/holds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startTimeUtc: slot.startTimeUtc, endTimeUtc: slot.endTimeUtc }),
    });
    const hold = await holdRes.json();
    if (!holdRes.ok) {
      setBusy(false);
      setError(hold.error || 'Could not hold slot');
      return;
    }
    const res = await fetch('/api/public/counselling/bookings/reschedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ manageToken: token, holdToken: hold.holdToken }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || 'Reschedule failed');
      return;
    }
    router.push(`/bookings/manage/${token}`);
  }

  return (
    <main className="min-h-screen bg-[#050505] px-6 pb-20 pt-28 text-white">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-black">Reschedule</h1>
        <Link href={`/bookings/manage/${token}`} className="mt-2 inline-block text-sm text-white/50">
          Back
        </Link>
        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
        <h2 className="mt-6 text-sm font-bold uppercase tracking-wider text-white/45">Date</h2>
        <div className="mt-2 grid max-h-48 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
          {dates.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDate(d)}
              className={`rounded-xl border px-3 py-2 text-sm ${
                date === d ? 'border-[#f1328b]' : 'border-white/10'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        {date && (
          <>
            <h2 className="mt-6 text-sm font-bold uppercase tracking-wider text-white/45">Time</h2>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {slots.map((s) => (
                <button
                  key={s.startTimeUtc}
                  type="button"
                  disabled={busy}
                  onClick={() => pick(s)}
                  className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:border-[#693492]"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
