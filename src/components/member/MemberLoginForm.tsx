'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from 'lucide-react';

export default function MemberLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/member/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName, lastName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to sign in');
      router.refresh();
      router.push('/member/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto w-full max-w-md rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-8"
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f1328b]/15 text-[#f1328b]">
        <User className="h-5 w-5" />
      </div>
      <h1 className="mt-5 text-center text-2xl font-black text-white">Member Portal</h1>
      <p className="mt-2 text-center text-sm text-white/55">
        For LoveCry members: events, counselling, and program updates. Use the email we have on file.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm text-white/60">
          First name
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#f1328b]/50"
          />
        </label>
        <label className="block text-sm text-white/60">
          Last name
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#f1328b]/50"
          />
        </label>
      </div>

      <label className="mt-3 block text-sm text-white/60">
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#f1328b]/50"
        />
      </label>

      {error && (
        <p className="mt-3 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-6 w-full rounded-full bg-gradient-to-r from-[#693492] to-[#f1328b] py-3.5 text-sm font-bold text-white disabled:opacity-60"
      >
        {busy ? 'Signing in…' : 'Enter Member Portal'}
      </button>
    </form>
  );
}
