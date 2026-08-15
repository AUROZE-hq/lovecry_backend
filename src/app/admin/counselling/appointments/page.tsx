import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdminUnlocked } from '@/lib/auth/admin-gate';
import { listAppointments } from '@/lib/counselling/store';
import { formatInTz } from '@/lib/counselling/time-zone';
import { AdminNav } from '../page';

export const metadata = { title: 'Appointments | Counselling Admin' };

export default async function AdminAppointmentsPage() {
  if (!(await isAdminUnlocked())) redirect('/admin');
  const appointments = [...(await listAppointments())].reverse();

  return (
    <main className="min-h-screen bg-[#050505] px-6 pb-20 pt-28 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-black">Appointments</h1>
          <AdminNav />
        </div>
        <div className="mt-8 overflow-x-auto rounded-2xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/[0.04] text-[11px] uppercase tracking-wider text-white/45">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Consent</th>
                <th className="px-4 py-3">Ref</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id} className="border-t border-white/10">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatInTz(a.startTimeUtc, { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/counselling/appointments/${a.id}`}
                      className="text-[#f1328b] hover:underline"
                    >
                      {a.client.firstName} {a.client.lastName}
                    </Link>
                    <div className="text-xs text-white/40">
                      {a.client.email} · {a.client.phone}
                    </div>
                  </td>
                  <td className="px-4 py-3">{a.appointmentMode}</td>
                  <td className="px-4 py-3">{a.status}</td>
                  <td className="px-4 py-3">{a.consentStatus}</td>
                  <td className="px-4 py-3 font-mono text-xs">{a.referenceNumber}</td>
                </tr>
              ))}
              {!appointments.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-white/40">
                    No appointments yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
