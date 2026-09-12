'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ActivatePortalCard({
  email,
  donationReference,
  amountLabel,
}: {
  email: string;
  donationReference: string;
  amountLabel: string;
}) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [magicMessage, setMagicMessage] = useState('');

  async function activate() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/donor/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          confirmPassword,
          donationReference,
          mode: 'activate',
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Unable to activate portal');
      router.push(data.alreadyExisted ? '/donor/donations?linked=1' : '/donor/donations');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  async function sendMagicLink() {
    setBusy(true);
    setError('');
    setMagicMessage('');
    try {
      const res = await fetch('/api/donor/activate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          donationReference,
          purpose: 'ACTIVATION',
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Unable to send link');
      setMagicMessage(
        data.previewUrl
          ? `Dev link: ${data.previewUrl}`
          : 'Check your email for a secure one-time activation link.'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
      <p className="text-white">Keep all your giving in one place</p>
      <p className="mt-1 text-sm text-white/55">
        Activate Donor Portal to view giving history, eligible receipts and recurring gifts. Today&apos;s{' '}
        {amountLabel} gift will connect automatically.
      </p>

      <div className="mt-4 space-y-3">
        <label className="block text-sm text-white/55">
          Email
          <input
            value={email}
            readOnly
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white"
          />
        </label>
        <label className="block text-sm text-white/55">
          Create password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none focus:border-[#f1328b]/60"
          />
        </label>
        <label className="block text-sm text-white/55">
          Confirm password
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none focus:border-[#f1328b]/60"
          />
        </label>
      </div>

      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      {magicMessage && <p className="mt-3 break-all text-sm text-emerald-200">{magicMessage}</p>}

      <button
        type="button"
        disabled={busy || password.length < 8}
        onClick={() => void activate()}
        className="mt-4 w-full rounded-full bg-[#f1328b] px-6 py-3.5 text-sm font-bold text-white disabled:opacity-60"
      >
        Activate Donor Portal
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => void sendMagicLink()}
        className="mt-3 w-full text-sm font-semibold text-[#f1328b] hover:underline"
      >
        Prefer a secure email link instead?
      </button>
      <Link href="/" className="mt-3 block text-center text-sm text-white/45 hover:text-white/70">
        Not now — return home
      </Link>
    </div>
  );
}
