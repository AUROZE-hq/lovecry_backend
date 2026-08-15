import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { MEMBER_COOKIE } from '@/lib/auth/member-gate';
import { getMemberProfile } from '@/lib/members/store';
import PortalShell from '@/components/portals/PortalShell';
import { logoutMember } from '@/app/portals/actions';

const nav = [
  { href: '/member/dashboard', label: 'Dashboard' },
  { href: '/member/events', label: 'Events' },
  { href: '/member/counselling', label: 'Counselling' },
  { href: '/member/profile', label: 'Profile' },
];

export const metadata = { title: 'Counselling | LoveCry Member Portal' };

/**
 * Member counselling reuses the production Book Now engine — no duplicate slot store.
 */
export default async function MemberCounsellingPage() {
  const email = (await cookies()).get(MEMBER_COOKIE)?.value;
  if (!email) redirect('/member');

  const profile = getMemberProfile(email);
  const bookHref = '/book-now';

  return (
    <PortalShell
      title="Counselling"
      subtitle="Member Portal"
      email={email}
      nav={nav}
      logoutAction={logoutMember}
    >
      <p className="mb-6 text-sm text-white/55">
        Book and manage counselling appointments through LoveCry&apos;s official booking system.
        Availability, holds, consent, and Google Calendar synchronization are the same as public Book
        Now. This is not an emergency service — if you are in crisis, call local emergency supports.
      </p>

      {profile && (profile.firstName || profile.lastName) && (
        <p className="mb-4 text-sm text-white/70">
          Signed in as {profile.firstName} {profile.lastName}. Your contact details can be entered in
          the booking form; profile pre-fill will expand as member accounts mature.
        </p>
      )}

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <h2 className="text-lg font-bold text-white">Book an appointment</h2>
        <p className="mt-2 text-sm text-white/60">
          Continues to the production counselling booking flow (availability, temporary hold, consent,
          confirmation).
        </p>
        <Link
          href={bookHref}
          className="mt-5 inline-flex rounded-full bg-gradient-to-r from-[#693492] to-[#f1328b] px-6 py-3 text-sm font-bold text-white"
        >
          Open Book Now
        </Link>
      </div>
    </PortalShell>
  );
}
