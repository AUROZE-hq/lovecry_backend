import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { MEMBER_COOKIE } from '@/lib/auth/member-gate';
import { getMemberProfile } from '@/lib/members/store';
import PortalShell from '@/components/portals/PortalShell';
import { logoutMember, saveMemberProfileAction } from '@/app/portals/actions';

const nav = [
  { href: '/member/dashboard', label: 'Dashboard' },
  { href: '/member/events', label: 'Events' },
  { href: '/member/counselling', label: 'Counselling' },
  { href: '/member/profile', label: 'Profile' },
];

export const metadata = { title: 'Member Profile | LoveCry' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function MemberProfilePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const email = (await cookies()).get(MEMBER_COOKIE)?.value;
  if (!email) redirect('/member');

  const profile = getMemberProfile(email);
  const params = await searchParams;

  return (
    <PortalShell
      title="Member profile"
      subtitle="Member Portal"
      email={email}
      nav={nav}
      logoutAction={logoutMember}
    >
      {params.saved === '1' && (
        <p className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Profile saved.
        </p>
      )}

      <form
        action={saveMemberProfileAction}
        className="max-w-xl space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-white/60">
            First name
            <input
              name="firstName"
              defaultValue={profile?.firstName || ''}
              className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#f1328b]/50"
            />
          </label>
          <label className="block text-sm text-white/60">
            Last name
            <input
              name="lastName"
              defaultValue={profile?.lastName || ''}
              className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#f1328b]/50"
            />
          </label>
        </div>
        <label className="block text-sm text-white/60">
          Phone
          <input
            name="phone"
            defaultValue={profile?.phone || ''}
            className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#f1328b]/50"
          />
        </label>
        <label className="block text-sm text-white/60">
          Emergency contact
          <input
            name="emergencyContact"
            defaultValue={profile?.emergencyContact || ''}
            className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#f1328b]/50"
          />
        </label>
        <label className="block text-sm text-white/60">
          Notes for LoveCry staff (optional)
          <textarea
            name="notes"
            rows={3}
            defaultValue={profile?.notes || ''}
            className="mt-2 w-full resize-none rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#f1328b]/50"
          />
        </label>
        <button
          type="submit"
          className="rounded-full bg-gradient-to-r from-[#693492] to-[#f1328b] px-6 py-3 text-sm font-bold text-white"
        >
          Save profile
        </button>
      </form>
    </PortalShell>
  );
}
