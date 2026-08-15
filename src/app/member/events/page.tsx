import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { MEMBER_COOKIE } from '@/lib/auth/member-gate';
import { getPublishedUpcomingEvents, getRegistrationsForEmail } from '@/lib/events/service';
import { ctaForEvent, formatEventDate, formatEventTimeRange, publicLocationLabel } from '@/lib/events/display';
import PortalShell from '@/components/portals/PortalShell';
import { cancelEventAction, logoutMember, registerEventAction } from '@/app/portals/actions';

const nav = [
  { href: '/member/dashboard', label: 'Dashboard' },
  { href: '/member/events', label: 'Events' },
  { href: '/member/counselling', label: 'Counselling' },
  { href: '/member/profile', label: 'Profile' },
];

export const metadata = { title: 'Member Events | LoveCry' };
export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function MemberEventsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const email = (await cookies()).get(MEMBER_COOKIE)?.value;
  if (!email) redirect('/member');

  const [regs, events] = await Promise.all([
    getRegistrationsForEmail(email),
    getPublishedUpcomingEvents(),
  ]);
  const registeredIds = new Set(regs.map((r) => r.eventId));
  const params = await searchParams;
  const error = typeof params.error === 'string' ? params.error : null;

  return (
    <PortalShell
      title="Events & registration"
      subtitle="Member Portal"
      email={email}
      nav={nav}
      logoutAction={logoutMember}
    >
      {params.registered === '1' && (
        <p className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          You&apos;re registered. We&apos;ll share reminders closer to the date.
        </p>
      )}
      {error ? (
        <p className="mb-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100" role="alert">
          {error}
        </p>
      ) : null}

      {regs.length > 0 && (
        <section className="mb-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/50">Your registrations</h2>
          <ul className="mt-3 space-y-3">
            {regs.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <Link href={`/events/${r.event.slug}`} className="hover:text-[#f1328b]">
                  {r.event.title}
                </Link>
                <form action={cancelEventAction}>
                  <input type="hidden" name="registrationId" value={r.id} />
                  <button type="submit" className="text-xs text-white/45 hover:text-[#f1328b]">
                    Cancel
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="space-y-4">
        {events.map((event) => {
          const already = registeredIds.has(event.id);
          const cta = ctaForEvent(event);
          return (
            <article
              key={event.id}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  {event.eventCategory ? (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#f1328b]">
                      {event.eventCategory}
                    </p>
                  ) : null}
                  <h2 className="mt-1 text-xl font-bold">{event.title}</h2>
                  <p className="mt-2 text-sm text-white/55">{event.shortDescription}</p>
                  <p className="mt-3 text-xs text-white/40">
                    {formatEventDate(event.startDateTime, event.timezone)} ·{' '}
                    {formatEventTimeRange(event.startDateTime, event.endDateTime, event.timezone)} ·{' '}
                    {publicLocationLabel(event)}
                  </p>
                </div>
                {already ? (
                  <span className="rounded-full border border-emerald-500/30 px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
                    Registered
                  </span>
                ) : event.registrationType === 'INTERNAL_REGISTRATION' && event.status === 'PUBLISHED' ? (
                  <form action={registerEventAction}>
                    <input type="hidden" name="eventId" value={event.id} />
                    <button
                      type="submit"
                      className="rounded-full bg-gradient-to-r from-[#693492] to-[#f1328b] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white"
                    >
                      Register
                    </button>
                  </form>
                ) : (
                  <Link
                    href={cta.href}
                    className="rounded-full border border-white/15 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white/80"
                  >
                    {cta.label}
                  </Link>
                )}
              </div>
            </article>
          );
        })}
        {!events.length ? (
          <p className="rounded-2xl border border-white/10 px-5 py-8 text-sm text-white/50">
            Upcoming events will be announced soon.
          </p>
        ) : null}
      </div>
    </PortalShell>
  );
}
