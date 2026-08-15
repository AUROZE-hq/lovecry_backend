'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';

export default function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error || 'Invalid credentials');
        return;
      }

      router.refresh();
      router.push('/admin/donations');
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto w-full max-w-md rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-8"
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f1328b]/15 text-[#f1328b]">
        <Lock className="h-5 w-5" />
      </div>
      <h1 className="mt-5 text-center text-2xl font-black text-white">Admin access</h1>
      <p className="mt-2 text-center text-sm text-white/50">
        Sign in with your LoveCry administrator account.
      </p>

      <label className="mt-8 block text-sm text-white/60">
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#f1328b]/50"
          autoComplete="username"
          required
        />
      </label>

      <label className="mt-4 block text-sm text-white/60">
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#f1328b]/50"
          autoComplete="current-password"
          required
        />
      </label>

      {error && (
        <p className="mt-3 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-full bg-gradient-to-r from-[#693492] to-[#f1328b] py-3.5 text-sm font-bold text-white disabled:opacity-60"
      >
        {loading ? 'Checking…' : 'Enter admin'}
      </button>
    </form>
  );
}
