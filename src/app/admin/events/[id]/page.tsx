import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getAdminSessionUser, isAdminUnlocked } from '@/lib/auth/admin-gate';
import { roleHasPermission } from '@/lib/auth/permissions';
import { EventServiceError, getAdminEventById, listEventRegistrations } from '@/lib/events/service';
import { cancelRegistrationAction } from '@/app/admin/events/actions';
import ConfirmSubmit from '@/components/admin/ConfirmSubmit';
import { AdminNav } from '@/app/admin/counselling/page';

export const metadata = { title: 'Event Registrations | LoveCry' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function EventRegistrationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  if (!(await isAdminUnlocked())) redirect('/admin');
  const { id } = await params;
  const query = await searchParams;
  const admin = await getAdminSessionUser();
  const canWrite = admin ? roleHasPermission(admin.role, 'events.write') : false;

  let event;
  try {
    event = await getAdminEventById(id);
  } catch (err) {
    if (err instanceof EventServiceError && err.status === 404) notFound();
    throw err;
  }

  const registrations = await listEventRegistrations(id);
  const error = typeof query.error === 'string' ? query.error : null;

  return (
    <main className="min-h-screen bg-[#050505] px-6 pb-20 pt-28 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/admin/events" className="text-sm text-[#f1328b]">
              ← Events
            </Link>
            <h1 className="mt-4 text-3xl font-black">{event.title}</h1>
            <p className="mt-2 text-sm text-white/55">Registrations</p>
          </div>
          <AdminNav />
        </div>

        {error ? (
          <p className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/admin/events/${event.id}/edit`} className="text-sm text-[#f1328b] hover:underline">
            Edit event
          </Link>
          <a
            href={`/admin/events/${event.id}/registrations.csv`}
            className="text-sm text-white/70 hover:underline"
          >
            Export CSV
          </a>
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/[0.04] text-[11px] uppercase tracking-wider text-white/45">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Registered at</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((row) => (
                <tr key={row.id} className="border-t border-white/10">
                  <td className="px-4 py-3">{row.fullName}</td>
                  <td className="px-4 py-3">{row.email}</td>
                  <td className="px-4 py-3">{row.phone || '—'}</td>
                  <td className="px-4 py-3 text-xs text-white/50">{row.createdAt.toISOString()}</td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3">
                    {canWrite && row.status !== 'CANCELLED' ? (
                      <form action={cancelRegistrationAction}>
                        <input type="hidden" name="eventId" value={event.id} />
                        <input type="hidden" name="registrationId" value={row.id} />
                        <ConfirmSubmit
                          message="Cancel this registration?"
                          className="text-xs text-red-200 hover:underline"
                        >
                          Cancel
                        </ConfirmSubmit>
                      </form>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
              {!registrations.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-white/40">
                    No registrations yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
