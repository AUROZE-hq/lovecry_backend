import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdminUnlocked } from '@/lib/auth/admin-gate';
import { getAdminSessionUser } from '@/lib/auth/admin-gate';
import { roleHasPermission } from '@/lib/auth/permissions';
import { getAdminEvents } from '@/lib/events/service';
import { adminEventFilterSchema, type AdminEventFilter } from '@/lib/events/schemas';
import { classifyEventTiming, formatEventDate, publicLocationLabel } from '@/lib/events/display';
import { AdminNav } from '@/app/admin/counselling/page';

export const metadata = { title: 'Events Admin | LoveCry' };

const filters: { id: AdminEventFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'published', label: 'Published' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'archived', label: 'Archived' },
];

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminEventsPage({ searchParams }: { searchParams: SearchParams }) {
  if (!(await isAdminUnlocked())) redirect('/admin');
  const admin = await getAdminSessionUser();
  const canWrite = admin ? roleHasPermission(admin.role, 'events.write') : false;
  const params = await searchParams;
  const parsed = adminEventFilterSchema.safeParse(params.filter);
  const filter: AdminEventFilter = parsed.success ? parsed.data : 'all';
  const events = await getAdminEvents(filter);
  const notice = typeof params.error === 'string' ? params.error : null;

  return (
    <main className="min-h-screen bg-[#050505] px-6 pb-20 pt-28 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black">Events</h1>
            <p className="mt-2 text-sm text-white/55">Create, publish, and archive community events.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canWrite ? (
              <Link
                href="/admin/events/new"
                className="rounded-full bg-gradient-to-r from-[#693492] to-[#f1328b] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white"
              >
                + Create Event
              </Link>
            ) : null}
            <AdminNav />
          </div>
        </div>

        {notice ? (
          <p className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100">{notice}</p>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Filter events">
          {filters.map((item) => {
            const active = item.id === filter;
            return (
              <Link
                key={item.id}
                href={`/admin/events?filter=${item.id}`}
                role="tab"
                aria-selected={active}
                className={`rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-wider focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f1328b] ${
                  active ? 'bg-[#693492] text-white' : 'border border-white/15 text-white/70'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/[0.04] text-[11px] uppercase tracking-wider text-white/45">
              <tr>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Registration</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-t border-white/10">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{event.title}</div>
                    <div className="text-xs text-white/40">{event.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    {event.status}
                    <div className="text-[10px] uppercase tracking-wider text-white/35">
                      {classifyEventTiming(event)}
                    </div>
                  </td>
                  <td className="px-4 py-3">{formatEventDate(event.startDateTime, event.timezone)}</td>
                  <td className="px-4 py-3">{publicLocationLabel(event)}</td>
                  <td className="px-4 py-3">{event.registrationType.replaceAll('_', ' ')}</td>
                  <td className="px-4 py-3 text-xs text-white/45">{event.updatedAt.toISOString().slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Link href={`/admin/events/${event.id}/edit`} className="text-[#f1328b] hover:underline">
                        Edit
                      </Link>
                      <Link href={`/admin/events/${event.id}`} className="text-white/70 hover:underline">
                        Registrations
                      </Link>
                      {event.status === 'PUBLISHED' || event.status === 'CANCELLED' ? (
                        <Link href={`/events/${event.slug}`} className="text-white/70 hover:underline" target="_blank">
                          Preview
                        </Link>
                      ) : (
                        <Link
                          href={`/events/${event.slug}?preview=1`}
                          className="text-white/70 hover:underline"
                          target="_blank"
                        >
                          Preview
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!events.length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-white/40">
                    No events in this view. Create an event to publish it on /events.
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
