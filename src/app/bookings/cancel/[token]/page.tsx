'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function CancelBookingPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch('/api/public/counselling/bookings/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ manageToken: token, reason: reason || undefined }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || 'Cancellation failed');
      return;
    }
    router.push(`/bookings/manage/${token}`);
  }

  return (
    <main className="min-h-screen bg-[#050505] px-6 pb-20 pt-28 text-white">
      <div className="mx-auto max-w-lg">
        <h1 className="text-3xl font-black">Cancel appointment</h1>
        <p className="mt-2 text-sm text-white/55">This cannot be undone from this link.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="text-xs uppercase tracking-wider text-white/45">
              Reason (optional)
            </span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-3"
            />
          </label>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <div className="flex gap-3">
            <Link href={`/bookings/manage/${token}`} className="text-sm text-white/50">
              Back
            </Link>
            <button
              type="submit"
              disabled={busy}
              className="rounded-full border border-red-400/50 bg-red-500/20 px-5 py-2.5 text-sm font-bold text-red-100"
            >
              {busy ? 'Cancelling…' : 'Confirm cancellation'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
