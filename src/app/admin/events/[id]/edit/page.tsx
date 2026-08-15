import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getAdminSessionUser, isAdminUnlocked } from '@/lib/auth/admin-gate';
import { roleHasPermission } from '@/lib/auth/permissions';
import { EventServiceError, getAdminEventById } from '@/lib/events/service';
import EventForm from '@/components/admin/EventForm';
import ConfirmSubmit from '@/components/admin/ConfirmSubmit';
import { AdminNav } from '@/app/admin/counselling/page';
import {
  archiveEventAction,
  cancelEventAction,
  deleteEventAction,
  publishEventAction,
  unpublishEventAction,
} from '@/app/admin/events/actions';

export const metadata = { title: 'Edit Event | LoveCry' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function EditEventPage({
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

  const error = typeof query.error === 'string' ? query.error : null;
  const saved = query.saved === '1';
  const published = query.published === '1';

  return (
    <main className="min-h-screen bg-[#050505] px-6 pb-20 pt-28 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/admin/events" className="text-sm text-[#f1328b]">
              ← Events
            </Link>
            <h1 className="mt-4 text-3xl font-black">Edit event</h1>
            <p className="mt-2 text-sm text-white/55">
              Status: {event.status} ·{' '}
              <Link href={`/admin/events/${event.id}`} className="text-[#f1328b] hover:underline">
                Registrations ({event._count.registrations})
              </Link>
            </p>
          </div>
          <AdminNav />
        </div>

        {error ? (
          <p className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100" role="alert">
            {error}
          </p>
        ) : null}
        {saved ? (
          <p className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            Draft saved.
          </p>
        ) : null}
        {published ? (
          <p className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            Event published.
          </p>
        ) : null}

        {canWrite ? (
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href={`/events/${event.slug}${event.status === 'DRAFT' || event.status === 'ARCHIVED' ? '?preview=1' : ''}`}
              target="_blank"
              className="rounded-full border border-white/15 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white/70"
            >
              Preview
            </Link>
            {event.status !== 'PUBLISHED' && event.status !== 'ARCHIVED' ? (
              <form action={publishEventAction}>
                <input type="hidden" name="eventId" value={event.id} />
                <button
                  type="submit"
                  className="rounded-full bg-gradient-to-r from-[#693492] to-[#f1328b] px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white"
                >
                  Publish
                </button>
              </form>
            ) : null}
            {event.status === 'PUBLISHED' ? (
              <form action={unpublishEventAction}>
                <input type="hidden" name="eventId" value={event.id} />
                <button
                  type="submit"
                  className="rounded-full border border-white/15 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white/70"
                >
                  Unpublish
                </button>
              </form>
            ) : null}
            {event.status !== 'CANCELLED' && event.status !== 'ARCHIVED' ? (
              <form action={cancelEventAction}>
                <input type="hidden" name="eventId" value={event.id} />
                <ConfirmSubmit
                  message="Cancel this event? Registration will close."
                  className="rounded-full border border-white/15 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white/70"
                >
                  Cancel event
                </ConfirmSubmit>
              </form>
            ) : null}
            {event.status !== 'ARCHIVED' ? (
              <form action={archiveEventAction}>
                <input type="hidden" name="eventId" value={event.id} />
                <ConfirmSubmit
                  message="Archive this event? It will leave the public site."
                  className="rounded-full border border-white/15 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white/70"
                >
                  Archive
                </ConfirmSubmit>
              </form>
            ) : null}
            {event.status === 'DRAFT' ? (
              <form action={deleteEventAction}>
                <input type="hidden" name="eventId" value={event.id} />
                <ConfirmSubmit
                  message="Permanently delete this draft? This cannot be undone."
                  className="rounded-full border border-red-400/30 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-red-200"
                >
                  Delete
                </ConfirmSubmit>
              </form>
            ) : null}
          </div>
        ) : (
          <p className="mt-6 text-sm text-white/50">You have read-only access.</p>
        )}

        <EventForm mode="edit" event={event} canWrite={canWrite} />
      </div>
    </main>
  );
}
