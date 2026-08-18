import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdminUnlocked } from '@/lib/auth/admin-gate';
import { getGoogleStatus } from '@/lib/google/calendar';
import { listAppointments, getSettings, listAudits } from '@/lib/counselling/store';
import { formatInTz } from '@/lib/counselling/time-zone';
import { logoutAdmin } from '@/app/admin/actions';

export const metadata = { title: 'Counselling Admin | LoveCry' };

export default async function AdminCounsellingPage() {
  const unlocked = await isAdminUnlocked();
  if (!unlocked) redirect('/admin');

  const appointments = await listAppointments();
  // eslint-disable-next-line react-hooks/purity -- server component snapshot
  const now = Date.now();
  const upcoming = appointments.filter(
    (a) =>
      !a.status.startsWith('CANCELLED') &&
      new Date(a.startTimeUtc).getTime() >= now
  );
  const unsigned = appointments.filter(
    (a) => !a.status.startsWith('CANCELLED') && a.consentStatus !== 'SIGNED'
  );
  const google = getGoogleStatus();
  const audits = await listAudits(10);
  const settings = await getSettings();

  return (
    <main className="min-h-screen bg-[#050505] px-6 pb-20 pt-28 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black">Counselling admin</h1>
            <p className="mt-2 text-sm text-white/55">
              Availability, appointments, consent · TZ {settings.timeZone}
            </p>
          </div>
          <AdminNav />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Upcoming', value: String(upcoming.length) },
            { label: 'Unsigned consent', value: String(unsigned.length) },
            { label: 'All appointments', value: String(appointments.length) },
            { label: 'Google', value: google.configured ? 'Ready' : 'Pending keys' },
          ].map((c) => (
            <div key={c.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-[11px] uppercase tracking-widest text-white/40">{c.label}</p>
              <p className="mt-2 text-2xl font-black">{c.value}</p>
            </div>
          ))}
        </div>

        {!google.configured && (
          <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {google.message}
          </p>
        )}

        <h2 className="mt-10 text-lg font-bold">Upcoming appointments</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/[0.04] text-[11px] uppercase tracking-wider text-white/45">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Consent</th>
                <th className="px-4 py-3">Ref</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.slice(0, 20).map((a) => (
                <tr key={a.id} className="border-t border-white/10">
                  <td className="px-4 py-3">
                    {formatInTz(a.startTimeUtc, { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/counselling/appointments/${a.id}`}
                      className="font-semibold text-[#f1328b] hover:underline"
                    >
                      {a.client.firstName} {a.client.lastName}
                    </Link>
                    <div className="text-xs text-white/40">{a.client.email}</div>
                  </td>
                  <td className="px-4 py-3">{a.status}</td>
                  <td className="px-4 py-3">{a.consentStatus}</td>
                  <td className="px-4 py-3 font-mono text-xs">{a.referenceNumber}</td>
                </tr>
              ))}
              {!upcoming.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-white/40">
                    No upcoming appointments yet. Clients book at /book-now.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <h2 className="mt-10 text-lg font-bold">Recent audit</h2>
        <ul className="mt-3 space-y-2 text-sm text-white/60">
          {audits.map((a) => (
            <li key={a.id} className="rounded-lg border border-white/10 px-3 py-2">
              <span className="font-mono text-xs text-white/35">{a.createdAt}</span> · {a.action} ·{' '}
              {a.actorType}
            </li>
          ))}
          {!audits.length && <li className="text-white/40">No events yet.</li>}
        </ul>
      </div>
    </main>
  );
}

export function AdminNav() {
  const links = [
    ['/admin/counselling', 'Dashboard'],
    ['/admin/counselling/appointments', 'Appointments'],
    ['/admin/counselling/availability', 'Availability'],
    ['/admin/counselling/consent-forms', 'Consent forms'],
    ['/admin/counselling/settings', 'Settings'],
    ['/admin/counselling/google-integration', 'Google'],
    ['/admin/counselling/audit-logs', 'Audit'],
    ['/admin/events', 'Events'],
    ['/admin/marketplace', 'Marketplace'],
    ['/admin/donations', 'Donations'],
  ] as const;

  return (
    <div className="flex flex-wrap gap-2">
      {links.map(([href, label]) => (
        <Link
          key={href}
          href={href}
          className="rounded-full border border-white/15 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white/70"
        >
          {label}
        </Link>
      ))}
      <form action={logoutAdmin}>
        <button
          type="submit"
          className="rounded-full border border-white/15 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white/70"
        >
          Log out
        </button>
      </form>
    </div>
  );
}
