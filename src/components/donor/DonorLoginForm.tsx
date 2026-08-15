'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DonorLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const res = await fetch('/api/donor/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to send link');
      setMessage('Access granted for this session (dev magic-link stub).');
      router.refresh();
      router.push('/donor/donations');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-8">
      <h1 className="text-2xl font-black text-white">Donor portal</h1>
      <p className="mt-2 text-sm text-white/55">
        Enter the email used when donating. Full emailed magic links come later — this is a temporary gate.
      </p>
      <label className="mt-6 block text-sm text-white/60">
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#f1328b]/50"
        />
      </label>
      {message && <p className="mt-3 text-sm text-white/70">{message}</p>}
      <button
        type="submit"
        disabled={busy}
        className="mt-6 w-full rounded-full bg-gradient-to-r from-[#693492] to-[#f1328b] py-3.5 text-sm font-bold text-white disabled:opacity-60"
      >
        {busy ? 'Opening…' : 'Continue'}
      </button>
    </form>
  );
}
