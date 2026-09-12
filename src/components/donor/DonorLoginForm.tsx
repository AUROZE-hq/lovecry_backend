'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function DonorLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const donationReference = searchParams.get('ref') || undefined;
  const urlError = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(urlError ? decodeURIComponent(urlError) : '');
  const [busy, setBusy] = useState(false);

  async function signInPassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const res = await fetch('/api/donor/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Unable to sign in');
      router.push('/donor/donations');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  async function sendMagicLink() {
    setBusy(true);
    setMessage('');
    try {
      const res = await fetch('/api/donor/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, magicLink: true }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Unable to send link');
      setMessage(
        data.previewUrl
          ? `Check your email. Dev link: ${data.previewUrl}`
          : 'Check your email for a secure one-time sign-in link.'
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-2 lg:items-start">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#f1328b]">Donor Portal</p>
        <h1 className="mt-3 text-4xl font-black text-white">Keep your giving in one place.</h1>
        <p className="mt-4 text-white/60">
          Sign in securely to view donation history, eligible receipts, and recurring gifts.
          {donationReference ? ' Today’s gift will be linked after you sign in.' : ''}
        </p>
      </div>

      <form
        onSubmit={signInPassword}
        className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 sm:p-8"
      >
        <h2 className="text-2xl font-black text-white">Sign in</h2>
        <p className="mt-2 text-sm text-white/55">
          Use your portal password, or request a one-time email link. Email alone is never enough.
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
        <label className="mt-4 block text-sm text-white/60">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#f1328b]/50"
          />
        </label>

        {message && <p className="mt-3 break-all text-sm text-white/70">{message}</p>}

        <button
          type="submit"
          disabled={busy || password.length < 8}
          className="mt-6 w-full rounded-full bg-[#f1328b] py-3.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <button
          type="button"
          disabled={busy || !email}
          onClick={() => void sendMagicLink()}
          className="mt-3 w-full text-sm font-semibold text-[#f1328b] hover:underline disabled:opacity-50"
        >
          Prefer a secure email link instead?
        </button>
        <p className="mt-6 text-center text-sm text-white/45">
          New donor?{' '}
          <Link href="/donate" className="text-[#f1328b] hover:underline">
            Donate first
          </Link>
        </p>
      </form>
    </div>
  );
}
