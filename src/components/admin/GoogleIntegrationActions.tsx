'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function GoogleIntegrationActions({ connected }: { connected: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  async function testConnection() {
    setLoading('test');
    setMessage('');
    try {
      const res = await fetch('/api/integrations/google-calendar/test', { method: 'POST' });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string; calendarName?: string } | null;
      if (data?.ok) {
        setMessage(`Connection OK${data.calendarName ? ` — ${data.calendarName}` : ''}`);
      } else {
        setMessage(data?.error || 'Test failed');
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function disconnect() {
    if (!confirm('Disconnect Google Calendar?')) return;
    setLoading('disconnect');
    setMessage('');
    try {
      const res = await fetch('/api/integrations/google-calendar/disconnect', { method: 'POST' });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setMessage(data?.error || 'Disconnect failed');
      } else {
        setMessage('Disconnected');
        router.refresh();
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mt-8 space-y-3">
      <div className="flex flex-wrap gap-3">
        <a
          href="/api/integrations/google-calendar/connect"
          className="rounded-full bg-gradient-to-r from-[#693492] to-[#f1328b] px-5 py-2.5 text-sm font-bold"
        >
          {connected ? 'Reconnect' : 'Connect'}
        </a>
        <button
          type="button"
          onClick={testConnection}
          disabled={loading !== null}
          className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-bold disabled:opacity-50"
        >
          {loading === 'test' ? 'Testing…' : 'Test Connection'}
        </button>
        {connected && (
          <button
            type="button"
            onClick={disconnect}
            disabled={loading !== null}
            className="rounded-full border border-red-400/40 px-5 py-2.5 text-sm font-bold text-red-200 disabled:opacity-50"
          >
            {loading === 'disconnect' ? 'Disconnecting…' : 'Disconnect'}
          </button>
        )}
      </div>
      {message && <p className="text-sm text-white/70">{message}</p>}
    </div>
  );
}
