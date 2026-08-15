import { redirect } from 'next/navigation';
import { isAdminUnlocked } from '@/lib/auth/admin-gate';
import { getCalendarConnectionStatus } from '@/lib/google/calendar';
import { counsellingEnv } from '@/lib/config/counselling-env';
import { AdminNav } from '../page';
import { GoogleIntegrationActions } from '@/components/admin/GoogleIntegrationActions';

export const metadata = { title: 'Google Calendar integration | LoveCry' };

type Props = { searchParams: Promise<{ success?: string; error?: string }> };

export default async function GoogleIntegrationPage({ searchParams }: Props) {
  if (!(await isAdminUnlocked())) redirect('/admin');
  const params = await searchParams;
  const status = await getCalendarConnectionStatus();

  return (
    <main className="min-h-screen bg-[#050505] px-6 pb-20 pt-28 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-black">Google Calendar</h1>
          <AdminNav />
        </div>

        {params.success === 'connected' && (
          <p className="mt-4 rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            Google Calendar connected successfully.
          </p>
        )}
        {params.error && (
          <p className="mt-4 rounded-xl border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-100">
            Connection error: {params.error.replaceAll('_', ' ')}
          </p>
        )}

        <div
          className={`mt-6 rounded-2xl border px-5 py-4 ${
            status.connected
              ? 'border-emerald-400/40 bg-emerald-400/10'
              : 'border-amber-400/40 bg-amber-400/10'
          }`}
        >
          <p className="font-bold">Status: {status.connected ? 'Connected' : 'Not Connected'}</p>
          <p className="mt-1 text-sm text-white/70">{status.message}</p>
          <dl className="mt-4 grid gap-2 text-sm text-white/75 sm:grid-cols-2">
            <div>
              <dt className="text-white/45">Connected Google account</dt>
              <dd>{status.connectedEmail || '—'}</dd>
            </div>
            <div>
              <dt className="text-white/45">Calendar name</dt>
              <dd>{status.calendarName || '—'}</dd>
            </div>
            <div>
              <dt className="text-white/45">Calendar ID</dt>
              <dd className="font-mono text-xs">{status.calendarIdMasked || '—'}</dd>
            </div>
            <div>
              <dt className="text-white/45">Last successful API test</dt>
              <dd>
                {status.lastSuccessfulCheckAt
                  ? new Date(status.lastSuccessfulCheckAt).toLocaleString('en-CA', {
                      timeZone: counsellingEnv.timeZone,
                    })
                  : '—'}
              </dd>
            </div>
          </dl>
        </div>

        <GoogleIntegrationActions connected={status.connected} />

        <p className="mt-6 text-sm text-white/50">
          OAuth requests only Calendar free/busy and event permissions. Google Drive consent storage
          remains a separate integration and is not authorized through this connection.
        </p>

        <h2 className="mt-10 text-lg font-bold">Environment checklist</h2>
        <ul className="mt-3 space-y-2 font-mono text-xs text-white/55">
          {[
            ['GOOGLE_CLIENT_ID', counsellingEnv.google.clientId],
            ['GOOGLE_CLIENT_SECRET', counsellingEnv.google.clientSecret],
            ['GOOGLE_REDIRECT_URI', counsellingEnv.google.redirectUri],
            ['GOOGLE_CALENDAR_ID', counsellingEnv.google.counsellingCalendarId],
            ['GOOGLE_CALENDAR_TIMEZONE', counsellingEnv.google.calendarTimezone],
            ['GOOGLE_TOKEN_ENCRYPTION_KEY', process.env.GOOGLE_TOKEN_ENCRYPTION_KEY || ''],
            ['GOOGLE_SIGNED_CONSENT_FOLDER_ID', counsellingEnv.google.signedConsentFolderId],
          ].map(([k, v]) => (
            <li key={k} className="rounded-lg border border-white/10 px-3 py-2">
              {k}: {v ? '✓' : '— empty'}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
