import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Calendar, HeartHandshake, UserRound, Megaphone } from 'lucide-react';
import { MEMBER_COOKIE } from '@/lib/auth/member-gate';
import { MEMBER_ANNOUNCEMENTS } from '@/lib/members/data';
import { getMemberProfile, listBookings } from '@/lib/members/store';
import { getRegistrationsForEmail } from '@/lib/events/service';
import PortalShell from '@/components/portals/PortalShell';
import { logoutMember } from '@/app/portals/actions';

const nav = [
  { href: '/member/dashboard', label: 'Dashboard' },
  { href: '/member/events', label: 'Events' },
  { href: '/member/counselling', label: 'Counselling' },
  { href: '/member/profile', label: 'Profile' },
];

export const metadata = { title: 'Member Dashboard | LoveCry' };
export const dynamic = 'force-dynamic';

export default async function MemberDashboardPage() {
  const email = (await cookies()).get(MEMBER_COOKIE)?.value;
  if (!email) redirect('/member');

  const profile = getMemberProfile(email);
  const regs = await getRegistrationsForEmail(email);
  const bookings = listBookings(email);
  const name = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || 'Member';

  return (
    <PortalShell
      title={`Welcome, ${name}`}
      subtitle="Member Portal"
      email={email}
      nav={nav}
      logoutAction={logoutMember}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Event registrations', value: String(regs.length), href: '/member/events', icon: Calendar },
          {
            label: 'Counselling requests',
            value: String(bookings.length),
            href: '/member/counselling',
            icon: HeartHandshake,
          },
          { label: 'Profile', value: profile?.phone ? 'Updated' : 'Add details', href: '/member/profile', icon: UserRound },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-[#f1328b]/40"
            >
              <Icon className="h-5 w-5 text-[#f1328b]" />
              <p className="mt-4 text-[11px] uppercase tracking-widest text-white/40">{card.label}</p>
              <p className="mt-1 text-xl font-black">{card.value}</p>
            </Link>
          );
        })}
      </div>

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-[#f1328b]" />
          <h2 className="text-lg font-bold">Announcements</h2>
        </div>
        <ul className="mt-4 space-y-4">
          {MEMBER_ANNOUNCEMENTS.map((a) => (
            <li key={a.id}>
              <p className="font-semibold text-white/90">{a.title}</p>
              <p className="mt-1 text-sm text-white/55">{a.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-6 text-sm text-white/45">
        Want to support LoveCry?{' '}
        <Link href="/donate" className="text-[#f1328b] hover:underline">
          Donate
        </Link>{' '}
        or open the{' '}
        <Link href="/donor" className="text-[#f1328b] hover:underline">
          Donor Portal
        </Link>
        .
      </p>
    </PortalShell>
  );
}
