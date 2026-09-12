'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CancelMonthlyButton({
  recurringId,
  amountLabel,
  campaignName,
  nextDate,
}: {
  recurringId: string;
  amountLabel: string;
  campaignName: string;
  nextDate: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function confirmCancel() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/donor/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel_recurring', recurringId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Unable to cancel');
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to cancel');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-white/20 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white/80 hover:text-white"
      >
        Cancel monthly gift
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0c0a12] p-6">
            <h3 className="text-xl font-black text-white">Cancel your monthly gift?</h3>
            <p className="mt-3 text-sm text-white/60">
              {amountLabel}/month to {campaignName}. Next gift date: {nextDate}.
            </p>
            <p className="mt-3 text-sm text-white/50">
              Cancelling stops future billing. Past donations and receipts stay in your history.
            </p>
            {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                disabled={busy}
                onClick={() => void confirmCancel()}
                className="flex-1 rounded-full bg-[#f1328b] px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {busy ? 'Cancelling…' : 'Confirm cancel'}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-full border border-white/20 px-5 py-3 text-sm font-bold text-white/80"
              >
                Keep monthly gift
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
